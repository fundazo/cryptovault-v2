const pool = require('../config/database');
const { sendEmail, emailTemplates } = require('../utils/email');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [users, deposits, withdrawals, transactions] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_verified=true) as verified FROM users WHERE role=\'user\''),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'pending\') as pending, COUNT(*) FILTER (WHERE status=\'approved\') as approved FROM deposits'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'pending\') as pending, COUNT(*) FILTER (WHERE status=\'approved\') as approved FROM withdrawals'),
      pool.query('SELECT COALESCE(SUM(CASE WHEN currency=\'USDT\' THEN amount ELSE 0 END),0) as usdt_volume FROM transactions WHERE type=\'deposit\' AND created_at > NOW()-INTERVAL \'30 days\''),
    ]);

    const balancesResult = await pool.query(
      'SELECT SUM(btc_balance) as total_btc, SUM(eth_balance) as total_eth, SUM(usdt_balance) as total_usdt FROM users'
    );

    res.json({
      success: true,
      data: {
        users: users.rows[0],
        deposits: deposits.rows[0],
        withdrawals: withdrawals.rows[0],
        transactions: transactions.rows[0],
        balances: balancesResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Users management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT id, email, first_name, last_name, phone, role, is_verified, is_active,
                        btc_balance, eth_balance, usdt_balance, created_at
                 FROM users WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }

    const countResult = await pool.query(
      query.replace('SELECT id, email, first_name, last_name, phone, role, is_verified, is_active,\n                        btc_balance, eth_balance, usdt_balance, created_at', 'SELECT COUNT(*)'),
      params
    );

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
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
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, is_verified, is_active,
              btc_balance, eth_balance, usdt_balance, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 AND role != \'admin\' RETURNING id, email, is_active',
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

const creditDebitBalance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, currency, amount, type, description } = req.body;

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be credit or debit' });
    }

    await client.query('BEGIN');

    const balanceField = `${currency.toLowerCase()}_balance`;
    const userResult = await client.query(
      `SELECT ${balanceField} FROM users WHERE id = $1 FOR UPDATE`,
      [user_id]
    );

    if (!userResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentBalance = parseFloat(userResult.rows[0][balanceField]);

    if (type === 'debit' && currentBalance < parseFloat(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient balance for debit' });
    }

    const operator = type === 'credit' ? '+' : '-';
    await client.query(
      `UPDATE users SET ${balanceField} = ${balanceField} ${operator} $1 WHERE id = $2`,
      [amount, user_id]
    );

    const newBalance = type === 'credit' ? currentBalance + parseFloat(amount) : currentBalance - parseFloat(amount);

    await client.query(
      `INSERT INTO transactions (user_id, type, currency, amount, balance_before, balance_after, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user_id, type, currency, amount, currentBalance, newBalance, description || `Manual ${type} by admin`]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [user_id, `Balance ${type === 'credit' ? 'Credit' : 'Debit'}`,
       `${amount} ${currency} has been ${type === 'credit' ? 'credited to' : 'debited from'} your account.`,
       type === 'credit' ? 'success' : 'warning']
    );

    await client.query('COMMIT');

    res.json({ success: true, message: `Balance ${type}ed successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Credit/debit error:', error);
    res.status(500).json({ success: false, message: 'Transaction failed' });
  } finally {
    client.release();
  }
};

// Deposits management
const getAllDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT d.*, u.email, u.first_name, u.last_name, wa.address as wallet_address
                 FROM deposits d
                 JOIN users u ON d.user_id = u.id
                 LEFT JOIN wallet_addresses wa ON d.wallet_address_id = wa.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND d.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

const reviewDeposit = async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, admin_note } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    await client.query('BEGIN');

    const depositResult = await client.query(
      'SELECT * FROM deposits WHERE id = $1 AND status = \'pending\' FOR UPDATE',
      [id]
    );

    if (!depositResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Pending deposit not found' });
    }

    const deposit = depositResult.rows[0];

    await client.query(
      `UPDATE deposits SET status = $1, admin_note = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [status, admin_note, req.user.id, id]
    );

    if (status === 'approved') {
      const balanceField = `${deposit.currency.toLowerCase()}_balance`;
      const userResult = await client.query(
        `SELECT ${balanceField} FROM users WHERE id = $1 FOR UPDATE`,
        [deposit.user_id]
      );
      const currentBalance = parseFloat(userResult.rows[0][balanceField]);

      await client.query(
        `UPDATE users SET ${balanceField} = ${balanceField} + $1 WHERE id = $2`,
        [deposit.amount, deposit.user_id]
      );
      await client.query(
  `UPDATE notifications
   SET is_read = true
   WHERE user_id = $1
   AND title = 'Deposit Submitted'`,
  [deposit.user_id]
);
      await client.query(
        `INSERT INTO transactions (user_id, type, currency, amount, balance_before, balance_after, reference_id, reference_type, description)
         VALUES ($1, 'deposit', $2, $3, $4, $5, $6, 'deposit', $7)`,
        [deposit.user_id, deposit.currency, deposit.amount, currentBalance,
         currentBalance + parseFloat(deposit.amount), id, `Deposit approved: ${deposit.txid}`]
      );
    }

    const userResult = await client.query('SELECT email, first_name FROM users WHERE id = $1', [deposit.user_id]);
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [deposit.user_id,
       `Deposit ${status === 'approved' ? 'Approved' : 'Rejected'}`,
       `Your deposit of ${deposit.amount} ${deposit.currency} has been ${status}.${admin_note ? ' Note: ' + admin_note : ''}`,
       status === 'approved' ? 'success' : 'error']
    );

    await client.query('COMMIT');

    await sendEmail(user.email, emailTemplates.depositStatus(
      user.first_name, deposit.currency, deposit.amount, status, admin_note
    ));

    res.json({ success: true, message: `Deposit ${status} successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Review deposit error:', error);
    res.status(500).json({ success: false, message: 'Failed to review deposit' });
  } finally {
    client.release();
  }
};

