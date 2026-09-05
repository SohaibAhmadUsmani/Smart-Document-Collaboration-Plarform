import { createContext, useCallback, useContext, useState } from 'react';

/**
 * React Context for toast notification dispatching.
 *
 * Toast notifications dispatch karne ke liye React Context.
 */
const ToastContext = createContext(null);

/**
 * Provider component that manages the global toast notification queue and renders active toasts.
 *
 * Yeh provider component global toast notifications ko manage karta hai aur active toasts screen par display karta hai.
 *
 * @param {{ children: React.ReactNode }} props - React child components wrapped by this provider. / Is provider ke andar aane wale child components.
 * @returns {JSX.Element} The ToastContext Provider wrapping children and toast container.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    /**
     * Displays a toast notification with an auto-dismissing timeout of 3000ms.
     * Generates a collision-resistant unique identifier using timestamp and pseudo-random alphanumeric string.
     *
     * Yeh function aik naya toast message display karta hai jo 3000ms baad khud ba khud ghayab ho jata hai.
     * Key collision se bachne ke liye timestamp aur random alphanumeric string se unique ID generate karta hai.
     *
     * @param {string} message - Text notification message to display. / Screen par dikhane wala text message.
     * @param {'success' | 'error'} [tone='success'] - Visual styling tone of the toast. / Toast ka visual rang aur andaz ('success' ya 'error').
     */
    const showToast = useCallback((message, tone = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((current) => [...current, { id, message, tone }]);
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-popover ${
                            toast.tone === 'success' ? 'bg-ink-900 text-white' : 'bg-red-600 text-white'
                        }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * Custom React hook to trigger toast notifications from any child component within ToastProvider.
 *
 * Kisi bhi child component se toast notification trigger karne ke liye yeh custom hook istemal karein.
 * Yeh hook sirf ToastProvider ke andar call kiya ja sakta hai.
 *
 * @throws {Error} Throws an error if invoked outside of a ToastProvider subtree.
 * @returns {{ showToast: (message: string, tone?: 'success' | 'error') => void }} Object exposing the showToast method.
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
