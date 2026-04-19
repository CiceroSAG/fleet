import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = 'Scan Asset QR Code' }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    const startScanner = () => {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          if (scanner) {
            scanner.clear().catch(console.error);
          }
          onScan(decodedText);
        },
        (err) => {
          // Only log errors that are not just "no code found"
          if (err && !err.includes('No MultiFormat Readers were able to decode')) {
            console.warn('QR Code Scan Error:', err);
            if (err.includes('NotAllowedError') || err.includes('Permission denied')) {
              setError('Camera permission denied. Please enable camera access in your browser settings and refresh the page.');
            }
          }
        }
      );
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.warn('Failed to clear scanner', e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div id="qr-reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200" />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Center the QR code in the square to scan.
            </p>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
