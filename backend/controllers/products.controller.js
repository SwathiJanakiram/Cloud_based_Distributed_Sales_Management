const { withTransaction } = require("../utils/transaction");
const { logAudit } = require("../utils/auditLogger");
const  AppError = require("../utils/appError");
const db = require("../config/db");

exports.createProduct = async (req, res, next) => {
  try {
    let { product_name, category, unit_price } = req.body;
    const { user_id } = req.user;

    product_name = product_name?.trim();
    category = category?.trim() || null;

    if (!product_name || !unit_price) {
      throw new AppError("product_name and unit_price are required", 400);
    }

    if (Number(unit_price) <= 0) {
       throw new AppError("unit_price must be > 0", 400);
    }

    let newId;

    await withTransaction(async (conn) => {
      const [existing] = await conn.query(
        `SELECT product_id 
         FROM products 
         WHERE product_name = ?
           AND is_deleted = 0`,
        [product_name],
      );

      if (existing.length > 0) {
        throw new AppError("Product already exists", 400);
      }

      const [result] = await conn.query(
        `INSERT INTO products 
         (product_name, category, unit_price, created_by) 
         VALUES (?, ?, ?, ?)`,
        [product_name, category, unit_price, user_id],
      );

      newId = result.insertId;
      
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product_id: newId },
    });
    await logAudit(
        db,
        user_id,
        "CREATE",
        "products",
        newId,
        { product_name, category, unit_price },
        req.ip,
      );
  } catch (error) {
    next(error);
  }
};
exports.updateProduct = async (req, res, next) => {
  try {
    let { product_name, category, unit_price, product_id } = req.body;
    const { user_id } = req.user;

    product_name = product_name?.trim();
    category = category?.trim() || null;

    if (!product_name || !unit_price || !product_id) {
      throw new AppError(
        "product_name, product_id and unit_price are required",
        400,
      );
    }

    if (Number(unit_price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "unit_price must be > 0",
      });
    }
    let old;

    await withTransaction(async (conn) => {
      // check existence
      [old] = await conn.query(
        `SELECT product_name, category, unit_price 
         FROM products 
         WHERE product_id = ? AND is_deleted = 0`,
        [product_id],
      );

      if (!old.length) {
        throw new AppError("Product not found", 400);
      }

      const [result] = await conn.query(
        `UPDATE products 
         SET product_name = ?, 
             category = ?, 
             unit_price = ?, 
             updated_by = ?
         WHERE product_id = ?`,
        [product_name, category, unit_price, user_id, product_id],
      );

      if (result.affectedRows === 0) {
        throw new AppError("Update failed", 400);
      }

      
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });

    await logAudit(
        db,
        user_id,
        "UPDATE",
        "products",
        product_id,
        {
          before: old[0],
          after: { product_name, category, unit_price },
        },
        req.ip,
      );
  } catch (error) {
    next(error);
  }
};
exports.deleteProduct = async (req, res, next) => {
  try {
    const product_id = parseInt(req.params.id);
    const { user_id } = req.user;

    if (!product_id) {
      throw new AppError("Invalid product_id", 400);
    }
    let old ;
    await withTransaction(async (conn) => {
      // get old data
      [old] = await conn.query(
        `SELECT * FROM products WHERE product_id = ?`,
        [product_id],
      );

      if (!old.length) {
        throw new AppError("Product not found", 400);
      }

      const [result] = await conn.query(
        `UPDATE products 
         SET is_deleted = 1, updated_by = ?
         WHERE product_id = ?`,
        [user_id, product_id],
      );

      if (result.affectedRows === 0) {
        throw new AppError("Delete failed", 400);
      }

     
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
     await logAudit(
        db,
        user_id,
        "DELETE",
        "products",
        product_id,
        {
          deleted: true,
          previous: old[0],
        },
        req.ip,
      );
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      "SELECT * FROM products WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM products WHERE is_deleted = 0",
    );

    res.json({ success: true, page, total, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getProductsByStore = async (req, res, next) => {
  try {
    let { store_id } = req.query;
    if (req.user.role === "salesperson" || req.user.role === "store_manager") {
      const [store] = await db.query(
        `
        SELECT location_id FROM user_location_assignments 
        WHERE user_id= ? AND location_type="store" LIMIT 1 `,
        [req.user.user_id],
      );

      store_id = store.length > 0 ? store[0].location_id : null;
    }
    const [product] = await db.query(
      `SELECT * from products p
      JOIN inventory i on p.product_id = i.product_id
      WHERE i.location_type ="store" AND
      i.location_id =? AND
      i.current_stock > 0 `,
      [store_id],
    );
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
