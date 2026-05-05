const db = require("../config/db");

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, user_id, start_date, end_date } = req.query;

    let query = `SELECT 
    al.id,
    al.action,
    CONVERT_TZ(al.created_at, '+00:00', '+05:30') AS created_at,
    u.user_id,
    u.name AS user_name,
    u.email,
    al.entity,
    al.details
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.user_id
  WHERE 1=1
`;
    let values = [];

    if (action) {
      query += ` AND al.action LIKE ?`;
      values.push(`${action}%`);
    }

    if (user_id) {
      query += ` AND u.user_id = ?`;
      values.push(user_id);
    }

    if (start_date && end_date) {
      query += ` AND al.created_at BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }

    query += ` ORDER BY al.created_at DESC`;

    console.log("QUERY:", query);
    console.log("VALUES:", values);

    const [rows] = await db.query(query, values);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};
