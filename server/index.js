const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Validasi env kritis sebelum server jalan
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL harus diset di .env');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('❌ JWT_SECRET harus diset di .env dan minimal 32 karakter');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
if (!process.env.CLIENT_URL) {
  console.warn('⚠️  CLIENT_URL tidak di-set di .env, menggunakan default:', clientUrl);
}
app.use(cors({
  origin: clientUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files — foto upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting global
// Dev: 500 req/15min — Production: 100 req/15min
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MaterialFlow API berjalan.' });
});

// Routes
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const listingsRoutes = require('./routes/listings');
const requestsRoutes = require('./routes/requests');
const matchesRoutes = require('./routes/matches');
const impactRoutes = require('./routes/impact');
const contactRoutes = require('./routes/contact');
const profileRoutes = require('./routes/profile');
const receiversRoutes = require('./routes/receivers');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api', matchesRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/receivers', receiversRoutes);

// Error handler global — jangan expose stack trace ke client
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.'
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
