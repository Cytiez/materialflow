-- ============================================
-- MaterialFlow Database Schema
-- Jalankan: psql -d materialflow -f migrations.sql
-- ============================================

-- Hapus tabel lama jika ada (urutan sesuai dependency)
DROP TABLE IF EXISTS contact_views CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS material_requests CASCADE;
DROP TABLE IF EXISTS waste_listings CASCADE;
DROP TABLE IF EXISTS waste_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Hapus ENUM types lama
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('sender', 'receiver');
CREATE TYPE listing_status AS ENUM ('active', 'matched', 'completed', 'expired');
CREATE TYPE request_status AS ENUM ('active', 'fulfilled', 'expired');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected');

-- ============================================
-- TABEL: users
-- Autentikasi pengguna
-- ============================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABEL: profiles
-- Informasi profil perusahaan (1:1 dengan users)
-- ============================================

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city ON profiles(city);

-- ============================================
-- TABEL: waste_categories
-- Lookup tabel untuk jenis limbah (auto-matching)
-- ============================================

CREATE TABLE waste_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_kg DECIMAL(12, 2) NOT NULL,
  emission_factor DECIMAL(10, 6) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABEL: waste_listings
-- Posting limbah oleh sender
-- is_custom = true untuk limbah yang tidak ada di kategori
-- ============================================

CREATE TABLE waste_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES waste_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  volume_kg DECIMAL(12, 2) NOT NULL,
  photo_url VARCHAR(500),
  is_custom BOOLEAN DEFAULT FALSE,
  custom_category VARCHAR(255),
  status listing_status DEFAULT 'active',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_user_id ON waste_listings(user_id);
CREATE INDEX idx_listings_category_id ON waste_listings(category_id);
CREATE INDEX idx_listings_status ON waste_listings(status);
CREATE INDEX idx_listings_is_custom ON waste_listings(is_custom);
CREATE INDEX idx_listings_deleted_at ON waste_listings(deleted_at);

-- ============================================
-- TABEL: material_requests
-- Posting kebutuhan bahan baku oleh receiver
-- ============================================

CREATE TABLE material_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES waste_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quantity_kg DECIMAL(12, 2) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status request_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_requests_user_id ON material_requests(user_id);
CREATE INDEX idx_requests_category_id ON material_requests(category_id);
CREATE INDEX idx_requests_status ON material_requests(status);
CREATE INDEX idx_requests_deleted_at ON material_requests(deleted_at);

-- ============================================
-- TABEL: matches
-- Log koneksi antara listing dan request dengan skor
-- ============================================

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  request_id INTEGER NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
  score DECIMAL(5, 4) NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  status match_status DEFAULT 'pending',
  sender_done BOOLEAN DEFAULT FALSE,
  receiver_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, request_id)
);

CREATE INDEX idx_matches_listing_id ON matches(listing_id);
CREATE INDEX idx_matches_request_id ON matches(request_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_score ON matches(score DESC);

-- ============================================
-- TABEL: contact_views
-- Log setiap kali user melihat kontak user lain
-- ============================================

CREATE TABLE contact_views (
  id SERIAL PRIMARY KEY,
  viewer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES waste_listings(id),
  request_id INTEGER REFERENCES material_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_views_viewer ON contact_views(viewer_user_id);
CREATE INDEX idx_contact_views_target ON contact_views(target_user_id);
