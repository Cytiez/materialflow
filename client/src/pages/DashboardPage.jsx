import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ListingCard from '../components/listings/ListingCard';
import RequestCard from '../components/requests/RequestCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

function ImpactCard({ icon, value, unit, label }) {
  return (
    <div className="card-white flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-moss/10 flex items-center justify-center text-moss shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[22px] font-extrabold text-forest tracking-tight leading-none">
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        <p className="text-[12px] text-stone mt-0.5">{unit}</p>
        {label && <p className="text-[11px] text-stone/50">{label}</p>}
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, description, cta = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        cta
          ? 'border-terracotta/20 bg-terracotta/5 hover:bg-terracotta/10'
          : 'border-outline bg-surface-white hover:bg-surface-low'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        cta ? 'bg-terracotta/10 text-terracotta' : 'bg-moss/10 text-moss'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-soil">{label}</p>
        <p className="text-[11px] text-stone">{description}</p>
      </div>
      <svg className="w-4 h-4 text-stone/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, isSender, isReceiver } = useAuth();
  const [impact, setImpact] = useState(null);
  const [impactError, setImpactError] = useState(false);
  const [items, setItems] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          api.get('/api/impact/personal'),
        ];

        if (isSender) {
          promises.push(api.get('/api/listings/my'));
        } else {
          promises.push(api.get('/api/requests/my'));
          promises.push(api.get('/api/listings?limit=4'));
        }

        const results = await Promise.allSettled(promises);

        // Impact (index 0)
        if (results[0].status === 'fulfilled') {
          setImpact(results[0].value.data.data?.impact);
        } else {
          setImpactError(true);
        }

        // My items (index 1)
        if (results[1]?.status === 'fulfilled') {
          setItems(
            isSender
              ? results[1].value.data.data?.listings || []
              : results[1].value.data.data?.requests || []
          );
        }

        // Recent listings for receiver (index 2)
        if (isReceiver && results[2]?.status === 'fulfilled') {
          setRecentListings(results[2].value.data.data?.listings || []);
        }
      } catch {
        setImpactError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSender, isReceiver]);

  if (loading) return <LoadingSpinner />;

  const greeting = user?.profile?.company_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg text-forest">
          Selamat datang, {greeting}
        </h1>
        <p className="text-body text-stone mt-1">
          {isSender
            ? 'Kelola listing limbah dan pantau dampak lingkungan Anda.'
            : 'Temukan material yang Anda butuhkan dan pantau permintaan Anda.'
          }
        </p>
      </div>

      {/* Impact cards */}
      <div>
        <p className="label-caps mb-3">Dampak Personal</p>
        {impactError ? (
          <div className="card-white text-center py-6">
            <p className="text-[13px] text-stone/60 italic">Data impact tidak tersedia saat ini.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImpactCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            value={Math.round(impact?.total_waste_kg || 0)}
            unit="kg limbah tersalurkan"
          />
          <ImpactCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={`Rp ${Math.round(impact?.economic_value || 0).toLocaleString('id-ID')}`}
            unit="nilai ekonomi"
          />
          <ImpactCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            }
            value={((impact?.co2_saved_ton || 0) * 1000).toFixed(1)}
            unit="kg CO₂ dicegah"
          />
          <ImpactCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            value={Math.round(impact?.pohon_equivalent || 0)}
            unit="pohon ekuivalen"
          />
        </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <p className="label-caps mb-3">Aksi Cepat</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isSender ? (
            <>
              <QuickAction
                to="/listings/create"
                cta
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
                label="Buat Listing Baru"
                description="Posting limbah yang tersedia"
              />
              <QuickAction
                to="/listings/my"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                label="Listing Saya"
                description="Kelola listing limbah Anda"
              />
              <QuickAction
                to="/requests"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                label="Lihat Permintaan"
                description="Cari receiver yang membutuhkan"
              />
              <QuickAction
                to="/impact"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                label="Impact Dashboard"
                description="Dampak lingkungan Anda"
              />
            </>
          ) : (
            <>
              <QuickAction
                to="/requests/create"
                cta
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
                label="Buat Permintaan Baru"
                description="Cari material yang dibutuhkan"
              />
              <QuickAction
                to="/requests/my"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                label="Permintaan Saya"
                description="Kelola permintaan material Anda"
              />
              <QuickAction
                to="/listings"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                label="Cari Limbah"
                description="Browse listing limbah tersedia"
              />
              <QuickAction
                to="/impact"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                label="Impact Dashboard"
                description="Dampak lingkungan Anda"
              />
            </>
          )}
        </div>
      </div>

      {/* Sender: My recent listings */}
      {isSender && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label-caps">Listing Terbaru</p>
            <Link to="/listings/my" className="text-moss text-[12px] font-semibold hover:underline">
              Lihat semua
            </Link>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              title="Belum ada listing"
              description="Mulai posting limbah Anda untuk terhubung dengan receiver."
              actionLabel="Buat Listing"
              actionTo="/listings/create"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.slice(0, 6).map((listing) => (
                <ListingCard key={listing.id} listing={listing} showStatus />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receiver: My recent requests */}
      {isReceiver && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label-caps">Permintaan Saya</p>
              <Link to="/requests/my" className="text-moss text-[12px] font-semibold hover:underline">
                Lihat semua
              </Link>
            </div>
            {items.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                title="Belum ada permintaan"
                description="Buat permintaan material untuk mulai mencari sumber limbah."
                actionLabel="Buat Permintaan"
                actionTo="/requests/create"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.slice(0, 3).map((request) => (
                  <RequestCard key={request.id} request={request} showStatus />
                ))}
              </div>
            )}
          </div>

          {/* Receiver: Browse recent listings */}
          {recentListings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="label-caps">Listing Limbah Terbaru</p>
                <Link to="/listings" className="text-moss text-[12px] font-semibold hover:underline">
                  Lihat semua
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
