const admin = require("../config/firebase");
const db = require("../config/db");

const tokenCache = new Map();

exports.verifyFirebaseToken = async (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  //  1. CHECK CACHE FIRST
  if (tokenCache.has(token)) {
    req.user = tokenCache.get(token);
    return next();
  }

  console.time("auth");

  try {
    //  Firebase call (slow)
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;

    //  DB call (extra cost)
    const [users] = await db.query(
      "SELECT user_id, role, region_id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        message: "User not registered in system",
      });
    }

    const userData = {
      user_id: users[0].user_id,
      role: users[0].role,
      region_id: users[0].region_id,
      email,
    };

    //  2. STORE IN CACHE
    tokenCache.set(token, userData);

    //  3. AUTO-EXPIRE CACHE (5 mins)
    setTimeout(() => tokenCache.delete(token), 5 * 60 * 1000);

    req.user = userData;
    next();

  } catch (error) {
    console.error("Firebase verify error:", error);
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  } finally {
    console.timeEnd("auth");
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
