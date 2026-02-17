const db = require("../config/db");

/**
 * POST /products
 * Create new product
 */
exports.createProduct = async (req, res) => {
  try {
    const { product_name, category, unit_price } = req.body;

    if (!product_name || !unit_price) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    if (unit_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0"
      });
    }

    // Prevent duplicate product name
    const [existing] = await db.query(
      "SELECT product_id FROM products WHERE product_name = ?",
      [product_name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Product already exists"
      });
    }

    await db.query(
      "INSERT INTO products (product_name, category, unit_price) VALUES (?, ?, ?)",
      [product_name, category || null, unit_price]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /products
 * Fetch all products with optional pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      "SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [countResult] = await db.query(
      "SELECT COUNT(*) AS total FROM products"
    );

    res.json({
      success: true,
      page,
      total: countResult[0].total,
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
