const TONE_CLASSES = {
    neutral: 'bg-ink-900/5 text-ink-700',
    blue: 'bg-accent-soft text-accent',
    purple: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-emerald-50 text-emerald-700',
};
export function Badge({ children, tone = 'neutral' }) {
    return (<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>);
}
