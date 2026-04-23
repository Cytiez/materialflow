import { Link } from 'react-router-dom';

export default function EmptyState({ icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-xl bg-cream flex items-center justify-center text-stone/40 mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-headline-sm text-forest mb-2">{title}</h3>
      {description && (
        <p className="text-body-sm text-stone max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
