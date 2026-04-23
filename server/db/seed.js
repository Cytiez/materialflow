const pool = require('./pool');
const bcrypt = require('bcrypt');

// ============================================
// SEED DATA
// ============================================

const wasteCategories = [
  { name: 'Serbuk Kayu', description: 'Sisa potongan dan serutan kayu dari industri mebel', price_per_kg: 500, emission_factor: 1.747, icon: 'wood' },
  { name: 'Limbah Plastik HDPE', description: 'Plastik HDPE dari kemasan industri', price_per_kg: 3500, emission_factor: 3.100, icon: 'plastic' },
  { name: 'Limbah Kertas/Karton', description: 'Kertas dan karton bekas dari percetakan dan perkantoran', price_per_kg: 1500, emission_factor: 1.042, icon: 'paper' },
  { name: 'Limbah Kain Perca', description: 'Sisa potongan kain dari industri garmen', price_per_kg: 2000, emission_factor: 2.376, icon: 'fabric' },
  { name: 'Limbah Logam Besi', description: 'Potongan besi dan baja sisa produksi', price_per_kg: 5000, emission_factor: 1.460, icon: 'metal' },
  { name: 'Limbah Kaca', description: 'Pecahan kaca dari industri dan konstruksi', price_per_kg: 800, emission_factor: 0.870, icon: 'glass' },
  { name: 'Limbah Minyak Jelantah', description: 'Minyak goreng bekas dari industri makanan', price_per_kg: 4000, emission_factor: 2.930, icon: 'oil' },
  { name: 'Limbah Karet', description: 'Sisa karet dan ban bekas dari industri otomotif', price_per_kg: 2500, emission_factor: 3.240, icon: 'rubber' },
  { name: 'Abu Terbang (Fly Ash)', description: 'Abu sisa pembakaran batu bara dari PLTU', price_per_kg: 300, emission_factor: 0.520, icon: 'ash' },
  { name: 'Limbah Elektronik (PCB)', description: 'Papan sirkuit dari perangkat elektronik rusak', price_per_kg: 15000, emission_factor: 4.800, icon: 'electronic' },
];

