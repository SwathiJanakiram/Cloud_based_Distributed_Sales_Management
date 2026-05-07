// controllers/assignment_controller.js
const db = require("../config/db");
const AppError = require("../utils/appError");
const { withTransaction } = require("../utils/transaction");
const { logAudit } = require("../utils/auditLogger");

// GET /assignments?user_id=x
exports.getAssignments = async (req, res, next) => {
  try {
    const { user_id } = req.params;

const [rows] = await db.query(`SELECT 
         ula.assignment_id,
         ula.user_id,
         u.name AS user_name,
         u.role,
         ula.location_id,
         ula.location_type,
         COALESCE(s.store_name, w.warehouse_name) AS location_name,
         ula.is_active,
         ula.created_at
       FROM user_location_assignments ula
       JOIN users u ON ula.user_id = u.user_id
       LEFT JOIN stores     s ON ula.location_type = 'store'     AND ula.location_id = s.store_id
       LEFT JOIN warehouses w ON ula.location_type = 'warehouse' AND ula.location_id = w.warehouse_id
       WHERE ula.is_active = 1 AND ula.user_id = ? 
       ORDER BY u.name ASC
`, [user_id]);


    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// POST /assignments
exports.createAssignment = async (req, res, next) => {
  try {
    const { user_id, location_id, location_type } = req.body;
    const { user_id: created_by } = req.user;

    if (!user_id || !location_id || !location_type) {
      throw new AppError("user_id, location_id, location_type are required", 400);
    }
    if (!["store", "warehouse"].includes(location_type)) {
      throw new AppError("location_type must be store or warehouse", 400);
    }

    let insertId;

    await withTransaction(async (conn) => {
      const [existing] = await conn.query(
        `SELECT assignment_id FROM user_location_assignments
         WHERE user_id = ? AND location_id = ? AND location_type = ?`,
        [user_id, location_id, location_type]
      );

      if (existing.length > 0) {
        // Re-activate if soft-deleted
        await conn.query(
          `UPDATE user_location_assignments 
           SET is_active = 1, updated_by = ?
           WHERE user_id = ? AND location_id = ? AND location_type = ?`,
          [created_by, user_id, location_id, location_type]
        );
        insertId = existing[0].assignment_id;
      } else {
        const [result] = await conn.query(
          `INSERT INTO user_location_assignments
           (user_id, location_id, location_type, created_by)
           VALUES (?, ?, ?, ?)`,
          [user_id, location_id, location_type, created_by]
        );
        insertId = result.insertId;
      }
    });

    res.status(201).json({ success: true, message: "Assignment created" });

    logAudit(db, created_by, "CREATE", "user_location_assignments", insertId,
      { user_id, location_id, location_type }, req.ip).catch(console.error);

  } catch (error) {
    next(error);
  }
};

// DELETE /assignments/:id
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    await db.query(
      `UPDATE user_location_assignments 
       SET is_active = 0, updated_by = ?
       WHERE assignment_id = ?`,
      [user_id, id]
    );

    res.json({ success: true, message: "Assignment removed" });

    logAudit(db, user_id, "DELETE", "user_location_assignments", Number(id),
      {}, req.ip).catch(console.error);

  } catch (error) {
    next(error);
  }
};