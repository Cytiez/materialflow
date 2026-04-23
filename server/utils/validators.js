// Validasi format email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validasi password: min 8 karakter, 1 huruf besar, 1 angka
const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

// Validasi role
const isValidRole = (role) => {
  return ['sender', 'receiver'].includes(role);
};

// Validasi koordinat Jabodetabek
// Bounding box: lat -7.0 to -5.8, lng 106.3 to 107.5
const isValidJabodetabekCoords = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -7.0 && lat <= -5.8 && lng >= 106.3 && lng <= 107.5;
};

// Validasi field wajib — cek apakah ada dan bukan string kosong
const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

// Validasi angka positif
const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Validasi register input — return array of error messages
const validateRegisterInput = (body) => {
  const errors = [];
  const { email, password, role, company_name, phone, address, city, latitude, longitude } = body;

  if (!isNotEmpty(email) || !isValidEmail(email)) {
    errors.push('Email tidak valid.');
  }
  if (!isValidPassword(password)) {
    errors.push('Password minimal 8 karakter, harus mengandung huruf besar dan angka.');
  }
  if (!isValidRole(role)) {
    errors.push('Role harus sender atau receiver.');
  }
  if (!isNotEmpty(company_name)) {
    errors.push('Nama perusahaan wajib diisi.');
  }
  if (!isNotEmpty(phone)) {
    errors.push('Nomor telepon wajib diisi.');
  }
  if (!isNotEmpty(address)) {
    errors.push('Alamat wajib diisi.');
  }
  if (!isNotEmpty(city)) {
    errors.push('Kota wajib diisi.');
  }
  if (!isValidJabodetabekCoords(latitude, longitude)) {
    errors.push('Koordinat harus berada di wilayah Jabodetabek.');
  }

  return errors;
};

// Validasi volume limbah (FIX 9)
const isValidVolume = (volume_kg) => {
  const vol = parseFloat(volume_kg);
  if (isNaN(vol)) return { valid: false, message: 'Volume harus berupa angka.' };
  if (vol < 0.1) return { valid: false, message: 'Volume minimal 0.1 kg.' };
  if (vol > 1000000) return { valid: false, message: 'Volume maksimal 1.000.000 kg (1000 ton).' };
  return { valid: true };
};

// Validasi listing input
const validateListingInput = (body) => {
  const errors = [];
  const { title, volume_kg, is_custom, category_id, custom_category } = body;

  if (!isNotEmpty(title)) {
    errors.push('Judul listing wajib diisi.');
  }
  if (!isPositiveNumber(volume_kg)) {
    errors.push('Volume harus berupa angka positif.');
  } else {
    const volCheck = isValidVolume(volume_kg);
    if (!volCheck.valid) errors.push(volCheck.message);
  }

  if (is_custom) {
    if (!isNotEmpty(custom_category)) {
      errors.push('Kategori khusus wajib diisi untuk limbah khusus.');
    }
  } else {
    if (!category_id) {
      errors.push('Kategori limbah wajib dipilih.');
    }
  }

  return errors;
};

// Validasi request input
const validateRequestInput = (body) => {
  const errors = [];
  const { title, quantity_kg, category_id } = body;

  if (!isNotEmpty(title)) {
    errors.push('Judul permintaan wajib diisi.');
  }
  if (!isPositiveNumber(quantity_kg)) {
    errors.push('Jumlah harus berupa angka positif.');
  }
  if (!category_id) {
    errors.push('Kategori material wajib dipilih.');
  }

  return errors;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidJabodetabekCoords,
  isNotEmpty,
  isPositiveNumber,
  isValidVolume,
  validateRegisterInput,
  validateListingInput,
  validateRequestInput,
};
