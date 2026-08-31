import { useEffect, useRef, useState } from 'react';
export function RowMenu({ children }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        function handleClick(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);
    return (<div className="relative" ref={ref}>
      <button type="button" aria-label="More actions" onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-ink-400 hover:bg-canvas hover:text-ink-700">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (<div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-border bg-surface py-1 shadow-popover">
          {children(() => setOpen(false))}
        </div>)}
    </div>);
}
export function RowMenuItem({ children, onClick, danger, }) {
    return (<button type="button" onClick={onClick} className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-canvas ${danger ? 'text-red-600' : 'text-ink-700'}`}>
      {children}
    </button>);
}
