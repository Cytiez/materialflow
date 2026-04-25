import { useState, useEffect } from 'react';
import api from '../api/axios';
import ListingCard from '../components/listings/ListingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    is_custom: '',
    search: '',
    page: 1,
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data.data?.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category_id) params.set('category_id', filters.category_id);
        if (filters.is_custom) params.set('is_custom', filters.is_custom);
        if (filters.search) params.set('search', filters.search);
        params.set('page', filters.page);
        params.set('limit', 12);

        const res = await api.get(`/api/listings?${params}`);
        setListings(res.data.data?.listings || []);
        setPagination(res.data.data?.pagination || null);
      } catch {
        setListings([]);
        setFetchError('Gagal memuat data listing. Periksa koneksi Anda.');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, search: searchInput, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {fetchError && <ErrorMessage message={fetchError} onClose={() => setFetchError('')} />}
      {/* Filters */}
      <div className="card-white">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Cari listing..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field !py-2"
            />
          </div>
          <select
            value={filters.category_id}
            onChange={(e) => setFilters(f => ({ ...f, category_id: e.target.value, page: 1 }))}
            className="select-field !w-auto !py-2 min-w-[180px]"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.is_custom}
            onChange={(e) => setFilters(f => ({ ...f, is_custom: e.target.value, page: 1 }))}
            className="select-field !w-auto !py-2 min-w-[140px]"
          >
            <option value="">Semua Tipe</option>
            <option value="false">Reguler</option>
            <option value="true">Limbah Khusus</option>
          </select>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="Tidak ada listing ditemukan"
          description="Coba ubah filter atau kata kunci pencarian Anda."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary !py-2 !px-3 !text-[12px] disabled:opacity-30"
              >
                Sebelumnya
              </button>
              <span className="text-body-sm text-stone px-3">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                disabled={filters.page >= pagination.total_pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary !py-2 !px-3 !text-[12px] disabled:opacity-30"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
