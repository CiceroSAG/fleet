import React, { useEffect } from 'react';
import { useOffline } from '../lib/offline';
import { createFieldServiceReport } from '../lib/api';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SyncManager() {
  const { queue, isOnline, setOnline, removeFromQueue, updateStatus } = useOffline();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && queue.some(r => r.status === 'pending')) {
      const syncQueue = async () => {
        for (const item of queue) {
          if (item.status !== 'pending') continue;
          
          updateStatus(item.id, 'syncing');
          try {
            await createFieldServiceReport(
              item.data.report, 
              item.data.assets, 
              item.data.parts, 
              item.data.scheduleId, 
              item.data.technician_ids
            );
            removeFromQueue(item.id);
          } catch (e) {
            console.error('Failed to sync report:', e);
            updateStatus(item.id, 'failed');
          }
        }
      };
      
      syncQueue();
    }
  }, [isOnline, queue]);

  if (queue.length === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-24 right-8 z-40">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm mb-4"
          >
             <WifiOff className="w-5 h-5 animate-pulse" />
             Offline Mode Active
          </motion.div>
        )}
        
        {queue.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-zinc-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-zinc-800"
          >
             <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                   {isOnline ? (
                     <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                   ) : (
                     <Clock className="w-5 h-5 text-zinc-500" />
                   )}
                   <div>
                      <p className="text-xs font-black">{queue.length} Reports Pending</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {isOnline ? 'Syncing now...' : 'Waiting for connection'}
                      </p>
                   </div>
                </div>
                {isOnline && (
                  <div className="bg-zinc-800 p-2 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
