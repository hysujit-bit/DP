// InstallBanner — shows a branded "Install App" prompt the first time
// a user visits in the browser (not already installed as PWA).
// Dismissed state is remembered in localStorage.

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallBanner() {
  const [prompt, setPrompt]   = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or running as installed PWA
    if (localStorage.getItem('pwa-install-dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return; // iOS installed

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0">
          <img src="/icons/icon-192.png" alt="DP Work" className="w-8 h-8 rounded-lg" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">Install DP Work App</p>
          <p className="text-xs text-slate-500 mt-0.5">Add to home screen for quick access</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:bg-sky-700 transition-colors"
          >
            <Download size={13} />
            Install
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
