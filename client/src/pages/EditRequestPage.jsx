import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function EditRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/requests/${id}`),
      api.get('/api/categories'),
    ]).then(([reqRes, catRes]) => {
      const r = reqRes.data.data?.request;
      setForm({
        title: r.title || '',
        description: r.description || '',
        quantity_kg: r.quantity_kg || '',
        category_id: r.category_id || '',
      });
      setCategories(catRes.data.data?.categories || []);
    }).catch(() => navigate('/requests/my'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.quantity_kg || !form.category_id) {
      setError('Judul, kategori, dan jumlah wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/requests/${id}`, {
        title: form.title,
        description: form.description,
        quantity_kg: Number(form.quantity_kg),
        category_id: Number(form.category_id),
      });
      navigate(`/requests/${id}`);
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
        <div>
          <label className="label-caps mb-1.5 block">Kategori Material</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} className="select-field">
            <option value="">Pilih kategori...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Judul</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Deskripsi</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field resize-none" />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Jumlah Dibutuhkan (kg)</label>
          <input type="number" name="quantity_kg" value={form.quantity_kg} onChange={handleChange} min="1" step="0.01" className="input-field" />
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
