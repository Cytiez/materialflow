// Middleware: cek role user setelah authenticateToken
// Penggunaan: requireRole('sender') atau requireRole('receiver')
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk fitur ini.'
      });
    }

    next();
  };
};

module.exports = { requireRole };
