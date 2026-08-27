import { createContext, useCallback, useContext, useState } from 'react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, tone = 'success') => {
        const id = Date.now();
        setToasts((current) => [...current, { id, message, tone }]);
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);
    return (<ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (<div key={toast.id} role="status" className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-popover ${toast.tone === 'success' ? 'bg-ink-900 text-white' : 'bg-red-600 text-white'}`}>
            {toast.message}
          </div>))}
      </div>
    </ToastContext.Provider>);
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
