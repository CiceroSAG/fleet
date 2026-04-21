import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineReport {
  id: string;
  data: any;
  status: 'pending' | 'syncing' | 'failed';
  timestamp: string;
}

interface OfflineState {
  queue: OfflineReport[];
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  addToQueue: (report: any) => void;
  removeFromQueue: (id: string) => void;
  updateStatus: (id: string, status: OfflineReport['status']) => void;
}

export const useOffline = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setOnline: (online) => set({ isOnline: online }),
      addToQueue: (report) => set((state) => ({
        queue: [...state.queue, {
          id: Math.random().toString(36).substring(7),
          data: report,
          status: 'pending',
          timestamp: new Date().toISOString()
        }]
      })),
      removeFromQueue: (id) => set((state) => ({
        queue: state.queue.filter((r) => r.id !== id)
      })),
      updateStatus: (id, status) => set((state) => ({
        queue: state.queue.map((r) => r.id === id ? { ...r, status } : r)
      })),
    }),
    {
      name: 'fsr-offline-queue',
    }
  )
);
