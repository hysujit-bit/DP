// UpdateBanner — detects when a new service worker is waiting and
// shows a "New update available" toast. Tapping it refreshes to the new version.

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateBanner() {
  const [waiting, setWaiting] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // Already a new SW waiting
      if (reg.waiting) {
        setWaiting(reg.waiting);
        setVisible(true);
        return;
      }

      // Listen for a new SW to start waiting
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(newSW);
            setVisible(true);
          }
        });
      });
    };

    checkForUpdate();

    // Re-check when tab becomes visible again (user switched back)
    const onVisible = () => { if (!document.hidden) checkForUpdate(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const update = () => {
    if (!waiting) return;
    waiting.postMessage('SKIP_WAITING');
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down">
      <div className="bg-slate-900 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
          <RefreshCw size={16} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Update available</p>
          <p className="text-xs text-slate-400 mt-0.5">Tap to get the latest version</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={update}
            className="bg-sky-500 text-white text-xs font-semibold px-3 py-2 rounded-xl active:bg-sky-600 transition-colors"
          >
            Update
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
