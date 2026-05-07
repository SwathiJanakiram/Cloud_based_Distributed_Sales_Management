
const db = require("../config/db");
const admin = require("firebase-admin");
const { logAudit } = require("../utils/auditLogger");
const { withTransaction } = require("../utils/transaction");
const AppError = require("../utils/appError");

// Firebase init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require("../config/serviceAccountKey.json")
    ),
  });
}

//  GET USERS (no COUNT)
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.firebase_uid, u.created_at,
              r.region_id, r.region_name AS region
       FROM users u
       LEFT JOIN regions r ON u.region_id = r.region_id
       WHERE u.is_active = 1
       ORDER BY u.created_at ASC, u.user_id ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      page,
      data: rows,
      hasMore: rows.length === limit,
    });
  } catch (error) {
    next(error);
  }
};
exports.getUserName = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT user_id, name FROM users");

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};
//  CREATE USER (correct flow)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, region_id } = req.body;

    if (!name || !email || !password || !role || !region_id) {
      throw new AppError("All fields are required", 400);
    }

    const validRoles = [
      "admin",
      "regional_manager",
      "store_manager",
      "salesperson",
    ];

    if (!validRoles.includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    // 🔹 1. Firebase first (outside transaction)
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;

    await admin.auth().setCustomUserClaims(uid, { role });

    let insertedId;

    // 🔹 2. DB transaction
    await withTransaction(async (conn) => {
      const [existing] = await conn.query(
        "SELECT user_id FROM users WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        throw new AppError("Email already exists", 400);
      }

      const [result] = await conn.query(
        `INSERT INTO users 
         (name, email, role, region_id, firebase_uid, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, role, region_id, uid, req.user?.user_id || null]
      );

      insertedId = result.insertId;
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      uid,
    });

    // 🔹 3. Async audit
    logAudit(
      db,
      req.user?.user_id || null,
      "CREATE",
      "users",
      insertedId,
      { email, role, region_id },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};

//  UPDATE USER
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, email, role, region_id } = req.body;
    const updated_by = req.user.user_id;

    name = name?.trim();
    email = email?.trim();

    if (!id || !name || !email || !role || !region_id) {
      throw new AppError("All fields are required", 400);
    }

    let oldData;

    await withTransaction(async (conn) => {
      const [old] = await conn.query(
        `SELECT name, email, role, region_id 
         FROM users WHERE user_id = ? AND is_active = 1`,
        [id]
      );

      if (!old.length) {
        throw new AppError("User not found", 404);
      }

      oldData = old[0];

      const [existingEmail] = await conn.query(
        `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
        [email, id]
      );

      if (existingEmail.length > 0) {
        throw new AppError("Email already in use", 409);
      }

      await conn.query(
        `UPDATE users
         SET name = ?, email = ?, role = ?, region_id = ?, updated_by = ?
         WHERE user_id = ?`,
        [name, email, role, region_id, updated_by, id]
      );

      const [userRow] = await conn.query(
        `SELECT firebase_uid FROM users WHERE user_id = ?`,
        [id]
      );

      if (userRow.length && userRow[0].firebase_uid) {
        await admin.auth().setCustomUserClaims(
          userRow[0].firebase_uid,
          { role }
        );
      }
    });

    res.json({ success: true, message: "User updated successfully" });

    logAudit(
      db,
      updated_by,
      "UPDATE",
      "users",
      Number(id),
      {
        before: oldData,
        after: { name, email, role, region_id },
      },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};

//  DELETE USER
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Firebase delete first
    await admin.auth().deleteUser(id);

    await db.query(
      `UPDATE users SET is_active = 0, updated_by = ? WHERE firebase_uid = ?`,
      [user_id, id]
    );

    res.json({ success: true, message: "User deleted successfully" });

    logAudit(
      db,
      user_id,
      "DELETE",
      "users",
      null,
      { firebase_uid: id },
      req.ip
    ).catch(console.error);

  } catch (error) {
    next(error);
  }
};

//  GET CURRENT USER
exports.getMe = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    const [assignments] = await db.query(
      `SELECT location_id, location_type
       FROM user_location_assignments
       WHERE user_id = ? AND is_active = 1`,
      [user_id]
    );

    // Group by type for convenience on the frontend
    const stores     = assignments.filter(a => a.location_type === 'store')    .map(a => a.location_id);
    const warehouses = assignments.filter(a => a.location_type === 'warehouse').map(a => a.location_id);

    res.json({
      success: true,
      data: {
        ...req.user,
        stores,        // [1, 2]  — all stores this user is assigned to
        warehouses,    // [1, 2]  — all warehouses
      },
    });
  } catch (error) {
    next(error);
  }
};

//  GET SALESPERSONS
exports.getSalespersonsByStore = async (req, res, next) => {
  try {
    let { store_id } = req.query;
    const user = req.user;

    if (user.role === "store_manager") {
      const [store] = await db.query(
        `SELECT location_id FROM user_location_assignments 
         WHERE user_id = ? AND location_type = 'store' LIMIT 1`,
        [user.user_id]
      );

      store_id = store.length ? store[0].location_id : null;
    }

    let query = `
      SELECT u.user_id, u.name
      FROM users u
      JOIN user_location_assignments ua ON ua.user_id = u.user_id
      WHERE u.role = 'salesperson'
        AND ua.location_type = 'store'
        AND ua.location_id = ?
        AND u.is_active = 1
    `;

    let values = [store_id];

    if (user.role !== "admin") {
      query += `
        AND ua.location_id IN (
          SELECT location_id
          FROM user_location_assignments
          WHERE user_id = ?
            AND location_type = 'store'
        )
      `;
      values.push(user.user_id);
    }

    query += ` ORDER BY u.name ASC`;

    const [rows] = await db.query(query, values);

    res.json({ success: true, data: rows });

  } catch (error) {
    next(error);
  }
};
