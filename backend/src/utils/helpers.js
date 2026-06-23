const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const addMinutes = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

const addHours = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

module.exports = {
  generateToken,
  verifyToken,
  generateOTP,
  generateSecureToken,
  addMinutes,
  addHours,
};
