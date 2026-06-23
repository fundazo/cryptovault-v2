const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { authenticate, requireAdmin } = require('../middleware/auth');
const { registerValidation, loginValidation, depositValidation, withdrawalValidation } = require('../middleware/validation');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const depositController = require('../controllers/depositController');
const withdrawalController = require('../controllers/withdrawalController');
const adminController = require('../controllers/adminController');

// Rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' } });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// ─── Auth Routes ───────────────────────────────────────────────────────────────
router.post('/auth/register', authLimiter, registerValidation, authController.register);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/login', authLimiter, loginValidation, authController.login);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/resend-verification', authLimiter, authController.resendVerification);

// ─── User Routes ───────────────────────────────────────────────────────────────
router.get('/user/profile', authenticate, userController.getProfile);
router.put('/user/profile', authenticate, userController.updateProfile);
router.put('/user/change-password', authenticate, userController.changePassword);
router.get('/user/balances', authenticate, userController.getWalletBalances);
router.get('/user/transactions', authenticate, userController.getTransactionHistory);
router.get('/user/notifications', authenticate, userController.getNotifications);
router.put('/user/notifications/read', authenticate, userController.markNotificationsRead);

// ─── Deposit Routes ────────────────────────────────────────────────────────────
router.get('/deposits/wallet-addresses', authenticate, depositController.getWalletAddresses);
router.post('/deposits', authenticate, depositValidation, depositController.createDeposit);
router.get('/deposits', authenticate, depositController.getUserDeposits);

// ─── Withdrawal Routes ─────────────────────────────────────────────────────────
router.post('/withdrawals', authenticate, withdrawalValidation, withdrawalController.createWithdrawal);
router.get('/withdrawals', authenticate, withdrawalController.getUserWithdrawals);

// ─── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin/stats', authenticate, requireAdmin, adminController.getDashboardStats);

router.get('/admin/users', authenticate, requireAdmin, adminController.getAllUsers);
router.get('/admin/users/:id', authenticate, requireAdmin, adminController.getUserById);
router.patch('/admin/users/:id/toggle-status', authenticate, requireAdmin, adminController.toggleUserStatus);
router.post('/admin/users/adjust-balance', authenticate, requireAdmin, adminController.creditDebitBalance);

router.get('/admin/deposits', authenticate, requireAdmin, adminController.getAllDeposits);
router.patch('/admin/deposits/:id/review', authenticate, requireAdmin, adminController.reviewDeposit);

router.get('/admin/withdrawals', authenticate, requireAdmin, adminController.getAllWithdrawals);
router.patch('/admin/withdrawals/:id/review', authenticate, requireAdmin, adminController.reviewWithdrawal);

router.get('/admin/wallet-addresses', authenticate, requireAdmin, adminController.getWalletAddresses);
router.post('/admin/wallet-addresses', authenticate, requireAdmin, adminController.upsertWalletAddress);

router.get('/admin/transactions', authenticate, requireAdmin, adminController.getAllTransactions);

module.exports = router;
