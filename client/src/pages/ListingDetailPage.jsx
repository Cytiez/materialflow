import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSender } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contact, setContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  // For the "Tandai Selesai" flow — need the accepted match ID
  const [acceptedMatch, setAcceptedMatch] = useState(null);

  const isOwner = listing && user && listing.user_id === user.id;

  useEffect(() => {
    api.get(`/api/listings/${id}`)
      .then(r => setListing(r.data.data?.listing))
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Fetch accepted match when listing is in 'matched' state
  useEffect(() => {
    if (listing?.status === 'matched' && isOwner) {
      api.get(`/api/listings/${id}/matches`)
        .then(r => {
          const matches = r.data.data?.matches || [];
          const accepted = matches.find(m => m.status === 'accepted');
          setAcceptedMatch(accepted || null);
        })
        .catch(() => {});
    }
  }, [listing?.status, isOwner, id]);

  const handleViewContact = async () => {
    setContactLoading(true);
    setContactError('');
    try {
      const res = await api.post('/api/contact/log', { target_user_id: Number(listing.user_id) });
      setContact(res.data.data?.contact);
    } catch (err) {
      setContactError(err.response?.data?.message || 'Gagal memuat kontak, coba lagi.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleMatch = async () => {
    setMatching(true);
    setError('');
    try {
      const res = await api.post(`/api/listings/${id}/match`);
      const matches = res.data.data?.matches || [];
      if (matches.length > 0) {
        navigate(`/listings/${id}/matches`);
      } else {
        setSuccess('Tidak ditemukan kecocokan saat ini. Coba lagi nanti.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menjalankan matching.');
    } finally {
      setMatching(false);
    }
  };

  const handleComplete = async () => {
    if (!acceptedMatch) {
      setError('Tidak ada deal aktif untuk dikonfirmasi.');
      return;
    }
    if (!confirm('Konfirmasi bahwa Anda sudah menyelesaikan transaksi ini? Receiver juga perlu mengkonfirmasi dari pihak mereka.')) return;

    setCompleting(true);
    setError('');
    try {
      const res = await api.patch(`/api/matches/${acceptedMatch.id}/done`);
      const { sender_done, receiver_done, completed } = res.data.data || {};
      setAcceptedMatch(prev => ({ ...prev, sender_done: true, receiver_done }));
      if (completed) {
        setListing(prev => ({ ...prev, status: 'completed' }));
        setSuccess('Transaksi selesai! Kedua pihak telah mengkonfirmasi.');
      } else {
        setSuccess('Konfirmasi Anda tersimpan. Menunggu konfirmasi dari receiver.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengkonfirmasi, coba lagi.');
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus listing ini?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/listings/${id}`);
      navigate('/listings/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus listing.');
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!listing) return null;

  const photoUrl = listing.photo_url
    ? `${import.meta.env.VITE_API_URL}/uploads/${listing.photo_url}`
    : null;

  const senderDone = acceptedMatch?.sender_done;
  const receiverDone = acceptedMatch?.receiver_done;

  return (
    <div className="max-w-3xl space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <ErrorMessage message={success} type="success" onClose={() => setSuccess('')} autoDismiss />}

      {/* Photo */}
      {photoUrl && (
        <div className="h-64 rounded-lg overflow-hidden bg-cream">
          <img src={photoUrl} alt={listing.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header card */}
      <div className="card-white">
        <div className="flex flex-wrap gap-2 mb-3">
          {listing.is_custom ? (
            <Badge text="LIMBAH KHUSUS" variant="custom" />
          ) : listing.category_name ? (
            <Badge text={listing.category_name} variant="neutral" />
          ) : null}
          <Badge
            text={
              listing.status === 'active' ? 'Aktif'
              : listing.status === 'matched' ? 'Deal Berjalan'
              : listing.status === 'completed' ? 'Selesai'
              : 'Expired'
            }
            variant={
              listing.status === 'active' ? 'success'
              : listing.status === 'matched' ? 'info'
              : listing.status === 'completed' ? 'neutral'
              : 'warning'
            }
          />
        </div>

        <h1 className="text-headline-md text-forest mb-2">{listing.title}</h1>

        {listing.description && (
          <p className="text-body text-stone mb-4 whitespace-pre-line">{listing.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-outline">
          <div>
            <p className="label-caps mb-1">Volume</p>
            <p className="text-[16px] font-bold text-soil">
              {Number(listing.volume_kg).toLocaleString('id-ID')} kg
            </p>
          </div>
          {listing.category_name && !listing.is_custom && (
            <div>
              <p className="label-caps mb-1">Estimasi Nilai</p>
              <p className="text-[16px] font-bold text-soil">
                Rp {(Number(listing.volume_kg) * Number(listing.price_per_kg || 0)).toLocaleString('id-ID')}
              </p>
            </div>
          )}
          <div>
            <p className="label-caps mb-1">Lokasi</p>
            <p className="text-[14px] text-soil">{listing.city || '-'}</p>
          </div>
        </div>

        {/* Company info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline">
          <div className="w-10 h-10 rounded-full bg-cream border border-outline flex items-center justify-center">
            <span className="text-[13px] font-bold text-stone">
              {listing.company_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-soil">{listing.company_name}</p>
            <p className="text-[11px] text-stone">{listing.city}</p>
          </div>
        </div>
      </div>

      {/* Kontak pengirim untuk non-owner (receiver/viewer) */}
      {!isOwner && !listing.is_custom && (
        <div className="card-white">
          {contact ? (
            <div>
              <p className="label-caps mb-3">Informasi Kontak Pengirim</p>
              <div className="space-y-2 text-[14px]">
                <p><span className="text-stone">Perusahaan:</span> <span className="font-semibold text-soil">{contact.company_name}</span></p>
                <p><span className="text-stone">Email:</span> <span className="font-semibold text-soil">{contact.email}</span></p>
                <p>
                  <span className="text-stone">Telepon:</span>{' '}
                  <a
                    href={`https://wa.me/62${contact.phone?.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-moss underline"
                  >
                    {contact.phone}
                  </a>
                </p>
                <p><span className="text-stone">Alamat:</span> <span className="font-semibold text-soil">{contact.address}</span></p>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleViewContact}
                disabled={contactLoading}
                className="btn-primary flex items-center gap-2"
              >
                {contactLoading ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                    Lihat Kontak Pengirim
                  </>
                )}
              </button>
              {contactError && (
                <p className="text-[12px] text-terracotta mt-2">{contactError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Deal progress — ditampilkan saat matched atau completed */}
      {isOwner && acceptedMatch && listing.status !== 'completed' && (
        <div className="card-white border border-moss/30 bg-moss/5">
          <p className="label-caps mb-3 text-moss">STATUS KONFIRMASI SELESAI</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${senderDone ? 'text-moss' : 'text-stone/40'}`}>
                {senderDone ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={`text-[13px] font-semibold ${senderDone ? 'text-moss' : 'text-stone'}`}>
                Pengirim {senderDone ? '(Sudah konfirmasi)' : '(Belum)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${receiverDone ? 'text-moss' : 'text-stone/40'}`}>
                {receiverDone ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className={`text-[13px] font-semibold ${receiverDone ? 'text-moss' : 'text-stone'}`}>
                Penerima {receiverDone ? '(Sudah konfirmasi)' : '(Belum)'}
              </span>
            </div>
          </div>
          {!senderDone && (
            <p className="text-[12px] text-stone mt-2 italic">
              Klik "Tandai Selesai" setelah Anda selesai menyerahkan material ke receiver.
            </p>
          )}
        </div>
      )}

      {/* Actions for owner (sender) */}
      <div className="flex flex-wrap gap-3">
        {isOwner && isSender && (
          <>
            {/* Lihat / Cari kecocokan */}
            {!listing.is_custom && listing.status === 'matched' && (
              <Link to={`/listings/${id}/matches`} className="btn-cta flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Lihat Kecocokan
              </Link>
            )}

            {!listing.is_custom && listing.status === 'active' && (
              <button
                onClick={handleMatch}
                disabled={matching}
                className="btn-cta flex items-center gap-2"
              >
                {matching ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Cari Kecocokan
                  </>
                )}
              </button>
            )}

            {/* Tandai Selesai — muncul saat status matched dan sender belum done */}
            {listing.status === 'matched' && acceptedMatch && !senderDone && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-secondary flex items-center gap-2"
              >
                {completing ? <LoadingSpinner size="sm" text="" /> : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Tandai Selesai
                  </>
                )}
              </button>
            )}

            {/* Cari lagi (force re-match) */}
            {!listing.is_custom && listing.status === 'matched' && (
              <button
                onClick={async () => {
                  setMatching(true);
                  setError('');
                  try {
                    await api.post(`/api/listings/${id}/match?force=true`);
                    navigate(`/listings/${id}/matches`);
                  } catch (err) {
                    setError(err.response?.data?.message || 'Gagal menjalankan matching.');
                  } finally {
                    setMatching(false);
                  }
                }}
                disabled={matching}
                className="btn-secondary flex items-center gap-2"
              >
                {matching ? <LoadingSpinner size="sm" text="" /> : 'Cari Kecocokan Baru'}
              </button>
            )}

            {listing.status !== 'completed' && (
              <Link to={`/listings/${id}/edit`} className="btn-secondary">
                Edit
              </Link>
            )}

            {listing.status !== 'completed' && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-secondary !text-terracotta !border-terracotta/20 hover:!bg-terracotta/5"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
