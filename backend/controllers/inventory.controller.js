const { withTransaction } = require("../utils/transaction");
const { logAudit } = require("../utils/auditLogger");
const db = require("../config/db");
const AppError = require("../utils/appError");
exports.syncInventory = async (req, res, next) => {
  try {
    const { product_id, location_id, location_type, quantity, low_stock_threshold } = req.body;
    const { user_id } = req.user;

    if (!product_id || !location_id || !location_type || !quantity) {
      throw new AppError("All fields are required",400)
    }
    if (!["store", "warehouse"].includes(location_type)) {
      throw new AppError("Invalid location_type",400);
    }
    if (Number(quantity) <= 0) {
      throw new AppError("Quantity must be > 0",400);
    }

    await withTransaction(async (conn) => {
      const sql = `
        INSERT INTO inventory 
          (product_id, location_id, location_type, current_stock, low_stock_threshold, last_restocked_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          current_stock       = current_stock + VALUES(current_stock),
          low_stock_threshold = VALUES(low_stock_threshold),
          last_restocked_at   = NOW()
      `;

      await conn.query(sql, [
        product_id,
        location_id,
        location_type,
        Number(quantity),
        low_stock_threshold ?? 10,
      ]);

      
    });

    res.json({ success: true, message: "Inventory updated successfully" });
    await logAudit(db, user_id, "UPDATE", "inventory", location_id, {
        product_id,
        quantity,
        location_type,
      },req.ip);
  } catch (error) {
    next(error);
  }
};

exports.transferStock = async (req, res, next) => {
  try {
    const {
      product_id,
      from_location_id,
      from_location_type,
      to_location_id,
      to_location_type,
      quantity,
    } = req.body;

    const { user_id } = req.user;

    // ✅ VALIDATION
    if (
      !product_id ||
      !from_location_id ||
      !to_location_id ||
      !from_location_type ||
      !to_location_type ||
      !quantity
    ) {
      throw new AppError("All fields are required", 400);
    }

    if (Number(quantity) <= 0) {
      throw new AppError("Quantity must be greater than 0", 400);
    }

    if (
      from_location_type === to_location_type &&
      from_location_id === to_location_id
    ) {
      throw new AppError("Source and destination cannot be same", 400);
    }

    await withTransaction(async (conn) => {

      // LOCK ROW (CRITICAL)
      const [[source]] = await conn.query(
        `SELECT current_stock 
         FROM inventory 
         WHERE product_id = ? 
           AND location_type = ? 
           AND location_id = ?
         FOR UPDATE`,
        [product_id, from_location_type, from_location_id] 
      );

      if (!source) {
        throw new AppError("Source inventory not found", 404);
      }

      if (source.current_stock < quantity) {
        throw new AppError("Insufficient stock", 400);
      }

      // DEDUCT FROM SOURCE
      await conn.query(
        `UPDATE inventory 
         SET current_stock = current_stock - ?, updated_at = NOW()
         WHERE product_id = ? 
           AND location_type = ? 
           AND location_id = ?`,
        [quantity, product_id, from_location_type, from_location_id]
      );

      // ADD TO DESTINATION
      await conn.query(
        `INSERT INTO inventory 
          (product_id, location_id, location_type, current_stock, low_stock_threshold, last_restocked_at)
         VALUES (?, ?, ?, ?, 10, NOW())
         ON DUPLICATE KEY UPDATE
           current_stock = current_stock + VALUES(current_stock),
           last_restocked_at = NOW(),
           updated_at = NOW()`,
        [product_id, to_location_id, to_location_type, quantity]
      );

      // RECORD MOVEMENT
      await conn.query(
        `INSERT INTO stock_movements 
          (product_id, from_location_id, from_location_type, to_location_id, to_location_type, quantity, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          from_location_id,
          from_location_type,
          to_location_id,
          to_location_type,
          quantity,
          user_id,
        ]
      );

      
    });

    res.json({
      success: true,
      message: "Stock transferred successfully",
    });
    // AUDIT
      await logAudit(
        db,
        user_id,
        "TRANSFER_STOCK",
        "inventory",
        product_id,
        {
          from: { id: from_location_id, type: from_location_type },
          to: { id: to_location_id, type: to_location_type },
          quantity,
        },
        req.ip
      );
  } catch (error) {
    next(error);
  }
};

exports.getInventory = async (req, res,next) => {
  try {
    const { location_type, location_id, page = 1, limit = 15 } = req.query;
    const offset = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);

    const conditions = ["1=1"];
    const params = [];

    if (location_type) {
      conditions.push("i.location_type = ?");
      params.push(location_type);
    }
    if (location_id) {
      conditions.push("i.location_id = ?");
      params.push(location_id);
    }

    const where = conditions.join(" AND ");

    const [rows] = await db.query(`
      SELECT 
        i.inventory_id,
        i.location_id,
        i.location_type,
        i.current_stock,
        i.low_stock_threshold,
        i.last_restocked_at,
        p.product_name,
        p.category,
        COALESCE(st.store_name, w.warehouse_name) AS location_name
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      LEFT JOIN stores st     ON i.location_type = 'store'     AND i.location_id = st.store_id
      LEFT JOIN warehouses w  ON i.location_type = 'warehouse' AND i.location_id = w.warehouse_id
      WHERE ${where}
      ORDER BY i.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM inventory i WHERE ${where}`,
      params
    );

    res.json({ success: true, total, data: rows });

  } catch (error) {
    next(error);
  }
};

exports.getLowStockByStore = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        i.inventory_id,
        i.current_stock,
        i.low_stock_threshold,
        p.product_name,
        p.category
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      WHERE i.location_type = 'store'
        AND i.location_id = ?
        AND i.current_stock <= i.low_stock_threshold
      ORDER BY i.current_stock ASC
    `, [store_id]);

    res.json({ success: true, data: rows });

  } catch (error) {
    next(error);
  }
};

exports.getProductsByWarehouse = async (req, res, next) => {
  try {
    const { warehouse_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        i.product_id,
        p.product_name,
        p.category,
        i.current_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      WHERE i.location_type = "warehouse"
        AND i.location_id = ?
        AND i.current_stock > 0
    `, [warehouse_id]);

    res.json({ success: true, data: rows });

  } catch (error) {
    next(error);
  }
};