const db = require("../config/db");
const logger = require("../utils/logger");

exports.createSale = async (req, res) => {
  const { product_id, store_id, user_id, quantity } = req.body;

  const connection = await db.getConnection();

  try {
    if (!product_id || !store_id || !user_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0"
      });
    }

    await connection.beginTransaction();

    // Check product
    const [product] = await connection.query(
      "SELECT unit_price FROM products WHERE product_id = ? FOR UPDATE",
      [product_id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const price = product[0].unit_price;
    const total_amount = price * quantity;

    // Insert sale
    await connection.query(
      `INSERT INTO sales 
       (product_id, store_id, user_id, quantity, total_amount) 
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, store_id, user_id, quantity, total_amount]
    );

    await connection.commit();

    logger.info(`Sale created: product ${product_id}, amount ${total_amount}`);

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: {
        total_amount
      }
    });

  } catch (error) {
    await connection.rollback();
    logger.error(error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};
