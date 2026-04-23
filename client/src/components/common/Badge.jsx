const variants = {
  success: 'bg-moss/10 text-moss',
  info: 'bg-forest/10 text-forest',
  matched: 'bg-green-50 border border-green-300 text-green-700',
  warning: 'bg-[#92400e]/10 text-[#92400e]',
  danger: 'bg-terracotta/10 text-terracotta',
  custom: 'bg-[#7c3aed]/10 text-[#7c3aed]',
  neutral: 'bg-surface-high text-stone',
};

export default function Badge({ text, variant = 'neutral' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-badge text-[11px] font-semibold tracking-wide ${variants[variant] || variants.neutral}`}>
      {text}
    </span>
  );
}
