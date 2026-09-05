import React, { useState, useEffect, useMemo, memo } from 'react';

/**
 * Tailwind classes mapping user collaboration presence state to badge ring colors.
 *
 * User ki online/away/offline presence status ke mutabiq color classes.
 */
const PRESENCE_COLOR = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-ink-400',
};

/**
 * Computes up to 2 uppercase initials from a user's display name using Array.from to correctly
 * handle multi-byte UTF-16 surrogate pairs and Unicode grapheme clusters.
 *
 * Kisi user ke display name se zyada se zyada 2 baray huroof (uppercase initials) nikalta hai.
 * Unicode/Emoji surrogate pairs ko baghair tor-phor ke sahi handle karta hai.
 *
 * @param {string|null|undefined} name - The user's full or partial display name.
 * @returns {string} The computed 1-2 letter uppercase initials, or '?' if unavailable.
 */
function initialsFor(name) {
  if (!name || typeof name !== 'string') {
    return '?';
  }
  const cleanName = name.trim();
  if (!cleanName) {
    return '?';
  }
  const parts = cleanName.split(/\s+/);
  const firstChars = Array.from(parts[0] || '');
  const first = firstChars[0] ?? '';
  const lastChars = parts.length > 1 ? Array.from(parts[parts.length - 1] || '') : [];
  const last = lastChars[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

const PALETTE = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2', '#4F46E5', '#0D9488'];

/**
 * Calculates a deterministic background color from a string seed.
 * Ensures the same user consistently receives the same fallback background color across the entire application.
 *
 * @param {string|null|undefined} name - String seed used for hash generation.
 * @returns {string} Hex color string selected from curated accessible palette.
 */
function colorFor(name) {
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : '?';
  let hash = 0;
  for (let i = 0; i < safeName.length; i += 1) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * User avatar component that renders an image with fallback to deterministic initials and presence status indicator.
 *
 * @param {{
 *   name?: string,
 *   imageUrl?: string|null,
 *   presence?: 'online' | 'away' | 'offline',
 *   size?: number,
 *   className?: string
 * }} props - Avatar configuration props.
 * @returns {JSX.Element}
 */
export const Avatar = memo(function Avatar({
  name = '',
  imageUrl,
  presence,
  size = 36,
  className = '',
}) {
  const displayName = name || 'User';
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const initials = useMemo(() => initialsFor(name), [name]);
  const bgColor = useMemo(() => colorFor(name), [name]);

  const showImage = Boolean(imageUrl && !imageError);

  return (
    <span
      className={`relative inline-flex shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={displayName}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white tracking-wider"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </span>
      )}
      {presence && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            PRESENCE_COLOR[presence] || PRESENCE_COLOR.offline
          }`}
          style={{ width: Math.max(size * 0.28, 8), height: Math.max(size * 0.28, 8) }}
          aria-label={presence}
        />
      )}
    </span>
  );
});

