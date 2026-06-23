const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, is_verified,
              btc_balance, eth_balance, usdt_balance, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;

    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
       WHERE id = $4 RETURNING id, email, first_name, last_name, phone`,
      [first_name, last_name, phone, req.user.id]
    );

    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

const getWalletBalances = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT btc_balance, eth_balance, usdt_balance FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch balances' });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, currency } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT t.*, u.first_name, u.last_name FROM transactions t
                 JOIN users u ON t.user_id = u.id
                 WHERE t.user_id = $1`;
    const params = [req.user.id];
    let paramCount = 2;

    if (type) {
      query += ` AND t.type = $${paramCount++}`;
      params.push(type);
    }
    if (currency) {
      query += ` AND t.currency = $${paramCount++}`;
      params.push(currency);
    }

    const countResult = await pool.query(
      query.replace('SELECT t.*, u.first_name, u.last_name', 'SELECT COUNT(*)'),
      params
    );

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.json({ success: true, data: result.rows, unread_count: unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getWalletBalances,
  getTransactionHistory,
  getNotifications,
  markNotificationsRead,
};
