import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Custom marker icons
const senderIcon = new L.DivIcon({
  html: '<div style="width:12px;height:12px;background:#1C3520;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const receiverIcon = new L.DivIcon({
  html: '<div style="width:8px;height:8px;background:#4A7C59;border-radius:50%"></div>',
  className: '',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

function ImpactHero({ listing, matches }) {
  const acceptedMatches = matches.filter(m => m.status === 'accepted');
  const hasAccepted = acceptedMatches.length > 0;

  // Gunakan volume listing sebagai basis kalkulasi
  const totalVolumeKg = Number(listing?.volume_kg || 0);
  const pricePerKg = Number(listing?.price_per_kg || 0);
  const emissionFactor = Number(listing?.emission_factor || 0);

  const economicValue = totalVolumeKg * pricePerKg;
  const co2SavedTon = (totalVolumeKg * emissionFactor) / 1000;
  const co2SavedKg = co2SavedTon * 1000;
  const pohonEquivalent = Math.round(co2SavedTon / 0.022);

  return (
    <section className="relative px-12 py-12 overflow-hidden">
      {/* Organic blob background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-moss/[0.06] pointer-events-none" />

      {/* Wobbly line */}
      <div className="absolute left-10 top-[10%] bottom-[10%] w-[1px]">
        <svg width="10" height="100%" viewBox="0 0 10 500" preserveAspectRatio="none">
          <path d="M5,0 Q8,125 2,250 T5,500" fill="none" stroke="var(--moss)" strokeOpacity="0.2" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-10">
        {/* Economic value — big number */}
        <div className="w-full text-center">
          <div className="inline-block relative">
            <span className="absolute -top-4 -left-12 text-[28px] font-light text-moss">Rp</span>
            <div className="grotesque-num text-[120px] md:text-[160px] text-soil">
              {economicValue.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2">
            <div className="h-[1px] bg-moss w-full mb-2" />
            <div className="flex justify-between items-baseline px-2">
              <span className="label-caps">
                {hasAccepted ? 'NILAI EKONOMI SIRKULAR' : 'POTENSI NILAI EKONOMI'}
              </span>
              <span className="text-[13px] text-stone italic">
                {hasAccepted
                  ? 'Dampak nyata dari transaksi yang disepakati'
                  : 'Estimasi sebelum receiver menerima match'}
              </span>
            </div>
          </div>
        </div>

        {/* CO₂ and Pohon */}
        <div className="grid grid-cols-2 gap-16 md:gap-32">
          <div className="text-right flex flex-col items-end">
            <div className="flex items-baseline justify-end gap-3">
              <div className="grotesque-num text-[60px] md:text-[100px] text-soil">
                {co2SavedKg.toFixed(1)}
              </div>
              <span className="text-[24px] md:text-[32px] font-light text-moss">kg</span>
            </div>
            <div className="w-full mt-2">
              <div className="h-[1px] bg-moss w-full mb-2" />
              <div className="flex flex-col items-end">
                <span className="label-caps">{hasAccepted ? 'CO₂ DICEGAH DARI TPA' : 'POTENSI CO₂ DICEGAH'}</span>
                <span className="text-[13px] text-stone italic">Setara berkendara {Math.round(co2SavedKg * 4.07)}km tanpa emisi</span>
              </div>
            </div>
          </div>

          <div className="text-left flex flex-col items-start">
            <div className="flex flex-col">
              <div className="grotesque-num text-[60px] md:text-[100px] text-moss">
                {pohonEquivalent.toLocaleString('id-ID')}
              </div>
              <span className="text-[20px] md:text-[28px] font-light text-soil -mt-4">pohon</span>
            </div>
            <div className="w-full mt-2">
              <div className="h-[1px] bg-moss w-full mb-2" />
              <div className="flex flex-col items-start">
                <span className="label-caps">{hasAccepted ? 'KESETARAAN REBOISASI' : 'POTENSI REBOISASI'}</span>
                <span className="text-[13px] text-stone italic">Nilai oksigen terjaga melalui penggunaan kembali</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="text-center mt-6 relative">
          <p className="text-[15px] text-stone italic">
            "Setiap kilogram yang Anda salurkan adalah napas baru bagi bumi kita."
          </p>
          <div className="flex justify-center mt-2">
            <svg width="400" height="12" viewBox="0 0 400 12" fill="none">
              <path d="M2 10C50 2 350 12 398 4" stroke="var(--moss)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

const matchStatusLabel = {
  pending: { text: 'Menunggu', color: 'text-stone' },
  accepted: { text: 'Diterima', color: 'text-moss font-semibold' },
  rejected: { text: 'Ditolak', color: 'text-terracotta' },
};

function MatchCard({ match, index, revealedContacts, onContactReveal, onMatchUpdate }) {
  const [loadingContact, setLoadingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const scorePct = Math.round(Number(match.score) * 100);
  const isTop = index === 0;
  const isAccepted = match.status === 'accepted';
  const isRejected = match.status === 'rejected';
  const barColor = isAccepted ? 'bg-moss' : isRejected ? 'bg-stone/30' : isTop ? 'bg-terracotta' : index < 3 ? 'bg-moss' : 'bg-stone';
  const receiverId = match.receiver_user_id || match.user_id;
  const contact = revealedContacts[receiverId];

  const handleViewContact = async () => {
    if (contact) return;
    setLoadingContact(true);
    setContactError('');
    try {
      const res = await api.post('/api/contact/log', {
        target_user_id: receiverId,
        listing_id: match.listing_id,
        request_id: match.request_id,
      });
      onContactReveal(receiverId, res.data.data?.contact);
    } catch (err) {
      setContactError(err.response?.data?.message || 'Gagal memuat kontak, coba lagi.');
    } finally {
      setLoadingContact(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setLoadingStatus(true);
    setStatusError('');
    try {
      await api.patch(`/api/matches/${match.id}/status`, { status: newStatus });
      onMatchUpdate(match.id, newStatus);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Gagal mengubah status, coba lagi.');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Format phone for wa.me link (strip leading 0, add 62)
  const waLink = contact?.phone
    ? `https://wa.me/${contact.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className={`w-full bg-surface-white rounded-lg border flex overflow-hidden relative transition-all ${isAccepted ? 'border-moss/60 shadow-sm' : isRejected ? 'border-outline opacity-60' : 'border-outline'}`}>
      <div className={`w-1 shrink-0 ${barColor} rounded-r-sm`} />

      <div className="flex-1 flex flex-col">
        <div className="flex px-6 py-4 items-center">
          {/* Company info — 40% */}
          <div className="w-[40%] flex flex-col justify-center">
            {isAccepted && (
              <span className="text-[9px] font-bold text-moss tracking-[0.1em] uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span> MATCH DITERIMA
              </span>
            )}
            {isTop && !isAccepted && !isRejected && (
              <span className="text-[9px] font-bold text-terracotta tracking-[0.1em] uppercase mb-1">
                REKOMENDASI TERBAIK
              </span>
            )}
            {!isTop && !isAccepted && <div className="h-[13px] mb-1" />}
            <Link to={`/receivers/${receiverId}`} className="text-[17px] font-bold text-soil leading-tight hover:text-forest transition-colors">
              {match.company_name}
            </Link>
            <p className="text-[12px] text-stone mt-0.5 font-medium">
              {match.city} · {match.category_name || 'Material'}
            </p>
            <p className="text-[12px] text-stone italic mt-1.5 truncate max-w-[90%]">
              {match.request_title}
            </p>
          </div>

          {/* Tags — 25% */}
          <div className="w-[25%] flex flex-col justify-center px-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-[10px] text-stone border border-outline rounded-badge px-1.5 py-0.5">
                {Number(match.distance_km).toFixed(1)} km
              </span>
              <span className="text-[10px] text-stone border border-outline rounded-badge px-1.5 py-0.5">
                {Number(match.quantity_kg).toLocaleString('id-ID')} kg
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-moss font-semibold">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Mitra Terverifikasi
            </div>
          </div>

          {/* Score — 20% */}
          <div className="w-[20%] flex flex-col items-center justify-center">
            <div className="text-center">
              <span className="text-[40px] font-extrabold text-moss leading-none tracking-tight">{scorePct}%</span>
              <p className="text-[9px] font-bold text-stone tracking-[0.1em] uppercase mt-1">MATCH SCORE</p>
            </div>
            <div className="w-20 h-[1px] bg-outline my-2" />
            <button
              onClick={handleViewContact}
              disabled={loadingContact || !!contact}
              className="text-[11px] font-semibold text-moss hover:brightness-75 transition-all disabled:opacity-50"
            >
              {loadingContact ? '...' : contact ? 'KONTAK TERBUKA ↓' : 'LIHAT KONTAK →'}
            </button>
            {contactError && (
              <p className="text-[10px] text-terracotta mt-1">{contactError}</p>
            )}
          </div>

          {/* Sender actions — 15% (sender hanya bisa pre-reject, receiver yang terima) */}
          <div className="w-[15%] flex flex-col items-center justify-center gap-2 pl-3 border-l border-outline/40">
            {isAccepted ? (
              <>
                <span className="material-symbols-outlined text-[28px] text-moss">handshake</span>
                <span className="text-[10px] font-bold text-moss text-center leading-tight">RECEIVER MENERIMA</span>
                <span className="text-[9px] text-stone text-center italic leading-tight">Tunggu konfirmasi selesai dari kedua pihak</span>
              </>
            ) : isRejected ? (
              <>
                <span className="material-symbols-outlined text-[28px] text-stone/40">cancel</span>
                <span className="text-[10px] text-stone text-center">Disaring</span>
                <button
                  onClick={() => handleUpdateStatus('pending')}
                  disabled={loadingStatus}
                  className="text-[10px] text-moss hover:brightness-75 transition-colors font-semibold"
                >
                  Pulihkan
                </button>
              </>
            ) : (
              <>
                <span className="text-[9px] text-stone text-center italic leading-tight mb-1">Receiver belum merespon</span>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={loadingStatus}
                  className="w-full text-[11px] font-semibold text-stone hover:text-terracotta border border-outline hover:border-terracotta/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingStatus ? '...' : 'Saring'}
                </button>
              </>
            )}
            {statusError && (
              <p className="text-[9px] text-terracotta text-center mt-0.5">{statusError}</p>
            )}
          </div>
        </div>

        {/* Inline contact info */}
        {contact && (
          <div className="px-6 pb-4 pt-0 border-t border-outline/40 mx-6 flex items-center gap-6">
            <div className="flex items-center gap-4 flex-1 text-[12px]">
              <span className="text-stone">Email:</span>
              <span className="font-semibold text-soil">{contact.email}</span>
              <span className="text-stone">WA:</span>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-soil hover:text-moss">
                {contact.phone}
              </a>
            </div>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-white bg-moss hover:bg-forest px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">chat</span>
                Hubungi via WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchMap({ listing, matches }) {
  if (!listing) return null;

  const senderPos = [Number(listing.latitude), Number(listing.longitude)];
  const receiverPositions = matches
    .filter(m => m.latitude && m.longitude)
    .map(m => ({
      id: m.id,
      pos: [Number(m.latitude), Number(m.longitude)],
      name: m.company_name,
    }));

  return (
    <div className="relative h-[480px] rounded-2xl overflow-hidden border border-outline-strong shadow-ambient">
      <MapContainer
        center={senderPos}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Sender marker */}
        <Marker position={senderPos} icon={senderIcon} />

        {/* Receiver markers + dashed lines */}
        {receiverPositions.map(r => (
          <Marker key={r.id} position={r.pos} icon={receiverIcon} />
        ))}
        {receiverPositions.map(r => (
          <Polyline
            key={`line-${r.id}`}
            positions={[senderPos, r.pos]}
            pathOptions={{ color: '#1C3520', weight: 1.5, dashArray: '6 4', opacity: 0.4 }}
          />
        ))}
      </MapContainer>

      {/* Overlay label */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/80 backdrop-blur-sm rounded-md px-3 py-1.5 border border-outline">
        <div className="flex items-center gap-2">
          <div className="w-[10px] h-[10px] bg-deep-forest rounded-full border-2 border-white shadow-sm" />
          <span className="text-[9px] font-bold uppercase tracking-tight text-deep-forest">LOKASI ANDA</span>
        </div>
      </div>
    </div>
  );
}

function ListingDetail({ listing }) {
  if (!listing) return null;

  const details = [
    { label: 'Material Utama', value: listing.category_name || listing.custom_category || '-' },
    { label: 'Jumlah', value: `${Number(listing.volume_kg).toLocaleString('id-ID')} kg` },
    { label: 'Lokasi', value: listing.city || '-' },
    { label: 'Status', value: listing.status === 'active' ? 'Aktif' : listing.status === 'matched' ? 'Deal Berjalan' : listing.status === 'completed' ? 'Selesai' : 'Expired' },
  ];

  return (
    <div className="px-2 mt-8">
      <span className="label-caps block mb-6">DETAIL LISTING</span>
      <table className="w-full text-[15px]">
        <tbody className="divide-y divide-outline/40">
          {details.map(d => (
            <tr key={d.label}>
              <td className="py-3 text-stone">{d.label}</td>
              <td className="py-3 text-right font-semibold text-soil">{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MatchResultsPage() {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealedContacts, setRevealedContacts] = useState({});

  const handleContactReveal = (receiverId, contact) => {
    setRevealedContacts(prev => ({ ...prev, [receiverId]: contact }));
  };

  // Update status match secara lokal (optimistic) + refresh listing status
  const handleMatchUpdate = async (matchId, newStatus) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
    // Refresh listing supaya status 'matched'/'active' terbaru langsung keliatan
    try {
      const res = await api.get(`/api/listings/${id}`);
      setListing(res.data.data?.listing);
    } catch { /* non-fatal */ }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchRes, listingRes] = await Promise.all([
          api.get(`/api/listings/${id}/matches`),
          api.get(`/api/listings/${id}`),
        ]);
        setMatches(matchRes.data.data?.matches || []);
        setListing(listingRes.data.data?.listing);
      } catch {
        setError('Gagal memuat data matching.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  // FIX 5: Custom listing — no auto-matching available
  if (listing?.is_custom) {
    return (
      <div className="-m-6">
        <div className="px-12 py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-amber-500 mb-4 block">info</span>
          <h2 className="text-headline-md text-soil mb-3">Listing Limbah Khusus</h2>
          <p className="text-[14px] text-stone max-w-md mx-auto mb-6">
            Listing ini tidak memiliki auto-matching. Receiver dapat menghubungi Anda langsung dari halaman browse.
          </p>
          <Link to={`/listings/${id}`} className="btn-primary inline-block">
            Kembali ke Listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6">
      {error && (
        <div className="px-12 pt-6">
          <ErrorMessage message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* Impact Hero Section */}
      {listing && <ImpactHero listing={listing} matches={matches} />}

      {/* Wave divider + Match results */}
      <div className="bg-cream border-t border-outline-strong px-12 py-10 relative">
        <div className="absolute -top-10 left-0 w-full overflow-hidden pointer-events-none">
          <svg width="100%" height="40" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="none">
            <path d="M0 40C200 10 500 0 720 20C940 40 1240 10 1440 40V40H0V40Z" fill="var(--cream)" />
            <path d="M0 40C200 10 500 0 720 20C940 40 1240 10 1440 40" stroke="var(--moss)" strokeOpacity="0.15" strokeWidth="2" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto flex gap-12">
          <div className="w-[58%]">
            <div className="flex justify-between items-center mb-6">
              <span className="label-caps">
                {matches.length} MITRA PENERIMA DITEMUKAN
              </span>
              {listing && (
                <Link
                  to={`/listings/${id}/edit`}
                  className="text-[13px] font-semibold text-stone hover:text-soil flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit Listing
                </Link>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-[48px] text-stone/30 mb-4 block">search_off</span>
                <h3 className="text-headline-sm text-soil mb-2">Belum ada receiver yang cocok</h3>
                <p className="text-[13px] text-stone max-w-sm mx-auto">
                  Jalankan proses matching dari halaman detail listing, atau tunggu receiver baru mendaftar.
                </p>
                <Link to={`/listings/${id}`} className="btn-primary mt-6 inline-block">
                  Kembali ke Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    index={index}
                    revealedContacts={revealedContacts}
                    onContactReveal={handleContactReveal}
                    onMatchUpdate={handleMatchUpdate}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-[42%] flex flex-col gap-10">
            <MatchMap listing={listing} matches={matches} />
            <ListingDetail listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
