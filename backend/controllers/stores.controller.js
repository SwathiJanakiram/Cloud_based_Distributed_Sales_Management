const { withTransaction } = require("../utils/transaction");
const { logAudit } = require("../utils/auditLogger");
const AppError  = require("../utils/AppError");
const db = require("../config/db");

exports.createStore = async (req, res, next) => {
  try {
    let { store_name, city, latitude, longitude, region_id } = req.body;
    const { user_id } = req.user;

    store_name = store_name?.trim();
    city = city?.trim();

    if (!store_name || !city || !region_id) {
      throw new AppError("store_name, city, and region_id are required", 400);
    }

    let newId;

    await withTransaction(async (conn) => {
      // Better duplicate check (region-aware)
      const [existing] = await conn.query(
        `SELECT store_id 
         FROM stores 
         WHERE store_name = ?
           AND region_id = ?
           AND is_deleted = 0`,
        [store_name, region_id],
      );

      if (existing.length > 0) {
        throw new AppError("Store already exists in this region", 400);
      }

      const [result] = await conn.query(
        `INSERT INTO stores 
         (store_name, city, region_id, latitude, longitude, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          store_name,
          city,
          region_id,
          latitude || null,
          longitude || null,
          user_id,
        ],
      );

      newId = result.insertId;

     
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: { store_id: newId },
    });
     await logAudit(
        db,
        user_id,
        "CREATE",
        "stores",
        newId,
        { store_name, city, region_id },
        req.ip,
      );
  } catch (error) {
    next(error);
  }
};
exports.updateStore = async (req, res, next) => {
  try {
    let { store_name, city, latitude, longitude, region_id, store_id } =
      req.body;
    const { user_id } = req.user;

    store_name = store_name?.trim();
    city = city?.trim();

    if (!store_name || !city || !region_id || !store_id) {
      throw new AppError(
        "store_name, city, region_id and store_id are required",
        400,
      );
    }
    let old;

    await withTransaction(async (conn) => {
       [old] = await conn.query(
        `SELECT store_name, city, region_id, latitude, longitude
         FROM stores 
         WHERE store_id = ? AND is_deleted = 0`,
        [store_id],
      );

      if (!old.length) {
        throw new AppError("Store not found",400);
      }

      const [result] = await conn.query(
        `UPDATE stores 
         SET store_name = ?, 
             city = ?, 
             region_id = ?, 
             latitude = ?, 
             longitude = ?, 
             updated_by = ?
         WHERE store_id = ?`,
        [
          store_name,
          city,
          region_id,
          latitude || null,
          longitude || null,
          user_id,
          store_id,
        ],
      );

      if (result.affectedRows === 0) {
        throw new AppError("Update failed", 400);
      }

      
    });

    res.status(200).json({
      success: true,
      message: "Store updated successfully",
    });

    await logAudit(
        db,
        user_id,
        "UPDATE",
        "stores",
        store_id,
        {
          before: old[0],
          after: { store_name, city, region_id, latitude, longitude },
        },
        req.ip,
      );
  } catch (error) {
    next(error);
  }
};
exports.deleteStore = async (req, res, next) => {
  try {
    const store_id = parseInt(req.params.id);
    const { user_id } = req.user;

    if (!store_id) {
      throw new AppError("Valid store_id required", 400);
    }
    let old;
    await withTransaction(async (conn) => {
      // Get old data
      [old] = await conn.query(
        `SELECT * FROM stores WHERE store_id = ?`,
        [store_id],
      );

      if (!old.length) {
        throw new AppError("Store not found",400);
      }

      const [result] = await conn.query(
        `UPDATE stores 
         SET is_deleted = 1, updated_by = ?
         WHERE store_id = ?`,
        [user_id, store_id],
      );

      if (result.affectedRows === 0) {
        throw new AppError("Delete failed", 400);
      }

      
    });

    res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });

    await logAudit(
        db,
        user_id,
        "DELETE",
        "stores",
        store_id,
        {
          deleted: true,
          previous: old[0],
        },
        req.ip,
      );
  } catch (error) {
    next(error);
  }
};
exports.getStores = async (req, res, next) => {
  try {
    let query = `
      SELECT s.store_id, s.store_name, s.city, s.latitude, s.longitude,
             r.region_id, r.region_name AS region
      FROM stores s
      JOIN regions r ON s.region_id = r.region_id
      WHERE s.is_deleted = 0
      ORDER BY s.created_at DESC
    `;
    let values = [];
    if (req.user.role === "regional_manager") {
      query = `
      SELECT s.store_id, s.store_name, s.city, s.latitude, s.longitude,
             r.region_id, r.region_name AS region
      FROM stores s
      JOIN regions r ON s.region_id = r.region_id
      WHERE r.region_id = ? AND s.is_deleted = 0
      ORDER BY s.created_at DESC
    `;
      values.push(req.user.region_id);
    }
    const [rows] = await db.query(query, values);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getStoresByRegion = async (req, res, next) => {
  try {
    const { region_id } = req.params;

    const [rows] = await db.query(
      `SELECT s.*, r.region_name AS region 
       FROM stores s
       JOIN regions r ON s.region_id = r.region_id
       WHERE s.region_id = ?`,
      [region_id],
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};
