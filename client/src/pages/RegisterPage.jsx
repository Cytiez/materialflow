import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../api/axios';

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Jabodetabek bounds
const JABODATABEK_CENTER = [-6.2, 106.85];
const MIN_LAT = -6.9, MAX_LAT = -6.0, MIN_LNG = 106.4, MAX_LNG = 107.3;

function isValidCoord(lat, lng) {
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}

// Map click handler component
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isValidCoord(lat, lng)) {
        setPosition([lat, lng]);
      }
    },
  });
  return position ? <Marker position={position} /> : null;
}

const CITIES = [
  'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur',
  'Bogor', 'Depok', 'Tangerang', 'Tangerang Selatan', 'Bekasi',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [activeTab, setActiveTab] = useState('sender');
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    company_name: '', phone: '', address: '', city: '',
  });
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.email || !form.password || !form.company_name || !form.phone || !form.address || !form.city) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi tidak cocok.');
      return;
    }
    if (!position) {
      setError('Pilih lokasi pada peta.');
      return;
    }
    if (!isValidCoord(position[0], position[1])) {
      setError('Lokasi harus berada di area Jabodetabek.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: activeTab,
        company_name: form.company_name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        latitude: position[0],
        longitude: position[1],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex">
      {/* Left — branding panel */}
      <div
        className="hidden xl:flex xl:w-[420px] flex-col justify-between p-10 bg-forest"
      >
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-white font-bold text-[17px] tracking-tight">MaterialFlow</span>
          </div>

          <h1 className="text-white text-[28px] font-extrabold leading-tight tracking-tight mb-4">
            Bergabung dengan<br />jaringan sirkuler.
          </h1>
          <p className="text-white/60 text-[14px] leading-relaxed max-w-xs">
            Daftarkan usaha Anda dan mulai terhubung dengan mitra yang tepat untuk mengelola limbah secara berkelanjutan.
          </p>
        </div>

        <div className="space-y-5">
          <div className="p-4 rounded-md bg-white/10">
            <p className="text-white/90 text-[13px] font-semibold mb-1">Waste Sender</p>
            <p className="text-white/50 text-[12px] leading-relaxed">
              UMKM dan industri yang menghasilkan limbah. Posting listing limbah Anda, dapatkan match otomatis dengan penerima.
            </p>
          </div>
          <div className="p-4 rounded-md bg-white/10">
            <p className="text-white/90 text-[13px] font-semibold mb-1">Waste Receiver</p>
            <p className="text-white/50 text-[12px] leading-relaxed">
              Industri yang membutuhkan material daur ulang. Buat permintaan, temukan sumber limbah terdekat.
            </p>
          </div>
        </div>
      </div>

      {/* Right — register form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Mobile logo */}
          <div className="xl:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-forest flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-forest font-bold text-[17px] tracking-tight">MaterialFlow</span>
          </div>

          <h2 className="text-headline-md text-forest mb-1">Daftar Akun</h2>
          <p className="text-stone text-body mb-8">
            Buat akun baru untuk mulai menghubungkan limbah dengan kebutuhan material.
          </p>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onClose={() => setError('')} />
            </div>
          )}

          {/* Role tabs */}
          <div className="flex rounded-md bg-cream border border-outline p-1 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('sender')}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded transition-all ${
                activeTab === 'sender'
                  ? 'bg-surface-white text-forest shadow-sm'
                  : 'text-stone hover:text-soil'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Waste Sender
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receiver')}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded transition-all ${
                activeTab === 'receiver'
                  ? 'bg-surface-white text-forest shadow-sm'
                  : 'text-stone hover:text-soil'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Waste Receiver
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Akun section */}
            <div>
              <p className="label-caps mb-4">Informasi Akun</p>
              <div className="space-y-4">
                <div>
                  <label className="text-body-sm font-medium text-soil mb-1.5 block">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@perusahaan.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-body-sm font-medium text-soil mb-1.5 block">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 karakter"
                      className="input-field"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="text-body-sm font-medium text-soil mb-1.5 block">Konfirmasi Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password"
                      className="input-field"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profil section */}
            <div>
              <p className="label-caps mb-4">Profil Perusahaan</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-body-sm font-medium text-soil mb-1.5 block">Nama Perusahaan</label>
                    <input
                      type="text"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="PT / CV / UD ..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-body-sm font-medium text-soil mb-1.5 block">No. Telepon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="08xxxxxxxxxx"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-body-sm font-medium text-soil mb-1.5 block">Alamat Lengkap</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Jl. ..."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-body-sm font-medium text-soil mb-1.5 block">Kota</label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="select-field"
                  >
                    <option value="">Pilih kota...</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lokasi section */}
            <div>
              <p className="label-caps mb-2">Lokasi pada Peta</p>
              <p className="text-body-sm text-stone mb-3">
                Klik pada peta untuk menandai lokasi usaha Anda (area Jabodetabek).
              </p>
              <div className="rounded-lg overflow-hidden border border-outline" style={{ height: 280 }}>
                <MapContainer
                  center={JABODATABEK_CENTER}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              {position && (
                <p className="text-[11px] text-stone mt-2">
                  Koordinat: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                `Daftar sebagai ${activeTab === 'sender' ? 'Waste Sender' : 'Waste Receiver'}`
              )}
            </button>
          </form>

          <p className="text-center text-body-sm text-stone mt-8 pb-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-moss font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
