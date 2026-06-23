const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
];

const depositValidation = [
  body('currency').isIn(['BTC', 'ETH', 'USDT']).withMessage('Invalid currency'),
  body('amount').isFloat({ min: 0.00000001 }).withMessage('Amount must be positive'),
  body('txid').trim().isLength({ min: 10 }).withMessage('Valid transaction ID required'),
  body('wallet_address_id').isUUID().withMessage('Valid wallet address required'),
  handleValidationErrors,
];

const withdrawalValidation = [
  body('currency').isIn(['BTC', 'ETH', 'USDT']).withMessage('Invalid currency'),
  body('amount').isFloat({ min: 0.00000001 }).withMessage('Amount must be positive'),
  body('destination_address').trim().isLength({ min: 10 }).withMessage('Valid destination address required'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  depositValidation,
  withdrawalValidation,
  handleValidationErrors,
};
