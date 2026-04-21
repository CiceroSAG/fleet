import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTires, logTireAction, getEquipment } from '../lib/api';
import { Circle, Settings, History, Plus, X, Truck, AlertCircle, Ruler, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function TireInventory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: tires, isLoading } = useQuery({ queryKey: ['tires'], queryFn: () => getTires() });
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  
  const [selectedTire, setSelectedTire] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    action_type: 'inspection',
    tread_depth: '',
    pressure: '',
    notes: ''
  });

  const logMutation = useMutation({
    mutationFn: logTireAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tires'] });
      setShowLogModal(false);
      setLogForm({ action_type: 'inspection', tread_depth: '', pressure: '', notes: '' });
    }
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTire) return;
    logMutation.mutate({
      tire_id: selectedTire.id,
      ...logForm,
      tread_depth: parseFloat(logForm.tread_depth),
      pressure: parseFloat(logForm.pressure)
    });
  };

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl">
               <Circle className="w-6 h-6 text-white stroke-[4]" />
            </div>
            Tire Tracking System
          </h1>
          <p className="text-gray-500 font-medium">Lifecycle management for heavy-duty tires</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 italic">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Position</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Serial / Brand</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Vehicle</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Tread Depth</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Pressure</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-sans">
                {tires?.map((tire: any) => (
                  <tr 
                    key={tire.id} 
                    className="hover:bg-gray-50/50 cursor-pointer transition-all"
                    onClick={() => setSelectedTire(tire)}
                  >
                    <td className="px-6 py-4">
                      <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-lg text-xs font-black">
                        {tire.position || 'Spare'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900">{tire.serial_number}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{tire.brand} {tire.model}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{tire.equipment?.asset_tag || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tire.tread_depth < 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(tire.tread_depth / 80) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-black">{tire.tread_depth}mm</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-black italic">
                      {tire.pressure} PSI
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        tire.status === 'good' ? 'bg-green-100 text-green-700' :
                        tire.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tire.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           {selectedTire ? (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Settings className="w-24 h-24 rotate-12" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-1 leading-tight">{selectedTire.serial_number}</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">{selectedTire.brand} Details</p>
                  
                  <div className="space-y-6">
                     <div className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between border border-zinc-700/50">
                        <div className="flex items-center space-x-3">
                           <Ruler className="w-4 h-4 text-zinc-400" />
                           <span className="text-xs font-bold">Tread Depth</span>
                        </div>
                        <span className="text-lg font-black">{selectedTire.tread_depth}mm</span>
                     </div>
                     <div className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between border border-zinc-700/50">
                        <div className="flex items-center space-x-3">
                           <Gauge className="w-4 h-4 text-zinc-400" />
                           <span className="text-xs font-bold">Pressure</span>
                        </div>
                        <span className="text-lg font-black">{selectedTire.pressure} PSI</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowLogModal(true)}
                    className="w-full mt-8 bg-white text-zinc-900 font-black py-4 rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                  >
                    <History className="w-5 h-5" />
                    Log Measurement
                  </button>
                </div>
             </motion.div>
           ) : (
             <div className="bg-gray-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center italic text-gray-400 min-h-[300px]">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold">Select a tire to view history and manage lifecycle</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm px-safe">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative"
            >
               <button onClick={() => setShowLogModal(false)} className="absolute top-6 right-6 text-gray-400">
                 <X className="w-6 h-6" />
               </button>
               <h3 className="text-2xl font-black mb-6">Log Tire Activity</h3>
               <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Action Type</label>
                    <select 
                      value={logForm.action_type}
                      onChange={e => setLogForm({...logForm, action_type: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                    >
                      <option value="inspection">Inspection</option>
                      <option value="rotation">Rotation</option>
                      <option value="repair">Repair</option>
                      <option value="replacement">Replacement</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tread Depth (mm)</label>
                      <input 
                        type="number" step="0.1" required
                        value={logForm.tread_depth}
                        onChange={e => setLogForm({...logForm, tread_depth: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                        placeholder="80.0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pressure (PSI)</label>
                      <input 
                        type="number" step="1" required
                        value={logForm.pressure}
                        onChange={e => setLogForm({...logForm, pressure: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                        placeholder="110"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Notes</label>
                    <textarea 
                      value={logForm.notes}
                      onChange={e => setLogForm({...logForm, notes: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold h-24"
                      placeholder="Observed minor chipping on outer lugs..."
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={logMutation.isPending}
                    className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all mt-4"
                  >
                    {logMutation.isPending ? 'Logging...' : 'Save Measurement'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
