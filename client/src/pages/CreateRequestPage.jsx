import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity_kg: '',
    category_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data.data?.categories || [])).catch(() => {});
  }, []);

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
    if (Number(form.quantity_kg) <= 0) {
      setError('Jumlah harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/requests', {
        title: form.title,
        description: form.description,
        quantity_kg: Number(form.quantity_kg),
        category_id: Number(form.category_id),
      });
      navigate(`/requests/${res.data.data.request.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat permintaan.');
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
        {/* Kategori */}
        <div>
          <label className="label-caps mb-1.5 block">Kategori Material</label>
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

        {/* Judul */}
        <div>
          <label className="label-caps mb-1.5 block">Judul Permintaan</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Deskripsi singkat material yang dibutuhkan"
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
            placeholder="Detail kebutuhan, spesifikasi, frekuensi..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        {/* Jumlah */}
        <div>
          <label className="label-caps mb-1.5 block">Jumlah Dibutuhkan (kg)</label>
          <input
            type="number"
            name="quantity_kg"
            value={form.quantity_kg}
            onChange={handleChange}
            placeholder="0"
            min="1"
            step="0.01"
            className="input-field"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 min-w-[160px]"
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : 'Buat Permintaan'}
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
