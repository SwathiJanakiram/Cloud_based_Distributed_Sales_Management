const db = require("../config/db");

/**
 * POST /stores
 * Create new store
 */
exports.createStore = async (req, res) => {
  try {
    const { store_name, city, region } = req.body;

    if (!store_name || !city || !region) {
      return res.status(400).json({
        success: false,
        message: "Store name, city, and region are required"
      });
    }

    // Prevent duplicate store
    const [existing] = await db.query(
      "SELECT store_id FROM stores WHERE store_name = ?",
      [store_name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Store already exists"
      });
    }

    await db.query(
      "INSERT INTO stores (store_name, city, region) VALUES (?, ?, ?)",
      [store_name, city, region]
    );

    res.status(201).json({
      success: true,
      message: "Store created successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /stores
 * Fetch all stores
 */
exports.getStores = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM stores ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
