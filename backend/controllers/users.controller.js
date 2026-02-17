const db = require("../config/db");

/**
 * GET /users
 * Fetch users with pagination
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      "SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [countResult] = await db.query(
      "SELECT COUNT(*) AS total FROM users"
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

/**
 * POST /users
 * Create new user
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email and role are required"
      });
    }

    const validRoles = ["admin", "manager", "salesperson"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    // Prevent duplicate email
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    await db.query(
      "INSERT INTO users (name, email, role) VALUES (?, ?, ?)",
      [name, email, role]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
