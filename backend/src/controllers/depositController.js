const pool = require('../config/database');

const getWalletAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, currency, address, label FROM wallet_addresses WHERE is_active = true ORDER BY currency'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet addresses' });
  }
};

const createDeposit = async (req, res) => {
  try {
    const { currency, amount, txid, wallet_address_id } = req.body;

    // Check for duplicate TXID
    const dupCheck = await pool.query('SELECT id FROM deposits WHERE txid = $1', [txid]);
    if (dupCheck.rows[0]) {
      return res.status(409).json({ success: false, message: 'Transaction ID already submitted' });
    }

    const result = await pool.query(
      `INSERT INTO deposits (user_id, currency, amount, txid, wallet_address_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, currency, amount, txid, wallet_address_id]
    );

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'info')`,
      [req.user.id, 'Deposit Submitted', `Your deposit of ${amount} ${currency} is pending review.`]
    );

    res.status(201).json({
      success: true,
      message: 'Deposit submitted successfully. Awaiting admin approval.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit deposit' });
  }
};

const getUserDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT d.*, wa.address as wallet_address
       FROM deposits d
       LEFT JOIN wallet_addresses wa ON d.wallet_address_id = wa.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM deposits WHERE user_id = $1', [req.user.id]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

module.exports = { getWalletAddresses, createDeposit, getUserDeposits };
