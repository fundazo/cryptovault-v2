# ⬡ CryptoVault — Crypto Fintech Platform

A full-stack cryptocurrency management platform with user dashboards, admin panel, deposit/withdrawal workflows, and JWT authentication.

---

## 🗂 Project Structure

```
cryptovault/
├── backend/                 # Node.js + Express API
│   └── src/
│       ├── config/          # DB connection + migration
│       ├── controllers/     # Auth, User, Deposit, Withdrawal, Admin
│       ├── middleware/      # Auth guard, validation, rate limiting
│       ├── routes/          # All API routes
│       └── utils/           # Email service, JWT helpers
│
├── frontend/                # React.js + Tailwind CSS
│   └── src/
│       ├── components/      # UI kit + Dashboard layout
│       ├── context/         # Auth + Theme context
│       ├── pages/
│       │   ├── auth/        # Login, Register, Verify, Reset password
│       │   ├── dashboard/   # Overview, Deposit, Withdraw, Transactions, Profile
│       │   └── admin/       # Dashboard, Users, Deposits, Withdrawals, Wallets
│       └── utils/           # Axios API service
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE cryptovault;"
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials

npm install

# Run database migration (creates tables + default admin)
npm run migrate

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at: **http://localhost:3000**  
API runs at: **http://localhost:5000**

---

## 🔐 Default Credentials

After migration, the admin account is created:

| Role  | Email                     | Password      |
|-------|---------------------------|---------------|
| Admin | admin@cryptovault.com     | Admin@123456  |

> ⚠️ **Change admin credentials immediately in production!**

---

## 📋 Database Tables

| Table                  | Purpose                                         |
|------------------------|-------------------------------------------------|
| `users`                | User accounts with balances and roles           |
| `email_verifications`  | OTP + token-based email verification            |
| `password_resets`      | Secure token-based password reset               |
| `wallet_addresses`     | Admin-set deposit addresses per currency        |
| `deposits`             | User deposit requests with TXID                 |
| `withdrawals`          | User withdrawal requests                        |
| `transactions`         | Full transaction ledger (deposits, withdrawals) |
| `notifications`        | In-app user notifications                       |

---

## 🛣 API Endpoints

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/resend-verification
```

### User (requires JWT)
```
GET    /api/v1/user/profile
PUT    /api/v1/user/profile
PUT    /api/v1/user/change-password
GET    /api/v1/user/balances
GET    /api/v1/user/transactions
GET    /api/v1/user/notifications
PUT    /api/v1/user/notifications/read
```

### Deposits (requires JWT)
```
GET  /api/v1/deposits/wallet-addresses
POST /api/v1/deposits
GET  /api/v1/deposits
```

### Withdrawals (requires JWT)
```
POST /api/v1/withdrawals
GET  /api/v1/withdrawals
```

### Admin (requires JWT + admin role)
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/toggle-status
POST   /api/v1/admin/users/adjust-balance
GET    /api/v1/admin/deposits
PATCH  /api/v1/admin/deposits/:id/review
GET    /api/v1/admin/withdrawals
PATCH  /api/v1/admin/withdrawals/:id/review
GET    /api/v1/admin/wallet-addresses
POST   /api/v1/admin/wallet-addresses
GET    /api/v1/admin/transactions
```

---

## ✨ Features

### User Features
- ✅ Registration with email verification (OTP + link)
- ✅ JWT login with role-based routing
- ✅ Password reset via email
- ✅ Wallet balances dashboard (BTC, ETH, USDT)
- ✅ Deposit flow: select currency → view address → submit TXID
- ✅ Withdrawal flow: enter amount + destination address
- ✅ Full transaction history with filters
- ✅ Profile management + password change
- ✅ Real-time notifications

### Admin Features
- ✅ Platform stats dashboard with charts
- ✅ User management: view, ban/unban, credit/debit balances
- ✅ Approve/reject deposits with notifications + email
- ✅ Approve/reject withdrawals with TXID tracking
- ✅ Set deposit wallet addresses per currency
- ✅ Full transaction ledger

### Technical
- ✅ Dark/light mode
- ✅ Fully responsive (mobile + desktop)
- ✅ Rate limiting on auth endpoints
- ✅ bcrypt password hashing
- ✅ Input validation (express-validator)
- ✅ PostgreSQL transactions with row-level locking
- ✅ Proxy setup (no CORS issues in dev)

---

## 📧 Email Configuration

Configure SMTP in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password   # Gmail App Password, not your login password
```

For Gmail: enable 2FA → create App Password at myaccount.google.com/apppasswords

---

## 🐳 Docker

```bash
# Edit environment variables in docker-compose.yml first
docker-compose up --build
```

---

## 🔒 Security Notes

1. Change `JWT_SECRET` to a long random string in production
2. Change default admin password immediately
3. Use HTTPS in production
4. Set `FRONTEND_URL` correctly for email links
5. Configure proper SMTP credentials
6. Consider adding IP-based rate limiting at the infrastructure level
