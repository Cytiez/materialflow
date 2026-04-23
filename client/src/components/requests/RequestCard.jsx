import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

const statusMap = {
  active: { text: 'Aktif', variant: 'success' },
  fulfilled: { text: 'Terpenuhi', variant: 'info' },
  expired: { text: 'Expired', variant: 'warning' },
};

export default function RequestCard({ request, showStatus = false }) {
  const status = statusMap[request.status] || statusMap.active;

  return (
    <Link
      to={`/requests/${request.id}`}
      className="card hover:bg-surface-low transition-colors group block"
    >
      {/* Icon header */}
      <div className="h-20 -mx-6 -mt-6 mb-4 rounded-t-lg bg-cream flex items-center justify-center">
        <svg className="w-8 h-8 text-moss/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {request.category_name && (
          <Badge text={request.category_name} variant="neutral" />
        )}
        {showStatus && <Badge text={status.text} variant={status.variant} />}
        {request.deleted_at && <Badge text="Dihapus" variant="danger" />}
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-bold text-soil leading-snug mb-2 line-clamp-2 group-hover:text-forest transition-colors">
        {request.title}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[12px] text-stone">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          {Number(request.quantity_kg).toLocaleString('id-ID')} kg
        </span>
        {request.company_name && (
          <span className="flex items-center gap-1 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">{request.company_name}</span>
          </span>
        )}
      </div>

      {request.city && (
        <p className="text-[11px] text-stone/60 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {request.city}
        </p>
      )}
    </Link>
  );
}
