import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import RequestCard from '../components/requests/RequestCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

// Incoming offer card — used inside MyRequestsPage
function TawaranCard({ match, onUpdate }) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [doneError, setDoneError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = async (newStatus) => {
    // FIX 6: Konfirmasi sebelum terima tawaran
    if (newStatus === 'accepted') {
      const ok = confirm(`Terima tawaran dari ${match.company_name}?\n\nDeal akan berjalan dan perlu dikonfirmasi selesai oleh kedua pihak setelah material diterima.`);
      if (!ok) return;
    }
    setLoadingStatus(true);
    setStatusError('');
    try {
      await api.patch(`/api/matches/${match.id}/status`, { status: newStatus });
      onUpdate(match.id, { status: newStatus });
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal mengubah status, coba lagi.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDone = async () => {
    setLoadingDone(true);
    setDoneError('');
    try {
      const res = await api.patch(`/api/matches/${match.id}/done`);
      onUpdate(match.id, { receiver_done: true, completed: res.data.data?.completed });
    } catch (err) {
      setDoneError(err.response?.data?.message || 'Gagal mengkonfirmasi, coba lagi.');
    } finally {
      setLoadingDone(false);
    }
  };

  const isAccepted = match.status === 'accepted';
  const isRejected = match.status === 'rejected';
  const scorePct = Math.round(Number(match.score || 0) * 100);

  return (
    <div className={`card-white border ${isAccepted ? 'border-moss/50' : isRejected ? 'border-outline opacity-60' : 'border-outline'} transition-all`}>
      <div className="flex items-start gap-4">
        {/* Score circle */}
        <div className="shrink-0 w-14 h-14 rounded-full border-2 border-moss/30 flex flex-col items-center justify-center">
          <span className="text-[18px] font-extrabold text-moss leading-none">{scorePct}%</span>
          <span className="text-[8px] text-stone font-bold uppercase tracking-wide">match</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isAccepted && (
              <span className="text-[9px] font-bold text-moss tracking-[0.1em] uppercase flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">handshake</span> DEAL BERJALAN
              </span>
            )}
            {isRejected && (
              <span className="text-[9px] font-bold text-terracotta tracking-[0.1em] uppercase">DITOLAK</span>
            )}
          </div>
          <p className="text-[14px] font-bold text-soil truncate">{match.company_name || '—'}</p>
          <p className="text-[12px] text-stone">{match.city} · {match.category_name || 'Material'}</p>
          <p className="text-[11px] text-stone italic mt-0.5 truncate">{match.listing_title}</p>
          <div className="flex gap-3 mt-1.5 text-[11px] text-stone">
            <span>{Number(match.volume_kg || 0).toLocaleString('id-ID')} kg</span>
            <span>·</span>
            <span>{Number(match.distance_km || 0).toFixed(1)} km</span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col gap-2 items-end">
          {isAccepted ? (
            <>
              {/* Konfirmasi selesai */}
              {match.receiver_done ? (
                <span className="text-[11px] text-moss font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Konfirmasi Terkirim
                </span>
              ) : (
                <button
                  onClick={handleDone}
                  disabled={loadingDone}
                  className="text-[11px] font-bold text-white bg-moss hover:bg-forest px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingDone ? '...' : <><span className="material-symbols-outlined text-[13px]">task_alt</span> Konfirmasi Selesai</>}
                </button>
              )}
              {doneError && <p className="text-[10px] text-terracotta">{doneError}</p>}
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={loadingStatus}
                className="text-[10px] text-stone hover:text-terracotta transition-colors"
              >
                Batalkan Deal
              </button>
            </>
          ) : isRejected ? (
            <button
              onClick={() => handleStatusChange('pending')}
              disabled={loadingStatus}
              className="text-[11px] text-moss hover:brightness-75 transition-colors font-semibold"
            >
              Pulihkan
            </button>
          ) : (
            <>
              <button
                onClick={() => handleStatusChange('accepted')}
                disabled={loadingStatus}
                className="text-[11px] font-bold text-white bg-moss hover:bg-forest px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {loadingStatus ? '...' : <><span className="material-symbols-outlined text-[13px]">handshake</span> Terima</>}
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={loadingStatus}
                className="text-[11px] text-stone hover:text-terracotta border border-outline hover:border-terracotta/30 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                Tolak
              </button>
            </>
          )}
          {statusError && <p className="text-[10px] text-terracotta text-right">{statusError}</p>}
        </div>
      </div>

      {/* FIX 16: Guidance setelah deal diterima */}
      {isAccepted && !match.receiver_done && (
        <div className="mt-3 mx-0 px-4 py-2.5 bg-moss/5 border border-moss/20 rounded-lg">
          <p className="text-[12px] text-moss font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Langkah selanjutnya
          </p>
          <p className="text-[11px] text-stone mt-0.5">
            Hubungi pengirim untuk koordinasi penyerahan material. Setelah material diterima, klik <strong>"Konfirmasi Selesai"</strong>.
          </p>
        </div>
      )}

      {/* Expand detail link */}
      <div className="mt-3 pt-3 border-t border-outline/50 flex justify-between items-center">
        <Link
          to={`/listings/${match.listing_id}`}
          className="text-[11px] text-stone hover:text-moss transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          Lihat Listing Pengirim
        </Link>
        <Link
          to={`/requests/${match.request_id}`}
          className="text-[11px] text-stone hover:text-moss transition-colors"
        >
          Request: {match.request_title}
        </Link>
      </div>
    </div>
  );
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tawaran');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, inRes] = await Promise.allSettled([
        api.get('/api/requests/my'),
        api.get('/api/matches/incoming'),
      ]);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data.data?.requests || []);
      if (inRes.status === 'fulfilled') setIncoming(inRes.value.data.data?.matches || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleMatchUpdate = (matchId, patch) => {
    setIncoming(prev => prev.map(m => m.id === matchId ? { ...m, ...patch } : m));
  };

  if (loading) return <LoadingSpinner />;

  const pendingIncoming = incoming.filter(m => m.status === 'pending');
  const acceptedIncoming = incoming.filter(m => m.status === 'accepted');
  const rejectedIncoming = incoming.filter(m => m.status === 'rejected');

  const tabs = [
    { key: 'tawaran', label: 'Tawaran Masuk', count: pendingIncoming.length > 0 ? pendingIncoming.length : null },
    { key: 'deal', label: 'Deal Berjalan', count: acceptedIncoming.length > 0 ? acceptedIncoming.length : null },
    { key: 'permintaan', label: 'Permintaan Saya', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-body text-stone">{requests.length} permintaan · {incoming.length} tawaran</p>
        <Link to="/requests/create" className="btn-cta flex items-center gap-2 !text-[13px]">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Buat Permintaan
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline">
        {tabs.map(tab => {
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
              {tab.count !== null && (
                <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                  isActive ? 'bg-forest text-white' : 'bg-terracotta text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Tawaran Masuk (pending) */}
      {activeTab === 'tawaran' && (
        <>
          {pendingIncoming.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-[40px] text-stone/30 block mb-3">inbox</span>
              <p className="text-[14px] font-semibold text-soil mb-1">Belum ada tawaran masuk</p>
              <p className="text-[13px] text-stone">Sender akan mengirim tawaran saat mereka menjalankan matching untuk listing yang cocok dengan permintaan Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncoming.map(match => (
                <TawaranCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
              ))}
            </div>
          )}

          {/* Juga tampilkan yang sudah ditolak di bawah */}
          {rejectedIncoming.length > 0 && (
            <div>
              <p className="label-caps mb-3 text-stone/50">Ditolak ({rejectedIncoming.length})</p>
              <div className="space-y-3 opacity-70">
                {rejectedIncoming.map(match => (
                  <TawaranCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Deal Berjalan (accepted) */}
      {activeTab === 'deal' && (
        <>
          {acceptedIncoming.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-[40px] text-stone/30 block mb-3">handshake</span>
              <p className="text-[14px] font-semibold text-soil mb-1">Belum ada deal berjalan</p>
              <p className="text-[13px] text-stone">Deal berjalan saat Anda menerima tawaran dari sender.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedIncoming.map(match => (
                <TawaranCard key={match.id} match={match} onUpdate={handleMatchUpdate} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Permintaan Saya */}
      {activeTab === 'permintaan' && (
        <>
          {requests.length === 0 ? (
            <EmptyState
              icon={<span className="material-symbols-outlined text-[32px]">assignment</span>}
              title="Belum ada permintaan"
              description="Buat permintaan material untuk mulai terhubung dengan sender yang memiliki limbah."
              actionLabel="Buat Permintaan Pertama"
              actionTo="/requests/create"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map(request => (
                <RequestCard key={request.id} request={request} showStatus />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