// Withdrawals management
const getAllWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT w.*, u.email, u.first_name, u.last_name
                 FROM withdrawals w
                 JOIN users u ON w.user_id = u.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND w.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY w.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

const reviewWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, admin_note, txid } = req.body;
    const { id } = req.params;

    await client.query('BEGIN');

    const withdrawalResult = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND status = \'pending\' FOR UPDATE',
      [id]
    );

    if (!withdrawalResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Pending withdrawal not found' });
    }

    const withdrawal = withdrawalResult.rows[0];

    await client.query(
      `UPDATE withdrawals SET status = $1, admin_note = $2, txid = $3, reviewed_by = $4, reviewed_at = NOW()
       WHERE id = $5`,
      [status, admin_note, txid || null, req.user.id, id]
    );

    if (status === 'rejected') {
      // Refund balance
      const balanceField = `${withdrawal.currency.toLowerCase()}_balance`;
      await client.query(
        `UPDATE users SET ${balanceField} = ${balanceField} + $1 WHERE id = $2`,
        [withdrawal.amount, withdrawal.user_id]
      );

      await client.query(
        `INSERT INTO transactions (user_id, type, currency, amount, description, reference_id, reference_type)
         VALUES ($1, 'credit', $2, $3, $4, $5, 'withdrawal_refund')`,
        [withdrawal.user_id, withdrawal.currency, withdrawal.amount,
         `Withdrawal rejected - refund: ${admin_note || ''}`, id]
      );
    }

    const userResult = await client.query('SELECT email, first_name FROM users WHERE id = $1', [withdrawal.user_id]);
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [withdrawal.user_id,
       `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'}`,
       `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been ${status}.${admin_note ? ' Note: ' + admin_note : ''}`,
       status === 'approved' ? 'success' : 'error']
    );

    await client.query('COMMIT');

    await sendEmail(user.email, emailTemplates.withdrawalStatus(
      user.first_name, withdrawal.currency, withdrawal.amount, status, admin_note
    ));

    res.json({ success: true, message: `Withdrawal ${status} successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Review withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to review withdrawal' });
  } finally {
    client.release();
  }
};

// Wallet addresses
const getWalletAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM wallet_addresses ORDER BY currency, created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet addresses' });
  }
};

const upsertWalletAddress = async (req, res) => {
  try {
    const { currency, address, label } = req.body;

    // Deactivate old addresses for this currency
    await pool.query(
      'UPDATE wallet_addresses SET is_active = false WHERE currency = $1',
      [currency]
    );

    const result = await pool.query(
      `INSERT INTO wallet_addresses (currency, address, label, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [currency, address, label || `${currency} Wallet`, req.user.id]
    );

    res.json({ success: true, message: 'Wallet address updated', data: result.rows[0] });
  } catch (error) {
  console.error('Wallet address error:', error);

  res.status(500).json({
    success: false,
    message: error.message
  });
}
};

const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT t.*, u.email, u.first_name, u.last_name
       FROM transactions t JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM transactions');

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
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  creditDebitBalance,
  getAllDeposits,
  reviewDeposit,
  getAllWithdrawals,
  reviewWithdrawal,
  getWalletAddresses,
  upsertWalletAddress,
  getAllTransactions,
};
