const db = require("../config/db");

// GET /analytics/admin/summary
exports.getAdminSummary = async (req, res) => {
  try {
    const { startDate } = req.query;
    let query = `
      SELECT 
        COUNT(*) AS totalSales,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedSales,
        SUM(quantity) AS totalQuantity,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS totalRevenue,
        COUNT(DISTINCT store_id) AS totalStores
      FROM sales
      WHERE is_deleted = 0`;
    let values = [];
    if (startDate && startDate!="null"){
      query+=' AND sold_at >= ?';
      values.push(startDate)
    }
    const [[summary]] = await db.query(query,values);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/admin/revenue-region
exports.getRevenueByRegion = async (req, res) => {
  try {
    const { startDate } = req.query;
    let query = `SELECT 
        r.region_id,
        r.region_name AS region,
        SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END) AS revenue
      FROM regions r
      LEFT JOIN stores st ON st.region_id = r.region_id
      LEFT JOIN sales s   ON s.store_id = st.store_id AND s.is_deleted = 0`;
    let values=[]

    if (startDate && startDate!="null"){
      query+=' WHERE s.sold_at >= ?';
      values.push(startDate)
    }

    query+=` GROUP BY r.region_id, r.region_name
      ORDER BY revenue DESC
    `
    const [rows] = await db.query(query,values);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/admin/top-products
exports.getTopProducts = async (req, res) => {
  try {
    const { startDate } = req.query;
    let query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.category,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.quantity ELSE 0 END), 0)      AS totalSold,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END), 0)  AS totalRevenue
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.product_id 
      WHERE p.is_deleted = 0`;
    let values=[]
    
    if (startDate && startDate!="null"){
      query+=' AND s.sold_at >= ? ';
      values.push(startDate)
    }
    query+= ` GROUP BY p.product_id, p.product_name, p.category
      ORDER BY totalSold DESC
      LIMIT 5
    `
    const [rows] = await db.query( query,values);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/admin/store-performance
exports.getStorePerformance = async (req, res) => {
  try {
    const {startDate}= req.query;
    let query= `SELECT 
        st.store_id,
        st.store_name,
        st.city,
        r.region_name AS region,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END), 0) AS totalRevenue,
        COALESCE(COUNT(CASE WHEN s.status = 'completed' THEN 1 END), 0)                   AS totalOrders
      FROM stores st
      JOIN regions r ON st.region_id = r.region_id
      LEFT JOIN sales s ON s.store_id = st.store_id AND s.is_deleted = 0`;
    let values=[];
    if (startDate && startDate!="null"){
      query+=' WHERE s.sold_at >= ? ';
      values.push(startDate)
    }
    query+=` GROUP BY st.store_id, st.store_name, st.city, r.region_name
      ORDER BY totalRevenue DESC
    `
    const [rows] = await db.query(query,values);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/region/:region_id/trend
exports.getRegionMonthlyTrend = async (req, res) => {
  try {
    const { region_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(s.sold_at, '%Y-%m') AS month,
        SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END) AS revenue
      FROM sales s
      JOIN stores st ON s.store_id = st.store_id
      WHERE st.region_id = ?
        AND s.is_deleted = 0
        AND s.sold_at IS NOT NULL
      GROUP BY DATE_FORMAT(s.sold_at, '%Y-%m')
      ORDER BY month ASC
    `, [region_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/region/:region_id/salespersons
exports.getSalespersonPerformance = async (req, res) => {
  try {
    const { region_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END) AS totalRevenue,
        SUM(CASE WHEN s.status = 'completed' THEN s.quantity     ELSE 0 END) AS totalQuantity,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)                   AS totalTransactions
      FROM sales s
      JOIN users u  ON s.user_id  = u.user_id
      JOIN stores st ON s.store_id = st.store_id
      WHERE st.region_id = ?
        AND s.is_deleted = 0
      GROUP BY u.user_id, u.name, u.email
      ORDER BY totalRevenue DESC
    `, [region_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/store/:store_id/summary
exports.getStoreSummary = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [[summary]] = await db.query(`
      SELECT 
        st.store_name AS storeName,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END), 0) AS totalRevenue,
        COALESCE(COUNT(*), 0)                                                              AS totalSales,
        COALESCE(COUNT(CASE WHEN s.status = 'completed' THEN 1 END), 0)                   AS completedSales,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.quantity ELSE 0 END), 0)     AS totalQuantity
      FROM stores st
      LEFT JOIN sales s ON s.store_id = st.store_id AND s.is_deleted = 0
      WHERE st.store_id = ?
      GROUP BY st.store_id, st.store_name
    `, [store_id]);

    res.json({ success: true, data: summary ?? {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/store/:store_id/salespersons
exports.getStoreSalespersonStats = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        SUM(CASE WHEN s.status = 'completed' THEN s.total_amount ELSE 0 END) AS totalRevenue,
        SUM(CASE WHEN s.status = 'completed' THEN s.quantity     ELSE 0 END) AS totalQuantity,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)                   AS totalTransactions
      FROM sales s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.store_id = ?
        AND s.is_deleted = 0
      GROUP BY u.user_id, u.name, u.email
      ORDER BY totalRevenue DESC
    `, [store_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/store/:store_id/top-products
exports.getStoreTopProducts = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        p.product_name,
        SUM(CASE WHEN s.status = 'completed' THEN s.quantity ELSE 0 END) AS totalSold
      FROM sales s
      JOIN products p ON s.product_id = p.product_id
      WHERE s.store_id = ?
      GROUP BY p.product_id, p.product_name
      ORDER BY totalSold DESC
      LIMIT 5
    `, [store_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /analytics/store/:store_id/trend
exports.getStoreMonthlyTrend = async (req, res) => {
  try {
    const { store_id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(sold_at, '%Y-%m') AS month,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS revenue
      FROM sales
      WHERE store_id = ?
        AND is_deleted = 0
        AND sold_at IS NOT NULL
      GROUP BY DATE_FORMAT(sold_at, '%Y-%m')
      ORDER BY month ASC
    `, [store_id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};