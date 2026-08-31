import { Avatar } from '../../../components/Avatar';
// TODO: replace with the real signed-in user once the Auth module exposes
const CURRENT_USER = { name: 'You', avatarUrl: null };
export function TopBar() {
    return (<header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
        <div className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="search" placeholder="Search documents, files, and activity…" className="w-full rounded-lg border border-border bg-canvas py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-accent focus:bg-surface focus:outline-none"/>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button type="button" aria-label="Notifications" className="relative rounded-full p-2 text-ink-500 hover:bg-canvas">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"/>
          </button>
          <button type="button" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-canvas">
            <Avatar name={CURRENT_USER.name} imageUrl={CURRENT_USER.avatarUrl} size={32}/>
            <span className="text-sm font-medium text-ink-900">{CURRENT_USER.name}</span>
            <ChevronDownIcon />
          </button>
        </div>
      </div>
    </header>);
}
 
function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}