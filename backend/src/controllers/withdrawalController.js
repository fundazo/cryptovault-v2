const pool = require('../config/database');

const createWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { currency, amount, destination_address } = req.body;

    // Check user balance
    const balanceResult = await client.query(
      `SELECT btc_balance, eth_balance, usdt_balance FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );

    const user = balanceResult.rows[0];
    const balanceField = `${currency.toLowerCase()}_balance`;
    const currentBalance = parseFloat(user[balanceField]);

    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${currency} balance. Available: ${currentBalance}`,
      });
    }

    await client.query('BEGIN');

    // Deduct balance immediately (hold)
    await client.query(
      `UPDATE users SET ${balanceField} = ${balanceField} - $1 WHERE id = $2`,
      [amount, req.user.id]
    );

    const result = await client.query(
      `INSERT INTO withdrawals (user_id, currency, amount, destination_address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, currency, amount, destination_address]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, currency, amount, balance_before, balance_after, reference_id, reference_type, description)
       VALUES ($1, 'withdrawal', $2, $3, $4, $5, $6, 'withdrawal', $7)`,
      [req.user.id, currency, amount, currentBalance, currentBalance - amount, result.rows[0].id, `Withdrawal request of ${amount} ${currency}`]
    );

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'info')`,
      [req.user.id, 'Withdrawal Requested', `Your withdrawal of ${amount} ${currency} is pending admin approval.`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      data: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit withdrawal' });
  } finally {
    client.release();
  }
};

const getUserWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM withdrawals WHERE user_id = $1', [req.user.id]);

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
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

module.exports = { createWithdrawal, getUserWithdrawals };
