const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter khusus untuk endpoint login dan register
// Dev: 20 req/min — Production: 5 req/min
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 20 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.'
  }
});

module.exports = { authLimiter };
