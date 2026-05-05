const db = require("../config/db");


//  Flag suspicious activity
const flagSuspicious = async (connection, user_id, reason, severity = "medium") => {
  await connection.query(
    `INSERT INTO suspicious_logs (user_id, reason, severity)
     VALUES (?, ?, ?)`,
    [user_id, reason, severity]
  );
};


//  Detect suspicious behavior
const detectSuspicious = async (connection, user_id, action, details) => {

  //  Large sale
  if (action === "CREATE" && entity =="sales" && details.quantity > 50) {
    await flagSuspicious(connection, user_id, "Large quantity sale", "high");
  }

  //  Price manipulation
  if (action === "UPDATE" && entity =="products"  && details.unit_price?.before !== undefined) {
    const diff = Math.abs(details.unit_price.after - details.unit_price.before);
    if (diff > 1000) {
      await flagSuspicious(connection, user_id, "Suspicious price change", "high");
    }
  }

  //  Too many deletes
  if (action.startsWith("DELETE")) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as count
       FROM audit_logs
       WHERE user_id = ?
         AND action LIKE 'DELETE_%'
         AND created_at >= NOW() - INTERVAL 5 MINUTE`,
      [user_id]
    );

    if (rows[0].count > 5) {
      await flagSuspicious(connection, user_id, "Too many deletes", "high");
    }
  }
};


// AUDIT FUNCTION
exports.logAudit = async (
  connection,
  user_id,
  action,
  entity,
  entity_id,
  details,
  ip = null
) => {
  await connection.query(
    `INSERT INTO audit_logs 
     (user_id, action, entity, entity_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      action,
      entity,
      entity_id,
      JSON.stringify(details),
      ip
    ]
  );

  try {
    await detectSuspicious(connection, user_id,entity, action, details);
  } catch (e) {
    console.error("Detection failed:", e.message);
  }
};