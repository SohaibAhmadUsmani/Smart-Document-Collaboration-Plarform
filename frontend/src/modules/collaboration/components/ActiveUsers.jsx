import React from 'react';
import { Users } from 'lucide-react';

/**
 * Minimal active-users presence indicator.
 *
 * Shows who is currently collaborating on the open document. This is the basic
 * presence foundation for the milestone — a richer presence UI (avatars, lists,
 * cursors) is planned for the next milestone.
 *
 * @param {Object} props
 * @param {Array<{userId: string, name: string}>} props.users - Active users.
 * @param {number} props.count - Total connected users (including this client).
 * @param {boolean} props.connected - Whether the socket is connected.
 */
export function ActiveUsers({ users = [], count = 0, connected = false }) {
  const initials = (name) =>
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');

  const visible = users.slice(0, 4);

  return (
    <div
      className="flex items-center gap-2 text-xs text-slate-500"
      title={connected ? 'Collaborators connected' : 'Reconnecting…'}
    >
      {!connected ? (
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Reconnecting…
        </span>
      ) : (
        <>
          <div className="flex -space-x-2">
            {visible.map((user) => (
              <span
                key={user.userId || user.socketId || user.name}
                title={user.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-[10px] font-semibold text-emerald-700"
              >
                {initials(user.name)}
              </span>
            ))}
            {users.length === 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-400">
                <Users className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          {count > 1 && (
            <span className="font-medium text-emerald-600"> {count} online</span>
          )}
        </>
      )}
    </div>
  );
}

export default ActiveUsers;
