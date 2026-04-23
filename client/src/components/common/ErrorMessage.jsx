import { useState, useEffect } from 'react';

export default function ErrorMessage({ message, type = 'error', onClose, autoDismiss = false }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  if (!visible || !message) return null;

  const styles = {
    error: {
      bg: 'bg-terracotta/5',
      border: 'border-terracotta/20',
      text: 'text-terracotta',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-moss/5',
      border: 'border-moss/20',
      text: 'text-moss',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-[#92400e]/5',
      border: 'border-[#92400e]/20',
      text: 'text-[#92400e]',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  };

  const s = styles[type] || styles.error;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-md border ${s.bg} ${s.border} ${s.text}`}>
      {s.icon}
      <p className="text-body-sm flex-1">{message}</p>
      {onClose && (
        <button
          onClick={() => { setVisible(false); onClose(); }}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
