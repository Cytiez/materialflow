import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/listings/${id}`),
      api.get('/api/categories'),
    ]).then(([listingRes, catRes]) => {
      const l = listingRes.data.data?.listing;
      setForm({
        title: l.title || '',
        description: l.description || '',
        volume_kg: l.volume_kg || '',
        category_id: l.category_id || '',
        is_custom: l.is_custom || false,
        custom_category: l.custom_category || '',
      });
      if (l.photo_url) {
        setPhotoPreview(`${import.meta.env.VITE_API_URL}/uploads/${l.photo_url}`);
      }
      setCategories(catRes.data.data?.categories || []);
    }).catch(() => navigate('/listings/my'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
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
    if (!form.title || !form.volume_kg) { setError('Judul dan volume wajib diisi.'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('volume_kg', form.volume_kg);
      if (!form.is_custom) formData.append('category_id', form.category_id);
      if (photo) formData.append('photo', photo);

      await api.put(`/api/listings/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      {error && <div className="mb-6"><ErrorMessage message={error} onClose={() => setError('')} /></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {form.is_custom && (
          <div className="card-white">
            <p className="text-[13px] font-semibold text-[#7c3aed] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Listing Limbah Khusus — tidak bisa diubah ke reguler
            </p>
          </div>
        )}

        {!form.is_custom && (
          <div>
            <label className="label-caps mb-1.5 block">Kategori Limbah</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="select-field">
              <option value="">Pilih kategori...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="label-caps mb-1.5 block">Judul</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Deskripsi</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field resize-none" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Volume (kg)</label>
          <input type="number" name="volume_kg" value={form.volume_kg} onChange={handleChange} min="1" step="0.01" className="input-field" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Foto</label>
          <div className="flex items-start gap-4">
            {photoPreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-cream border border-outline">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 rounded-lg border-2 border-dashed border-outline hover:border-moss/50 bg-cream flex flex-col items-center justify-center cursor-pointer">
                <svg className="w-8 h-8 text-stone/30 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] text-stone/50">Upload</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 min-w-[160px]">
            {saving ? <LoadingSpinner size="sm" text="" /> : 'Simpan Perubahan'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
        </div>
      </form>
    </div>
  );
}