const senderUsers = [
  {
    email: 'mebeljaya@demo.com', password: 'Demo1234!', role: 'sender',
    profile: { company_name: 'CV Mebel Jaya', phone: '081234567801', address: 'Jl. Industri Raya No. 12, Cakung', city: 'Jakarta Timur', latitude: -6.1850, longitude: 106.9370 },
    listings: [
      { category_index: 0, title: 'Serbuk Kayu Jati Sisa Produksi', description: 'Serbuk halus dari pemotongan kayu jati, bersih tanpa paku.', volume_kg: 500 },
      { category_index: 2, title: 'Karton Bekas Kemasan Mebel', description: 'Karton tebal bekas kemasan pengiriman mebel.', volume_kg: 200 },
    ]
  },
  {
    email: 'plastikmakmur@demo.com', password: 'Demo1234!', role: 'sender',
    profile: { company_name: 'PT Plastik Makmur', phone: '081234567802', address: 'Kawasan Industri Jababeka Blok F3', city: 'Bekasi', latitude: -6.2900, longitude: 107.0900 },
    listings: [
      { category_index: 1, title: 'Limbah HDPE Warna Campur', description: 'Sisa potongan HDPE dari produksi botol, warna campur.', volume_kg: 1000 },
      { category_index: 1, title: 'Reject Plastik HDPE Bening', description: 'Plastik HDPE bening reject QC, masih bersih.', volume_kg: 750 },
    ]
  },
  {
    email: 'garmenindo@demo.com', password: 'Demo1234!', role: 'sender',
    profile: { company_name: 'PT Garmen Indo Textile', phone: '081234567803', address: 'Jl. Raya Serang KM 18', city: 'Tangerang', latitude: -6.1780, longitude: 106.6320 },
    listings: [
      { category_index: 3, title: 'Kain Perca Katun Campur', description: 'Perca katun sisa potong, ukuran 10-30cm, warna campur.', volume_kg: 300 },
      { category_index: 3, title: 'Kain Perca Polyester', description: 'Sisa potongan polyester dari produksi seragam.', volume_kg: 450 },
    ]
  },
  {
    email: 'bengkelmaju@demo.com', password: 'Demo1234!', role: 'sender',
    profile: { company_name: 'Bengkel Las Maju Terus', phone: '081234567804', address: 'Jl. Raya Bogor KM 30, Cimanggis', city: 'Depok', latitude: -6.3700, longitude: 106.8550 },
    listings: [
      { category_index: 4, title: 'Potongan Besi Sisa Las', description: 'Potongan besi hollow dan plat sisa proyek las.', volume_kg: 800 },
      { category_index: 7, title: 'Ban Bekas Truk', description: 'Ban bekas truk, masih utuh, cocok untuk daur ulang karet.', volume_kg: 600 },
    ]
  },
  {
    email: 'warungbunda@demo.com', password: 'Demo1234!', role: 'sender',
    profile: { company_name: 'Warung Makan Bunda', phone: '081234567805', address: 'Jl. Ahmad Yani No. 5, Bogor Tengah', city: 'Bogor', latitude: -6.5950, longitude: 106.7960 },
    listings: [
      { category_index: 6, title: 'Minyak Jelantah Bekas Gorengan', description: 'Minyak jelantah dari warung, dikumpulkan harian, 50L/minggu.', volume_kg: 200 },
      { category_index: 5, title: 'Pecahan Kaca Etalase', description: 'Kaca bekas etalase yang pecah, sudah dipilah.', volume_kg: 50 },
    ]
  },
];

// Limbah aneh — tidak ada di kategori standar
const customListings = [
  {
    sender_email: 'garmenindo@demo.com',
    title: '[LIMBAH KHUSUS] Sisa Benang Kusut Campur',
    description: 'Gulungan benang kusut dari mesin jahit, tidak bisa dipakai produksi. Campuran polyester dan katun.',
    volume_kg: 80,
    custom_category: 'Limbah Benang Industri',
  },
  {
    sender_email: 'bengkelmaju@demo.com',
    title: '[LIMBAH KHUSUS] Debu Gerinda Besi',
    description: 'Serbuk halus dari proses gerinda besi, dikumpulkan dari dust collector.',
    volume_kg: 150,
    custom_category: 'Debu Logam Industri',
  },
];

