const { withTransaction } = require("../utils/transaction");
const { logAudit } = require("../utils/auditLogger");
const AppError = require("../utils/AppError");
const db = require("../config/db");

exports.getWarehouse = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT w.warehouse_id,
        w.warehouse_name,
        w.address,
        w.longitude,
        w.latitude,
        w.created_at,
        r.region_id,
        r.region_name AS region
       FROM warehouses w 
       LEFT JOIN regions r ON w.region_id = r.region_id
       WHERE w.is_deleted = 0
       ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM warehouses WHERE is_deleted = 0",
    );
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, page, total, totalPages, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    let { warehouse_name, region_id, address, latitude, longitude } = req.body;
    const { user_id } = req.user;

    warehouse_name = warehouse_name?.trim();
    address = address?.trim() || null;

    if (!warehouse_name || !region_id) {
      throw new AppError("Warehouse name and Region are required", 400);
    }

    let insertId;

    await withTransaction(async (conn) => {
      const [existing] = await conn.query(
        `SELECT warehouse_id 
         FROM warehouses 
         WHERE warehouse_name = ?
           AND region_id = ? 
           AND is_deleted = 0`,
        [warehouse_name, region_id]
      );

      if (existing.length > 0) {
        throw new AppError("Warehouse already exists in this region", 400);
      }

      const [result] = await conn.query(
        `INSERT INTO warehouses 
         (warehouse_name, region_id, address, latitude, longitude, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          warehouse_name,
          region_id,
          address,
          latitude || null,
          longitude || null,
          user_id,
        ]
      );

      insertId = result.insertId;
    });

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
    });

    //  audit AFTER response (non-blocking)
    logAudit(
      db,
      user_id,
      "CREATE",
      "warehouses",
      insertId,
      { warehouse_name, region_id, address },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { warehouse_name, address, latitude, longitude } = req.body;
    const { user_id } = req.user;

    warehouse_name = warehouse_name?.trim();
    address = address?.trim() || null;

    if (!warehouse_name) {
      throw new AppError("Warehouse name is required", 400);
    }

    let oldData;

    await withTransaction(async (conn) => {
      const [old] = await conn.query(
        `SELECT warehouse_name, address, latitude, longitude 
         FROM warehouses 
         WHERE warehouse_id = ? AND is_deleted = 0`,
        [id]
      );

      if (!old.length) throw new AppError("Warehouse not found", 404);

      oldData = old[0];

      const [result] = await conn.query(
        `UPDATE warehouses 
         SET warehouse_name = ?, 
             address = ?, 
             latitude = ?, 
             longitude = ?, 
             updated_by = ?
         WHERE warehouse_id = ?`,
        [
          warehouse_name,
          address,
          latitude || null,
          longitude || null,
          user_id,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        throw new AppError("Update failed", 400);
      }
    });

    res.json({
      success: true,
      message: "Warehouse updated successfully",
    });

    logAudit(
      db,
      user_id,
      "UPDATE",
      "warehouses",
      Number(id),
      {
        before: oldData,
        after: { warehouse_name, address, latitude, longitude },
      },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};


exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    let oldData;

    await withTransaction(async (conn) => {
      const [stock] = await conn.query(
        `SELECT inventory_id 
         FROM inventory 
         WHERE location_id = ? 
           AND location_type = 'warehouse' 
           AND current_stock > 0`,
        [id]
      );

      if (stock.length > 0) {
        throw new AppError("Cannot delete warehouse with existing stock", 400);
      }

      const [old] = await conn.query(
        `SELECT * FROM warehouses WHERE warehouse_id = ?`,
        [id]
      );

      if (!old.length) {
        throw new AppError("Warehouse not found", 404);
      }

      oldData = old[0];

      const [result] = await conn.query(
        `UPDATE warehouses 
         SET is_deleted = 1, updated_by = ?
         WHERE warehouse_id = ?`,
        [user_id, id]
      );

      if (result.affectedRows === 0) {
        throw new AppError("Delete failed", 400);
      }
    });

    res.json({
      success: true,
      message: "Warehouse deleted successfully",
    });

    logAudit(
      db,
      user_id,
      "DELETE",
      "warehouses",
      Number(id),
      {
        deleted: true,
        previous: oldData,
      },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};