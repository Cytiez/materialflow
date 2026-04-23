import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ReceiverProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    api.get(`/api/receivers/${id}`)
      .then(r => setReceiver(r.data.data?.receiver))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleViewContact = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setContactLoading(true);
    try {
      const res = await api.post('/api/contact/log', { target_user_id: Number(id) });
      setContact(res.data.data?.contact);
    } catch {
      // silent
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!receiver) return null;

  const joinedDate = new Date(receiver.joined_date).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long',
  });

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile header */}
      <div className="card-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-moss flex items-center justify-center text-white text-[20px] font-bold">
            {receiver.company_name?.charAt(0) || 'R'}
          </div>
          <div>
            <h1 className="text-headline-md text-forest">{receiver.company_name}</h1>
            <p className="text-[12px] text-stone">{receiver.city} · Bergabung {joinedDate}</p>
          </div>
        </div>

        {receiver.address && (
          <p className="text-[13px] text-stone mt-2">
            <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">location_on</span>
            {receiver.address}
          </p>
        )}

        {/* Contact section */}
        <div className="mt-4 pt-4 border-t border-outline">
          {contact ? (
            <div className="space-y-2 text-[14px]">
              <p className="label-caps mb-2">Informasi Kontak</p>
              <p><span className="text-stone">Email:</span> <span className="font-semibold text-soil">{contact.email}</span></p>
              <p><span className="text-stone">Telepon:</span> <span className="font-semibold text-soil">{contact.phone}</span></p>
            </div>
          ) : (
            <button
              onClick={handleViewContact}
              disabled={contactLoading}
              className="btn-primary flex items-center gap-2"
            >
              {contactLoading ? <LoadingSpinner size="sm" text="" /> : (
                <>
                  <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                  Lihat Kontak
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowLoginPrompt(false)}>
          <div className="bg-surface-white rounded-xl p-8 max-w-sm text-center shadow-ambient" onClick={e => e.stopPropagation()}>
            <span className="material-symbols-outlined text-[48px] text-moss mb-3 block">lock</span>
            <h3 className="text-headline-sm text-soil mb-2">Login untuk melihat kontak</h3>
            <p className="text-[13px] text-stone mb-6">Anda perlu masuk untuk melihat informasi kontak receiver.</p>
            <Link to="/login" className="btn-primary inline-block">Masuk</Link>
          </div>
        </div>
      )}

      {/* Active requests */}
      <div>
        <p className="label-caps mb-4">Permintaan Material Aktif ({receiver.active_requests?.length || 0})</p>
        {receiver.active_requests?.length > 0 ? (
          <div className="space-y-3">
            {receiver.active_requests.map(req => (
              <div key={req.id} className="card-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <Badge text={req.category_name} variant="neutral" />
                      <Badge text="Aktif" variant="success" />
                    </div>
                    <h4 className="text-[14px] font-bold text-soil">{req.title}</h4>
                    {req.description && (
                      <p className="text-[12px] text-stone mt-1 line-clamp-2">{req.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[16px] font-bold text-forest">
                      {Number(req.quantity_kg).toLocaleString('id-ID')} kg
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-stone italic">Belum ada permintaan aktif.</p>
        )}
      </div>
    </div>
  );
}
