const PRESENCE_COLOR = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-ink-400',
};
function initialsFor(name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}
// Deterministic background color per name, so the same person always gets
// the same fallback color across the app instead of a random one.
function colorFor(name) {
    const palette = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'];
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}
export function Avatar({ name, imageUrl, presence, size = 36 }) {
    return (<span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {imageUrl ? (<img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" style={{ width: size, height: size }}/>) : (<span className="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: colorFor(name) }}>
          {initialsFor(name)}
        </span>)}
      {presence && (<span className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white ${PRESENCE_COLOR[presence]}`} style={{ width: size * 0.28, height: size * 0.28 }} aria-label={presence}/>)}
    </span>);
}
