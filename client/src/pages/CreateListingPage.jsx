import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    volume_kg: '',
    category_id: '',
    is_custom: false,
    custom_category: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data.data?.categories || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'is_custom' && checked ? { category_id: '' } : {}),
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(`Ukuran foto maksimum 2MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format foto harus JPEG, PNG, atau WebP.');
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.volume_kg) {
      setError('Judul dan volume wajib diisi.');
      return;
    }
    if (Number(form.volume_kg) <= 0) {
      setError('Volume harus lebih dari 0.');
      return;
    }
    if (!form.is_custom && !form.category_id) {
      setError('Pilih kategori limbah.');
      return;
    }
    if (form.is_custom && !form.custom_category) {
      setError('Isi nama kategori khusus.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('volume_kg', form.volume_kg);
      formData.append('is_custom', form.is_custom);

      if (form.is_custom) {
        formData.append('custom_category', form.custom_category);
      } else {
        formData.append('category_id', form.category_id);
      }

      if (photo) {
        formData.append('photo', photo);
      }

      const res = await api.post('/api/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newListing = res.data.data.listing;
      const matchCount = res.data.data.match_count || 0;
      if (matchCount > 0) {
        navigate(`/listings/${newListing.id}/matches`);
      } else {
        navigate(`/listings/${newListing.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onClose={() => setError('')} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipe limbah toggle */}
        <div className="card-white">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_custom"
              checked={form.is_custom}
              onChange={handleChange}
              className="w-4 h-4 rounded border-outline text-moss focus:ring-moss"
            />
            <div>
              <p className="text-[13px] font-semibold text-soil">Limbah Khusus</p>
              <p className="text-[11px] text-stone">
                Centang jika jenis limbah tidak ada di kategori standar. Listing limbah khusus tidak bisa di-matching otomatis.
              </p>
            </div>
          </label>
        </div>

        {/* Kategori */}
        {!form.is_custom ? (
          <div>
            <label className="label-caps mb-1.5 block">Kategori Limbah</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="select-field"
            >
              <option value="">Pilih kategori...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label-caps mb-1.5 block">Nama Kategori Khusus</label>
            <input
              type="text"
              name="custom_category"
              value={form.custom_category}
              onChange={handleChange}
              placeholder="Contoh: Debu Logam Industri"
              className="input-field"
            />
          </div>
        )}

        {/* Judul */}
        <div>
          <label className="label-caps mb-1.5 block">Judul Listing</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Deskripsi singkat limbah Anda"
            className="input-field"
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label className="label-caps mb-1.5 block">Deskripsi</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Detail tentang kondisi, kualitas, frekuensi ketersediaan..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="label-caps mb-1.5 block">Volume (kg)</label>
          <input
            type="number"
            name="volume_kg"
            value={form.volume_kg}
            onChange={handleChange}
            placeholder="0"
            min="1"
            step="0.01"
            className="input-field"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="label-caps mb-1.5 block">Foto (opsional)</label>
          <div className="flex items-start gap-4">
            {photoPreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-cream border border-outline">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 rounded-lg border-2 border-dashed border-outline hover:border-moss/50 bg-cream flex flex-col items-center justify-center cursor-pointer transition-colors">
                <svg className="w-8 h-8 text-stone/30 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] text-stone/50">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
            )}
            <div className="text-[11px] text-stone/50 mt-2">
              <p>JPEG, PNG, atau WebP. Maks 2MB.</p>
              {photo && <p className="mt-1 text-moss font-semibold">{(photo.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 min-w-[160px]"
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : 'Buat Listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
