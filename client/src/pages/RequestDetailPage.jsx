import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isReceiver } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contact, setContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  // Accepted match — to allow receiver to confirm done
  const [acceptedMatch, setAcceptedMatch] = useState(null);

  const isOwner = request && user && request.user_id === user.id;

  useEffect(() => {
    api.get(`/api/requests/${id}`)
      .then(r => setRequest(r.data.data?.request))
      .catch(() => navigate('/requests'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Fetch accepted match once we know user is owner
  useEffect(() => {
    if (!request || !isOwner) return;
    api.get(`/api/requests/${id}/matches`)
      .then(r => {
        const matches = r.data.data?.matches || [];
        const accepted = matches.find(m => m.status === 'accepted');
        setAcceptedMatch(accepted || null);
      })
      .catch(() => {});
  }, [request, isOwner, id]);

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus permintaan ini?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/requests/${id}`);
      navigate('/requests/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus permintaan.');
      setDeleting(false);
    }
  };

  const handleViewContact = async () => {
    setContactLoading(true);
    setContactError('');
    try {
      const res = await api.post('/api/contact/log', {
        target_user_id: Number(request.user_id),
        request_id: Number(id),
      });
      setContact(res.data.data?.contact);
    } catch (err) {
      setContactError(err.response?.data?.message || 'Gagal memuat kontak, coba lagi.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleConfirmDone = async () => {
    if (!acceptedMatch) {
      setError('Tidak ada deal aktif untuk dikonfirmasi.');
      return;
    }
    if (!confirm('Konfirmasi bahwa Anda sudah menerima material dari pengirim?')) return;

    setCompleting(true);
    setError('');
    try {
      const res = await api.patch(`/api/matches/${acceptedMatch.id}/done`);
      const { receiver_done, completed } = res.data.data || {};
      setAcceptedMatch(prev => ({ ...prev, receiver_done: true }));
      if (completed) {
        setSuccess('Transaksi selesai! Kedua pihak telah mengkonfirmasi.');
      } else {
        setSuccess('Konfirmasi Anda tersimpan. Menunggu konfirmasi dari pengirim.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengkonfirmasi, coba lagi.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!request) return null;

  const statusMap = {
    active: { text: 'Aktif', variant: 'success' },
    fulfilled: { text: 'Terpenuhi', variant: 'info' },
    expired: { text: 'Expired', variant: 'warning' },
  };
  const status = statusMap[request.status] || statusMap.active;

  const senderDone = acceptedMatch?.sender_done;
  const receiverDone = acceptedMatch?.receiver_done;

  return (
    <div className="max-w-3xl space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      {success && <ErrorMessage message={success} type="success" onClose={() => setSuccess('')} autoDismiss />}

      {/* Header card */}
      <div className="card-white">
        <div className="flex flex-wrap gap-2 mb-3">
          {request.category_name && <Badge text={request.category_name} variant="neutral" />}
          <Badge text={status.text} variant={status.variant} />
          {request.deleted_at && <Badge text="Dihapus" variant="danger" />}
        </div>

        <h1 className="text-headline-md text-forest mb-2">{request.title}</h1>

        {request.description && (
          <p className="text-body text-stone mb-4 whitespace-pre-line">{request.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-outline">
          <div>
            <p className="label-caps mb-1">Jumlah Dibutuhkan</p>
            <p className="text-[16px] font-bold text-soil">
              {Number(request.quantity_kg).toLocaleString('id-ID')} kg
            </p>
          </div>
          {request.category_name && (
            <div>
              <p className="label-caps mb-1">Estimasi Nilai</p>
              <p className="text-[16px] font-bold text-soil">
                Rp {(Number(request.quantity_kg) * Number(request.price_per_kg || 0)).toLocaleString('id-ID')}
              </p>
            </div>
          )}
          <div>
            <p className="label-caps mb-1">Lokasi</p>
            <p className="text-[14px] text-soil">{request.city || '-'}</p>
          </div>
        </div>

        {/* Company info */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline">
          <div className="w-10 h-10 rounded-full bg-cream border border-outline flex items-center justify-center">
            <span className="text-[13px] font-bold text-stone">
              {request.company_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-soil">{request.company_name}</p>
            <p className="text-[11px] text-stone">{request.city}</p>
          </div>
        </div>
      </div>

      {/* Contact reveal — for senders viewing receiver's request */}
      {!isOwner && (
        <div className="card-white">
          {contact ? (
            <div>
              <p className="label-caps mb-3">Informasi Kontak</p>
              <div className="space-y-2 text-[14px]">
                <p><span className="text-stone">Perusahaan:</span> <span className="font-semibold text-soil">{contact.company_name}</span></p>
                <p><span className="text-stone">Email:</span> <span className="font-semibold text-soil">{contact.email}</span></p>
                <p><span className="text-stone">Telepon:</span> <span className="font-semibold text-soil">{contact.phone}</span></p>
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
                    Lihat Kontak Penerima
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

      {/* Deal progress card — owner sees this when there's an accepted match */}
      {isOwner && acceptedMatch && (
        <div className="card-white border border-moss/30 bg-moss/5">
          <p className="label-caps mb-1 text-moss">DEAL BERJALAN</p>
          <p className="text-[13px] text-stone mb-4">
            Pengirim: <span className="font-semibold text-soil">{acceptedMatch.company_name || '—'}</span>
            {acceptedMatch.city && <span> · {acceptedMatch.city}</span>}
          </p>

          {/* Done status */}
          <div className="flex gap-6 mb-4">
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

          {!receiverDone ? (
            <button
              onClick={handleConfirmDone}
              disabled={completing}
              className="btn-cta flex items-center gap-2"
            >
              {completing ? <LoadingSpinner size="sm" text="" /> : (
                <>
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  Konfirmasi Selesai
                </>
              )}
            </button>
          ) : (
            <p className="text-[13px] text-moss font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Konfirmasi Anda sudah diterima
            </p>
          )}

          <div className="mt-3">
            <Link
              to={`/listings/${acceptedMatch.listing_id}`}
              className="text-[12px] text-stone hover:text-moss transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Lihat Listing Pengirim
            </Link>
          </div>
        </div>
      )}

      {/* Owner actions */}
      {isOwner && isReceiver && (
        <div className="flex flex-wrap gap-3">
          <Link to={`/requests/${id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-secondary !text-terracotta !border-terracotta/20 hover:!bg-terracotta/5"
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      )}
    </div>
  );
}
