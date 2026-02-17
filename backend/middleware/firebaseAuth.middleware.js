const admin = require("../config/firebase");
const db = require("../config/db");

exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract email from Firebase token
    const email = decodedToken.email;

    // Fetch role from MySQL
    const [users] = await db.query(
      "SELECT user_id, role FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        message: "User not registered in system"
      });
    }

    req.user = {
      user_id: users[0].user_id,
      role: users[0].role,
      email
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase token"
    });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    next();
  };
};
