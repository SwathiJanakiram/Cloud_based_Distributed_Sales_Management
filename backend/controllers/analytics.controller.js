const db = require("../config/db");

/**
 * GET /analytics/summary
 * Returns total revenue, total sales count, total quantity
 */
exports.getSummary = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) AS totalSales,
        COALESCE(SUM(quantity), 0) AS totalQuantity,
        COALESCE(SUM(total_amount), 0) AS totalRevenue
      FROM sales
    `);

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /analytics/region
 * Revenue grouped by region
 */
exports.getRevenueByRegion = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        stores.region,
        COALESCE(SUM(sales.total_amount), 0) AS revenue
      FROM sales
      JOIN stores ON sales.store_id = stores.store_id
      GROUP BY stores.region
      ORDER BY revenue DESC
    `);

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

/**
 * GET /analytics/top-products
 * Top 5 products by quantity sold
 */
exports.getTopProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        products.product_name,
        COALESCE(SUM(sales.quantity), 0) AS totalSold
      FROM sales
      JOIN products ON sales.product_id = products.product_id
      GROUP BY products.product_id
      ORDER BY totalSold DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
