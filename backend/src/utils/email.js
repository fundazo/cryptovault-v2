const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: true, // true for 465, false for other ports
    requireTLS: true,
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailTemplates = {
  verification: (name, otp, verifyLink) => ({
    subject: 'Verify Your CryptoVault Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a;">
          <div style="background:linear-gradient(135deg,#6c63ff,#3ecfcf);padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">⬡ CryptoVault</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Secure Crypto Asset Management</p>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 8px;">Hi ${name},</h2>
            <p style="color:#94a3b8;margin:0 0 28px;line-height:1.6;">Welcome to CryptoVault. Use the OTP below to verify your email address and activate your account.</p>
            <div style="background:#0f0f1a;border:2px dashed #6c63ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="color:#6c63ff;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;">${otp}</p>
              <p style="color:#64748b;margin:8px 0 0;font-size:12px;">Valid for 15 minutes</p>
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <p style="color:#94a3b8;margin:0 0 16px;font-size:14px;">Or click the button below to verify:</p>
              <a href="${verifyLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#3ecfcf);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">Verify My Account</a>
            </div>
            <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">If you didn't create a CryptoVault account, you can safely ignore this email.</p>
          </div>
          <div style="padding:20px 32px;background:#0f0f1a;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} CryptoVault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (name, resetLink) => ({
    subject: 'Reset Your CryptoVault Password',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a;">
          <div style="background:linear-gradient(135deg,#6c63ff,#3ecfcf);padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">⬡ CryptoVault</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 8px;">Password Reset Request</h2>
            <p style="color:#94a3b8;margin:0 0 28px;line-height:1.6;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#3ecfcf);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">Reset My Password</a>
            </div>
            <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, please ignore this email and your account remains secure.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  depositStatus: (name, currency, amount, status, note) => ({
    subject: `Deposit ${status === 'approved' ? 'Approved' : 'Update'} - CryptoVault`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a;">
          <div style="background:linear-gradient(135deg,${status === 'approved' ? '#10b981,#3ecfcf' : '#ef4444,#f97316'});padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">⬡ CryptoVault</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#e2e8f0;">Deposit ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
            <p style="color:#94a3b8;line-height:1.6;">Hi ${name}, your deposit of <strong style="color:#e2e8f0;">${amount} ${currency}</strong> has been <strong>${status}</strong>.</p>
            ${note ? `<div style="background:#0f0f1a;border-radius:8px;padding:16px;margin-top:16px;"><p style="color:#94a3b8;margin:0;font-size:14px;"><strong style="color:#e2e8f0;">Admin Note:</strong> ${note}</p></div>` : ''}
            ${status === 'approved' ? `<p style="color:#10b981;margin-top:16px;">Your balance has been updated. Log in to view your wallet.</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  withdrawalStatus: (name, currency, amount, status, note) => ({
    subject: `Withdrawal ${status === 'approved' ? 'Approved' : 'Update'} - CryptoVault`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a;">
          <div style="background:linear-gradient(135deg,${status === 'approved' ? 'green' : 'red'});padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">⬡ CryptoVault</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#e2e8f0;">Withdrawal ${status === 'approved' ? ' Approved' : ' Rejected'}</h2>
            <p style="color:#94a3b8;line-height:1.6;">Hi ${name}, your withdrawal of <strong style="color:#e2e8f0;">${amount} ${currency}</strong> has been <strong>${status}</strong>.</p>
            ${note ? `<div style="background:#0f0f1a;border-radius:8px;padding:16px;margin-top:16px;"><p style="color:#94a3b8;margin:0;font-size:14px;"><strong style="color:#e2e8f0;">Admin Note:</strong> ${note}</p></div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'CryptoVault <noreply@cryptovault.com>',
      to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

module.exports = { sendEmail, emailTemplates };
