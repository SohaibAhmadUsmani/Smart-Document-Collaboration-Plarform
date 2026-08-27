import { useEffect } from 'react';
const WIDTH_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};
export function Modal({ open, onClose, title, description, children, footer, width = 'md' }) {
    useEffect(() => {
        if (!open)
            return;
        const handleKey = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-ink-900/40" onClick={onClose}/>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`relative w-full ${WIDTH_CLASSES[width]} rounded-xl border border-border bg-surface shadow-popover`}>
        <div className="border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-ink-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>);
}
