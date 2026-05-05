// controllers/sales_controller.js
const db = require("../config/db");
const logger = require("../utils/logger");
const { logAudit } = require("../utils/auditLogger");

// POST /sales
exports.createSale = async (req, res) => {
  const { product_id, store_id, quantity, salesperson_id } = req.body;
  const user_id = req.user.user_id;

  if (!product_id || !store_id || !quantity) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });
  }

  const connection = await db.getConnection();
  let saleId, total_amount;

  try {
    await connection.beginTransaction();

    const [[product]] = await connection.query(
      `SELECT unit_price FROM products 
       WHERE product_id = ? AND is_deleted = 0`,
      [product_id]
    );

    if (!product) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    total_amount = product.unit_price * Number(quantity);

    const [updateResult] = await connection.query(
      `UPDATE inventory
       SET current_stock = current_stock - ?
       WHERE product_id = ?
         AND location_id = ?
         AND location_type = 'store'
         AND current_stock >= ?`,
      [quantity, product_id, store_id, quantity]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient stock or product not available in this store",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO sales
        (product_id, store_id, user_id, quantity, total_amount, sold_at, status, created_by)
       VALUES (?, ?, ?, ?, ?, NOW(), 'completed', ?)`,
      [
        product_id,
        store_id,
        salesperson_id,
        Number(quantity),
        total_amount,
        user_id,
      ]
    );

    saleId = result.insertId;

    await connection.commit();

    // ✅ Respond immediately
    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: { sale_id: saleId, total_amount },
    });

    // 🔥 Fire-and-forget audit
    logAudit(
      db,
      user_id,
      "CREATE",
      "sales",
      saleId,
      {
        product_id,
        store_id,
        quantity,
        salesperson_id,
        total_amount,
      },
      req.ip
    ).catch(err => logger.error("Audit failed:", err));

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
// GET /sales/my
exports.getMySales = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [rows] = await db.query(
      `SELECT
         s.sale_id,
         s.quantity,
         s.total_amount,
         s.sold_at,
         s.status,
         p.product_name,
         st.store_name
       FROM sales s
       JOIN products p  ON s.product_id = p.product_id
       JOIN stores  st  ON s.store_id   = st.store_id
       WHERE s.user_id    = ?
         AND s.is_deleted = 0
       ORDER BY s.sold_at DESC`,
      [user_id],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error(`getMySales error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /sales/store/:store_id
exports.getStoreSales = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [rows] = await db.query(
      `SELECT
         s.sale_id,
         s.quantity,
         s.total_amount,
         s.sold_at,
         s.status,
         p.product_name,
         u.name AS salesperson
       FROM sales s
       JOIN products p ON s.product_id = p.product_id
       JOIN users    u ON s.user_id    = u.user_id
       WHERE s.store_id   = ?
         AND s.is_deleted = 0
       ORDER BY s.sold_at DESC`,
      [store_id],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
