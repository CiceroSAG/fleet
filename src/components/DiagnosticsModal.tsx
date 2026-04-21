import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Activity, Cpu, Database, Network, Globe, X, Server, Zap, RefreshCw } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const [isScanning, setIsScanning] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const systems = [
    { name: 'Core Engine (Vite)', status: 'Optimal', latency: '12ms', health: 99, icon: Zap },
    { name: 'Database (Supabase)', status: 'Connected', latency: '45ms', health: 100, icon: Database },
    { name: 'Fleet Telematics API', status: 'Online', latency: '82ms', health: 94, icon: Network },
    { name: 'AI Forecasting Engine', status: 'Active', latency: '1.2s', health: 88, icon: Cpu },
    { name: 'Edge CDN (Cloud Run)', status: 'Global', latency: '31ms', health: 100, icon: Globe },
    { name: 'Real-time Socket', status: 'Listening', latency: '5ms', health: 100, icon: Server },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden font-mono"
          >
            {/* Header */}
            <div className="bg-white/5 border-b border-white/10 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                   <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                   <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">System Diagnostics</h2>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Terminal ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {isScanning ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                   <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
                   <div className="space-y-2 text-center">
                     <p className="text-white text-xs font-black tracking-[0.3em] uppercase animate-pulse">Running Integrity Check...</p>
                     <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Analyzing fleet handshake protocols & latency</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Global Health Progress */}
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fleet Integrity Score</p>
                        <p className="text-4xl font-black text-white italic">97.4<span className="text-orange-500 ml-1">%</span></p>
                     </div>
                     <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                        <Activity className="w-8 h-8 text-orange-500" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systems.map((sys, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-3">
                           <div className="p-2 bg-white/5 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                              <sys.icon className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
                           </div>
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                             sys.status === 'Optimal' || sys.status === 'Connected' || sys.status === 'Online' || sys.status === 'Active' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'
                           }`}>
                             {sys.status}
                           </span>
                        </div>
                        <p className="text-xs font-bold text-white mb-0.5">{sys.name}</p>
                        <div className="flex items-center justify-between text-[10px]">
                           <span className="text-gray-500">Latency: {sys.latency}</span>
                           <span className="text-white/60 font-black">{sys.health}%</span>
                        </div>
                        <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500" style={{ width: `${sys.health}%` }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                    <p className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse" /> All Systems Nominal</p>
                    <p className="font-bold">LAST SCAN: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-center">
               <button 
                onClick={() => setIsScanning(true)}
                className="text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-colors"
               >
                 Re-initialize Integrity Check
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
