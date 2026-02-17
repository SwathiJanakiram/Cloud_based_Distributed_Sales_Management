const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected");
    connection.release();
  } catch (err) {
    console.error("❌ FULL ERROR OBJECT:");
    console.error(err);
  }
})();

module.exports = pool;
