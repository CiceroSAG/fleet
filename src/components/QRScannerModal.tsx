import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, History, CheckSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getEquipmentByTag } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface QRScannerModalProps {
  onClose: () => void;
}

export default function QRScannerModal({ onClose }: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    async function onScanSuccess(decodedText: string) {
      // Clear the scanner immediately to stop processing
      scanner.clear().catch(err => console.error("Scanner clear error", err));
      
      setScanResult(decodedText);
      setLoading(true);
      setError(null);
      
      try {
        const data = await getEquipmentByTag(decodedText);
        if (data) {
          setEquipment(data);
        } else {
          setError(`Asset Tag "${decodedText}" not found in system.`);
        }
      } catch (err) {
        console.error("Error fetching equipment by tag", err);
        setError('An error occurred while identifying the asset.');
      } finally {
        setLoading(false);
      }
    }

    function onScanFailure(error: any) {
      // Common to have many failures as it searches for a QR code
      // consoles suppressed
    }

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(err => console.error("Final scanner clear error", err));
    };
  }, []);

  const handleViewHistory = () => {
    if (equipment) {
      navigate(`/equipment/${equipment.id}`);
      onClose();
    }
  };

  const handleStartInspection = () => {
    if (equipment) {
      // Navigate to equipment details with inspection intent
      navigate(`/equipment/${equipment.id}?action=inspection`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-black tracking-tight">Machine Pulse Scanner</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {!scanResult ? (
            <div className="space-y-6">
              <div 
                id="qr-reader" 
                className="overflow-hidden rounded-3xl border-2 border-dashed border-gray-200"
                style={{ minHeight: '300px' }}
              ></div>
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg">Scan Asset QR Tag</p>
                <p className="text-gray-400 text-sm font-medium mt-1">Center the tag in the frame above for instant access</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse transition-all"></span>
                  <p className="text-[10px] text-orange-600 uppercase tracking-widest font-black">Live Optics Ready</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                  <p className="font-black text-gray-900 text-xl tracking-tight">Syncing Asset Record...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Identification Error</h3>
                    <p className="text-gray-500 font-medium px-6">{error}</p>
                  </div>
                  <button 
                    onClick={() => {
                        setScanResult(null);
                        setEquipment(null);
                        setError(null);
                        // Trigger a re-render/re-mount of the scanner? 
                        // Actually easier to just reload the modal or handle it via scanResult state.
                    }}
                    className="mt-4 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                  >
                    Rescan Tag
                  </button>
                </div>
              ) : equipment ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Asset Detected</p>
                          <h3 className="text-3xl font-black">{equipment.manufacturer} {equipment.model}</h3>
                          <p className="text-orange-500 font-black tracking-tight">{equipment.asset_tag}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                          equipment.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {equipment.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Current Task</p>
                          <p className="text-xs font-black">Mining Operations</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Next Service</p>
                          <p className="text-xs font-black text-orange-400">In 50.4 Hours</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={handleStartInspection}
                      className="flex items-center justify-between p-7 bg-orange-600 text-white rounded-3xl shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <CheckSquare className="w-7 h-7" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-xl leading-none mb-1">Pre-start Inspection</p>
                          <p className="text-sm font-medium opacity-80 underline decoration-white/30 underline-offset-4">Safety Checklist Required</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={handleViewHistory}
                      className="flex items-center justify-between p-7 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-zinc-200 transition-all active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:rotate-[-6deg] transition-transform">
                          <History className="w-7 h-7 text-zinc-900" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-xl text-zinc-900 leading-none mb-1">Service History</p>
                          <p className="text-sm font-medium text-zinc-400">Detailed Maintenance Logs</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
