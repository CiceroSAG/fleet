import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkshopBays, updateWorkshopBay, getEquipment, createWorkshopBay, deleteWorkshopBay } from '../lib/api';
import { Wrench, Clock, CheckCircle2, AlertCircle, LayoutGrid, Info, ArrowRight, User, Truck, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';

export default function WorkshopBays() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: bays, isLoading: baysLoading } = useQuery({ queryKey: ['workshopBays'], queryFn: getWorkshopBays });
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  
  const [selectedBay, setSelectedBay] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBay, setNewBay] = useState({ name: '', description: '', status: 'available' });
  const [error, setError] = useState<string | null>(null);

  const bayMutation = useMutation({
    mutationFn: ({ id, bay }: { id: string, bay: any }) => updateWorkshopBay(id, bay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshopBays'] });
      setSelectedBay(null);
    },
    onError: (err: any) => {
      console.error('Error updating bay:', err);
      alert(err.message || 'Error updating workshop bay');
    }
  });

  const createMutation = useMutation({
    mutationFn: createWorkshopBay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshopBays'] });
      setShowAddModal(false);
      setNewBay({ name: '', description: '', status: 'available' });
      setError(null);
    },
    onError: (err: any) => {
      console.error('Error creating bay:', err);
      setError(err.message || 'Error creating workshop bay. Ensure the database table exists.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkshopBay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshopBays'] });
      setSelectedBay(null);
    },
    onError: (err: any) => {
      console.error('Error deleting bay:', err);
      alert(err.message || 'Error deleting workshop bay. It may still have equipment assigned to it.');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const currentEquipment = equipment?.filter(e => e.workshop_bay_id !== null);

  return (
    <div className="space-y-8 p-6 lg:p-10 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('workshop_bays')}</h1>
          <p className="text-gray-500 font-medium">{t('workshop')} Throughput & Layout</p>
        </div>
        <div className="flex space-x-2">
          {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>{t('add_bay') || 'Add Bay'}</span>
            </button>
          )}
          <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center space-x-1">
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
               <span className="text-xs font-bold text-gray-500 uppercase">{t('available')}</span>
             </div>
             <div className="flex items-center space-x-1">
               <div className="w-3 h-3 rounded-full bg-orange-500"></div>
               <span className="text-xs font-bold text-gray-500 uppercase">{t('occupied')}</span>
             </div>
             <div className="flex items-center space-x-1">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <span className="text-xs font-bold text-gray-500 uppercase">{t('maintenance_mode')}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {baysLoading ? (
              [1, 2, 3, 4].map(n => (
                <div key={n} className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse"></div>
              ))
            ) : (
              bays?.map((bay: any) => {
                const machineInBay = equipment?.find(e => e.workshop_bay_id === bay.id);
                return (
                  <motion.div
                    key={bay.id}
                    whileHover={{ y: -4 }}
                    className={`bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer shadow-sm ${selectedBay?.id === bay.id ? 'border-orange-500 shadow-orange-100 shadow-xl' : 'border-transparent hover:border-gray-200'}`}
                    onClick={() => setSelectedBay(bay)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <LayoutGrid className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(bay.status)}`}>
                        {t(bay.status)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 mb-1">{bay.name}</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">{bay.description}</p>
                    
                    {machineInBay ? (
                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <div className="p-2 bg-orange-50 rounded-lg">
                             <Truck className="w-4 h-4 text-orange-600" />
                           </div>
                           <div>
                             <p className="text-xs font-black text-gray-900">{machineInBay.asset_tag}</p>
                             <p className="text-[10px] text-gray-400">{machineInBay.manufacturer} {machineInBay.model}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-gray-400 font-bold uppercase">{t('date')}</p>
                           <p className="text-[10px] font-black">{new Date(machineInBay.workshop_entry_date || bay.updated_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-50 italic text-gray-300 text-xs">
                        {t('available')}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Wrench className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">{t('workshop')} {t('status')}</h3>
              <div className="space-y-6 mt-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-sm opacity-60 font-bold uppercase tracking-widest">Efficiency</span>
                  <span className="text-lg font-black">94.2%</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-sm opacity-60 font-bold uppercase tracking-widest">Avg Throughput</span>
                  <span className="text-lg font-black font-mono">2.4 Days</span>
                </div>
                <div className="flex justify-between items-center pb-4">
                  <span className="text-sm opacity-60 font-bold uppercase tracking-widest">Active Jobs</span>
                  <span className="text-lg font-black">{currentEquipment?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selectedBay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl"
              >
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black text-gray-900">Manage {selectedBay.name}</h4>
                    <div className="flex items-center space-x-2">
                       {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
                         <button 
                           onClick={() => {
                             if(confirm('Are you sure?')) deleteMutation.mutate(selectedBay.id);
                           }}
                           className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                       <button onClick={() => setSelectedBay(null)} className="p-2 text-gray-400 hover:text-gray-600">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">{t('status')}</label>
                      <div className="grid grid-cols-1 gap-2">
                         {['available', 'occupied', 'maintenance'].map(status => (
                           <button
                             key={status}
                             onClick={() => bayMutation.mutate({ id: selectedBay.id, bay: { status } })}
                             className={`w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${selectedBay.status === status ? getStatusColor(status) : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                           >
                             <div className="flex items-center justify-between">
                               {t(status)}
                               {selectedBay.status === status && <CheckCircle2 className="w-4 h-4" />}
                             </div>
                           </button>
                         ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">History</p>
                       <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-xs">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                             <p className="text-gray-500">Bay cleaned and sanitized</p>
                             <span className="text-[10px] text-gray-300 ml-auto">2h ago</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                             <p className="text-gray-500">TRK-001 Exit</p>
                             <span className="text-[10px] text-gray-300 ml-auto">5h ago</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-900">{t('add_bay') || 'Add New Bay'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bay Name</label>
                  <input
                    type="text"
                    value={newBay.name}
                    onChange={(e) => setNewBay({ ...newBay, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 font-bold"
                    placeholder="e.g. Bay 4 - Brake Specialist"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Description</label>
                  <textarea
                    value={newBay.description}
                    onChange={(e) => setNewBay({ ...newBay, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 font-bold h-24"
                    placeholder="Specialized equipment and tools available..."
                  />
                </div>
                
                <button
                  onClick={() => createMutation.mutate(newBay)}
                  disabled={!newBay.name || createMutation.isPending}
                  className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Workshop Bay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
