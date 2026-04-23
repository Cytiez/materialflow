import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ListingCard from '../components/listings/ListingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const TABS = [
  { key: 'active', label: 'Aktif' },
  { key: 'matched', label: 'Deal Berjalan' },
  { key: 'completed', label: 'Selesai' },
  { key: 'expired', label: 'Expired' },
];

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    api.get('/api/listings/my')
      .then(r => setListings(r.data.data?.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // Group by status
  const byStatus = {
    active: listings.filter(l => l.status === 'active'),
    matched: listings.filter(l => l.status === 'matched'),
    completed: listings.filter(l => l.status === 'completed'),
    expired: listings.filter(l => l.status === 'expired'),
  };

  const totalActive = listings.length;
  const currentList = byStatus[activeTab] || [];

  // Badge counts for tabs
  const countBadge = (key) => {
    const n = byStatus[key]?.length || 0;
    return n > 0 ? n : null;
  };

  const emptyMessages = {
    active: { title: 'Tidak ada listing aktif', desc: 'Buat listing baru untuk mulai menawarkan limbah Anda.' },
    matched: { title: 'Belum ada deal berjalan', desc: 'Deal berjalan saat receiver menyetujui tawaran dari listing Anda.' },
    completed: { title: 'Belum ada listing selesai', desc: 'Listing akan selesai setelah kedua pihak mengkonfirmasi transaksi.' },
    expired: { title: 'Tidak ada listing expired', desc: 'Listing yang melewati batas waktu akan muncul di sini.' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-body text-stone">{totalActive} listing total</p>
        <Link to="/listings/create" className="btn-cta flex items-center gap-2 !text-[13px]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          title="Belum ada listing"
          description="Mulai posting limbah Anda untuk terhubung dengan receiver yang membutuhkan."
          actionLabel="Buat Listing Pertama"
          actionTo="/listings/create"
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-outline">
            {TABS.map(tab => {
              const count = countBadge(tab.key);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors -mb-px ${
                    isActive
                      ? 'border-forest text-forest'
                      : 'border-transparent text-stone hover:text-soil'
                  }`}
                >
                  {tab.label}
                  {count !== null && (
                    <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                      isActive ? 'bg-forest text-white' : 'bg-stone/20 text-stone'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {currentList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] font-semibold text-soil mb-1">{emptyMessages[activeTab]?.title}</p>
              <p className="text-[13px] text-stone">{emptyMessages[activeTab]?.desc}</p>
              {activeTab === 'active' && (
                <Link to="/listings/create" className="btn-primary mt-4 inline-block">
                  Buat Listing
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* Aktif sub-sections: baru vs sudah ada hasil matching */}
              {activeTab === 'active' && (() => {
                const withMatches = currentList.filter(l => parseInt(l.match_count) > 0);
                const withoutMatches = currentList.filter(l => parseInt(l.match_count) === 0);
                return (
                  <div className="space-y-8">
                    {withMatches.length > 0 && (
                      <div>
                        <p className="label-caps mb-3 text-stone/70">Menunggu Respon Receiver ({withMatches.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {withMatches.map(listing => (
                            <ListingCard key={listing.id} listing={listing} showStatus />
                          ))}
                        </div>
                      </div>
                    )}
                    {withoutMatches.length > 0 && (
                      <div>
                        {withMatches.length > 0 && (
                          <p className="label-caps mb-3 text-stone/70">Belum Diproses ({withoutMatches.length})</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {withoutMatches.map(listing => (
                            <ListingCard key={listing.id} listing={listing} showStatus />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab !== 'active' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentList.map(listing => (
                    <ListingCard key={listing.id} listing={listing} showStatus />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
