import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed this session
      const isDismissed = sessionStorage.getItem('kforum_pwa_dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install user choice outcome: ${outcome}`);

    // We no longer need the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('kforum_pwa_dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[95] animate-scale-in">
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-sm truncate">Install K-Forum App</h4>
            <p className="text-xs text-gray-400 truncate">Add to home screen for fast access</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-[#17d059] hover:bg-[#15b84f] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