const receiverUsers = [
  {
    email: 'papanjaya@demo.com', password: 'Demo1234!', role: 'receiver',
    profile: { company_name: 'PT Papan Partikel Jaya', phone: '081234567901', address: 'Kawasan Industri MM2100, Blok C5', city: 'Bekasi', latitude: -6.3150, longitude: 107.0850 },
    request: { category_index: 0, title: 'Butuh Serbuk Kayu untuk Papan Partikel', description: 'Kami membutuhkan serbuk kayu untuk bahan baku papan partikel.', quantity_kg: 2000 },
  },
  {
    email: 'daurplastik@demo.com', password: 'Demo1234!', role: 'receiver',
    profile: { company_name: 'CV Daur Plastik Nusantara', phone: '081234567902', address: 'Jl. Industri Selatan No. 8, Cikarang', city: 'Bekasi', latitude: -6.3100, longitude: 107.1500 },
    request: { category_index: 1, title: 'Cari Limbah Plastik HDPE Bersih', description: 'Butuh HDPE bekas untuk dijadikan bijih plastik daur ulang.', quantity_kg: 5000 },
  },
  {
    email: 'isiulang@demo.com', password: 'Demo1234!', role: 'receiver',
    profile: { company_name: 'PT Isi Ulang Kain', phone: '081234567903', address: 'Jl. Cempaka Putih Raya No. 22', city: 'Jakarta Pusat', latitude: -6.1760, longitude: 106.8740 },
    request: { category_index: 3, title: 'Terima Kain Perca untuk Isian', description: 'Kain perca untuk bahan isian bantal dan boneka.', quantity_kg: 1000 },
  },
  {
    email: 'biodieselindo@demo.com', password: 'Demo1234!', role: 'receiver',
    profile: { company_name: 'PT Biodiesel Indonesia', phone: '081234567904', address: 'Jl. Raya Serpong KM 7', city: 'Tangerang Selatan', latitude: -6.3200, longitude: 106.6800 },
    request: { category_index: 6, title: 'Beli Minyak Jelantah untuk Biodiesel', description: 'Membutuhkan minyak jelantah sebagai bahan baku biodiesel.', quantity_kg: 10000 },
  },
  {
    email: 'bataringan@demo.com', password: 'Demo1234!', role: 'receiver',
    profile: { company_name: 'CV Bata Ringan Mandiri', phone: '081234567905', address: 'Jl. Raya Cileungsi No. 45', city: 'Bogor', latitude: -6.3950, longitude: 106.9800 },
    request: { category_index: 8, title: 'Butuh Fly Ash untuk Campuran Bata Ringan', description: 'Abu terbang untuk bahan campuran pembuatan bata ringan.', quantity_kg: 3000 },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function insertCategories(client) {
  const categoryIds = [];
  for (const cat of wasteCategories) {
    const result = await client.query(
      `INSERT INTO waste_categories (name, description, price_per_kg, emission_factor, icon)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [cat.name, cat.description, cat.price_per_kg, cat.emission_factor, cat.icon]
    );
    categoryIds.push(result.rows[0].id);
  }
  console.log(`  ✓ ${categoryIds.length} kategori limbah berhasil di-insert`);
  return categoryIds;
}

async function insertUser(client, userData) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);

  const userResult = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3) RETURNING id`,
    [userData.email, passwordHash, userData.role]
  );
  const userId = userResult.rows[0].id;

  const { company_name, phone, address, city, latitude, longitude } = userData.profile;
  await client.query(
    `INSERT INTO profiles (user_id, company_name, phone, address, city, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, company_name, phone, address, city, latitude, longitude]
  );

  return userId;
}

async function insertSenders(client, categoryIds) {
  // Map sender email ke user id dan profil (untuk custom listings)
  const senderMap = {};

  for (const sender of senderUsers) {
    const userId = await insertUser(client, sender);
    senderMap[sender.email] = {
      userId,
      latitude: sender.profile.latitude,
      longitude: sender.profile.longitude,
    };

    // Insert regular listings
    for (const listing of sender.listings) {
      const categoryId = categoryIds[listing.category_index];
      await client.query(
        `INSERT INTO waste_listings (user_id, category_id, title, description, volume_kg, is_custom, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, categoryId, listing.title, listing.description, listing.volume_kg, false, sender.profile.latitude, sender.profile.longitude]
      );
    }
  }

  console.log(`  ✓ ${senderUsers.length} sender + ${senderUsers.length * 2} regular listings berhasil di-insert`);

  // Insert custom listings (limbah aneh)
  for (const custom of customListings) {
    const senderInfo = senderMap[custom.sender_email];
    await client.query(
      `INSERT INTO waste_listings (user_id, category_id, title, description, volume_kg, is_custom, custom_category, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [senderInfo.userId, null, custom.title, custom.description, custom.volume_kg, true, custom.custom_category, senderInfo.latitude, senderInfo.longitude]
    );
  }

  console.log(`  ✓ ${customListings.length} custom listings (limbah khusus) berhasil di-insert`);
}

async function insertReceivers(client, categoryIds) {
  for (const receiver of receiverUsers) {
    const userId = await insertUser(client, receiver);

    const categoryId = categoryIds[receiver.request.category_index];
    await client.query(
      `INSERT INTO material_requests (user_id, category_id, title, description, quantity_kg, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, categoryId, receiver.request.title, receiver.request.description, receiver.request.quantity_kg, receiver.profile.latitude, receiver.profile.longitude]
    );
  }

  console.log(`  ✓ ${receiverUsers.length} receiver + ${receiverUsers.length} material requests berhasil di-insert`);
}

// ============================================
// FIX E: Seed accepted matches untuk demo impact yang realistis
// ============================================

async function seedMatches(client) {
  // Pasangkan listing dengan request yang cocok (category sama, jarak dekat)
  // Pairs: (serbuk kayu → papan partikel), (HDPE → daur plastik), (kain perca → isi ulang), (minyak jelantah → biodiesel)
  const matchPairs = [
    { listingTitle: 'Serbuk Kayu Jati Sisa Produksi', requestTitle: 'Butuh Serbuk Kayu untuk Papan Partikel', score: 0.7200, distance_km: 19.5 },
    { listingTitle: 'Limbah HDPE Warna Campur',        requestTitle: 'Cari Limbah Plastik HDPE Bersih',       score: 0.7600, distance_km: 6.1 },
    { listingTitle: 'Kain Perca Katun Campur',          requestTitle: 'Terima Kain Perca untuk Isian',         score: 0.8400, distance_km: 18.3 },
    { listingTitle: 'Minyak Jelantah Bekas Gorengan',   requestTitle: 'Beli Minyak Jelantah untuk Biodiesel',  score: 0.6800, distance_km: 34.7 },
  ];

  let matchCount = 0;
  for (const pair of matchPairs) {
    const listingRes = await client.query(
      'SELECT id FROM waste_listings WHERE title = $1 LIMIT 1',
      [pair.listingTitle]
    );
    const requestRes = await client.query(
      'SELECT id FROM material_requests WHERE title = $1 LIMIT 1',
      [pair.requestTitle]
    );

    if (listingRes.rows.length === 0 || requestRes.rows.length === 0) continue;

    const listingId = listingRes.rows[0].id;
    const requestId = requestRes.rows[0].id;

    await client.query(
      `INSERT INTO matches (listing_id, request_id, score, distance_km, status)
       VALUES ($1, $2, $3, $4, 'accepted')
       ON CONFLICT (listing_id, request_id) DO NOTHING`,
      [listingId, requestId, pair.score, pair.distance_km]
    );

    // Update listing status ke matched
    await client.query(
      "UPDATE waste_listings SET status = 'matched' WHERE id = $1",
      [listingId]
    );

    matchCount++;
  }

  console.log(`  ✓ ${matchCount} accepted matches berhasil di-seed`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('Mulai seeding database...\n');

    // Bersihkan data lama (urutan sesuai dependency)
    await client.query('TRUNCATE contact_views, matches, material_requests, waste_listings, waste_categories, profiles, users CASCADE');
    console.log('  ✓ Tabel lama berhasil dibersihkan');

    // 1. Insert kategori limbah
    const categoryIds = await insertCategories(client);

    // 2. Insert sender users + listings + custom listings
    await insertSenders(client, categoryIds);

    // 3. Insert receiver users + material requests
    await insertReceivers(client, categoryIds);

    // 4. FIX E: Seed accepted matches agar impact counter tidak 0 di demo
    await seedMatches(client);

    await client.query('COMMIT');
    console.log('\n✅ Seeding selesai!');
    console.log('   - 10 kategori limbah');
    console.log('   - 5 sender + 10 regular listings + 2 custom listings');
    console.log('   - 5 receiver + 5 material requests');
    console.log('   - Matches: listing kayu+serbuk, plastik+HDPE, kain+perca, minyak+jelantah');
    console.log('   - Total: 10 users, 12 listings, 5 requests, 4 accepted matches');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding gagal:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
