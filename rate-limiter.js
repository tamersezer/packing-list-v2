const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json(options.message);
  },
  standardHeaders: true, // X-RateLimit-* header'larını ekle
  legacyHeaders: false
});

// Login/Register için daha sıkı limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına maksimum deneme
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in an hour'
  },
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded:', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json(options.message);
  }
});

module.exports = { apiLimiter, authLimiter }; 