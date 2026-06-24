const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken, generateOTP, generateSecureToken, addMinutes, addHours } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/email');

const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 9);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
      [email, passwordHash, first_name, last_name, phone || null]
    );

    const user = userResult.rows[0];
    const otp = generateOTP();
    const token = generateSecureToken();
    const expiresAt = addMinutes(15);

    await client.query(
      `INSERT INTO email_verifications (user_id, token, otp, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, otp, expiresAt]
    );

const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

await sendEmail(
  email,
  emailTemplates.verification(user.first_name, otp, verifyLink)
);

res.json({
  success: true,
  message: 'Verification email resent.'
});
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    client.release();
  }
};

const verifyEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token, otp } = req.body;

    let verificationQuery;
    let verificationParams;

    if (token) {
      verificationQuery = `SELECT * FROM email_verifications WHERE token = $1 AND used = false AND expires_at > NOW()`;
      verificationParams = [token];
    } else if (otp) {
      // Get latest unused OTP for any user
      verificationQuery = `SELECT * FROM email_verifications WHERE otp = $1 AND used = false AND expires_at > NOW()`;
      verificationParams = [otp];
    } else {
      return res.status(400).json({ success: false, message: 'Token or OTP required' });
    }

    const result = await client.query(verificationQuery, verificationParams);
    if (!result.rows[0]) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    const verification = result.rows[0];

    await client.query('UPDATE email_verifications SET used = true WHERE id = $1', [verification.id]);
    await client.query('UPDATE users SET is_verified = true WHERE id = $1', [verification.user_id]);

    const userResult = await client.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [verification.user_id]
    );
    const user = userResult.rows[0];

    const authToken = generateToken({ userId: user.id, role: user.role });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { token: authToken, user },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        userId: user.id,
      });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      'SELECT id, first_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    if (!result.rows[0]) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const token = generateSecureToken();
    const expiresAt = addHours(1);

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail(email, emailTemplates.passwordReset(user.first_name, resetLink));

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token, password } = req.body;

    const result = await client.query(
      `SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );

    if (!result.rows[0]) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    const reset = result.rows[0];
    const passwordHash = await bcrypt.hash(password, 9);

    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, reset.user_id]);
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [reset.id]);

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  } finally {
    client.release();
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await pool.query(
      'SELECT id, first_name, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows[0] || result.rows[0].is_verified) {
      return res.json({ success: true, message: 'If applicable, verification email has been resent.' });
    }

    const user = result.rows[0];
    const otp = generateOTP();
    console.log('OTP:', otp);
    const token = generateSecureToken();
    const expiresAt = addMinutes(15);

    // Invalidate old verifications
    await pool.query(
      'UPDATE email_verifications SET used = true WHERE user_id = $1 AND used = false',
      [user.id]
    );

    await pool.query(
      `INSERT INTO email_verifications (user_id, token, otp, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, otp, expiresAt]
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendEmail(email, emailTemplates.verification(user.first_name, otp, verifyLink));

    res.json({ success: true, message: 'Verification email resent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification' });
  }
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, resendVerification };
