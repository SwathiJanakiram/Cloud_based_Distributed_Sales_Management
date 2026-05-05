const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  waitForConnections: true,   // ✅ queue requests instead of failing
  connectionLimit: 10,        // ✅ max concurrent connections
  queueLimit: 0,              // ✅ unlimited queue

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = db.promise();