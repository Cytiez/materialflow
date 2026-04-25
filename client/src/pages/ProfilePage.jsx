import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(r => {
        const u = r.data.data?.user;
        const p = u?.profile || {};
        setForm({
          company_name: p.company_name || '',
          phone: p.phone || '',
          address: p.address || '',
          city: p.city || '',
          latitude: p.latitude || -6.2,
          longitude: p.longitude || 106.85,
        });
        if (p.photo_url) {
          setPhotoPreview(`${import.meta.env.VITE_API_URL}/uploads/${p.photo_url}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form || !document.getElementById('profile-map')) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (mapRef.current) return;

      const map = L.map('profile-map').setView([form.latitude, form.longitude], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const marker = L.marker([form.latitude, form.longitude], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setForm(f => ({ ...f, latitude: pos.lat, longitude: pos.lng }));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setForm(f => ({ ...f, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    // FIX 10: Cleanup map saat komponen unmount (cegah memory leak)
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [form?.latitude !== undefined]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError(`Ukuran foto maksimum 2MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB`); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.company_name || !form.phone || !form.address || !form.city) {
      setError('Semua field wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('company_name', form.company_name);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('city', form.city);
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);
      if (photo) formData.append('photo', photo);

      const res = await api.put('/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (updateUser && res.data.data?.profile) {
        updateUser({ ...user, profile: res.data.data.profile });
      }

      setSuccess('Profil berhasil diperbarui.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <ErrorMessage message={success} type="success" onClose={() => setSuccess('')} autoDismiss />}

      {/* User info header */}
      <div className="card-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-moss flex items-center justify-center text-white text-[20px] font-bold">
            {user?.profile?.company_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-[16px] font-bold text-soil">{user?.email}</p>
            <p className="text-[12px] text-stone capitalize">{user?.role === 'sender' ? 'Waste Sender' : 'Waste Receiver'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label-caps mb-1.5 block">Nama Perusahaan</label>
          <input type="text" name="company_name" value={form.company_name} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Telepon</label>
          <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Alamat</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input-field resize-none" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Kota</label>
          <input type="text" name="city" value={form.city} onChange={handleChange} className="input-field" />
        </div>

        {/* Photo */}
        <div>
          <label className="label-caps mb-1.5 block">Foto Profil</label>
          <div className="flex items-start gap-4">
            {photoPreview ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-cream border border-outline">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-full border-2 border-dashed border-outline hover:border-moss/50 bg-cream flex flex-col items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-stone/30 text-[28px]">add_a_photo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Map */}
        <div>
          <label className="label-caps mb-1.5 block">Lokasi (klik peta untuk memindahkan)</label>
          <div id="profile-map" className="h-64 rounded-lg border border-outline z-0" />
          <p className="text-[11px] text-stone/50 mt-1">
            Lat: {Number(form.latitude).toFixed(6)}, Lng: {Number(form.longitude).toFixed(6)}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 min-w-[160px]">
            {saving ? <LoadingSpinner size="sm" text="" /> : 'Simpan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
}
