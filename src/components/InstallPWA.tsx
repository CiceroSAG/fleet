import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for the beforeinstallprompt event (Chrome/Android/Desktop)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If it's iOS and not standalone, we should show the modal after a short delay
    if (ios && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowInstallModal(true);
      }, 3000); // 3 seconds delay for iOS
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallModal(false);
    }
  };

  if (isStandalone || !showInstallModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowInstallModal(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8"
        >
          <button 
            onClick={() => setShowInstallModal(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-6 mt-4">
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center shadow-inner">
              <img src="/icon.svg" alt="App Icon" className="w-14 h-14" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Install Fanned Fleet</h2>
              <p className="text-gray-500 font-medium mt-2">
                Install our app on your device for a faster, offline-ready experience with full camera and NFC support.
              </p>
            </div>

            {isIOS ? (
              <div className="w-full bg-gray-50 rounded-2xl p-6 space-y-4 text-left border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">iOS Instructions</p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <Share className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">1. Tap the <span className="text-blue-500 font-black">Share</span> icon in the Safari menu.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <PlusSquare className="w-5 h-5 text-gray-700" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">2. Scroll down and tap <span className="font-black italic">"Add to Home Screen"</span>.</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center space-x-3 bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
              >
                <Download className="w-6 h-6" />
                <span>Install Now</span>
              </button>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
