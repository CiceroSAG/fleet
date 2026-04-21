import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkshopBays, updateWorkshopBay, getEquipment, createWorkshopBay, deleteWorkshopBay } from '../lib/api';
import { Wrench, Clock, CheckCircle2, AlertCircle, LayoutGrid, Info, ArrowRight, User, Truck, Plus, X, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { updateEquipment } from '../lib/api';

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
  const [viewMode, setViewMode] = useState<'grid' | 'schematic'>('grid');

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const equipmentId = result.draggableId;
    const targetBayId = result.destination.droppableId;
    const sourceBayId = result.source.droppableId;
    
    if (targetBayId === sourceBayId) return;

    // Optimistic update
    queryClient.setQueryData(['equipment'], (old: any) => {
      return old?.map((e: any) => e.id === equipmentId ? { ...e, workshop_bay_id: targetBayId === 'unassigned' ? null : targetBayId } : e);
    });

    try {
      await updateEquipment(equipmentId, { 
        workshop_bay_id: targetBayId === 'unassigned' ? null : targetBayId,
        workshop_entry_date: targetBayId === 'unassigned' ? null : new Date().toISOString()
      });
      
      // Also update bay statuses
      const targetBay = bays?.find(b => b.id === targetBayId);
      if (targetBay && targetBayId !== 'unassigned') {
        await updateWorkshopBay(targetBayId, { status: 'occupied' });
      }
      
      const sourceBay = bays?.find(b => b.id === sourceBayId);
      if (sourceBay && sourceBayId !== 'unassigned') {
        // Only set to available if no other equipment is in it? 
        // For simplicity, we'll just invalidate
      }
      
      queryClient.invalidateQueries({ queryKey: ['workshopBays'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    } catch (e) {
      console.error('Failed to move equipment:', e);
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    }
  };

  const bayMutation = useMutation({
    mutationFn: ({ id, bay }: { id: string, bay: any }) => updateWorkshopBay(id, bay),
    onMutate: async ({ id, bay }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workshopBays'] });

      // Snapshot the previous value
      const previousBays = queryClient.getQueryData(['workshopBays']);

      // Optimistically update to the new value
      queryClient.setQueryData(['workshopBays'], (old: any) => {
        return old?.map((b: any) => b.id === id ? { ...b, ...bay } : b);
      });

      // Update the local selectedBay as well
      setSelectedBay((prevSelected: any) => {
        if (prevSelected?.id === id) {
          return { ...prevSelected, ...bay };
        }
        return prevSelected;
      });

      // Return a context object with the snapshotted value
      return { previousBays };
    },
    onError: (err: any, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBays) {
        queryClient.setQueryData(['workshopBays'], context.previousBays);
      }
      console.error('Error updating bay:', err);
      alert(err.message || 'Error updating workshop bay');
    },
    onSettled: () => {
      // Always refetch after error or success to keep server sync
      queryClient.invalidateQueries({ queryKey: ['workshopBays'] });
    },
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
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-8 p-6 lg:p-10 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('workshop_bays')}</h1>
          <p className="text-gray-500 font-medium">{t('workshop')} Throughput & Layout</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 mr-2 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            > Grid </button>
            <button 
              onClick={() => setViewMode('schematic')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'schematic' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            > Schematic </button>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'schematic' ? (
            <div className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-inner min-h-[500px] relative overflow-hidden">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
               <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-12">
                  {bays?.map((bay: any, index: number) => {
                    const machine = equipment?.find(e => e.workshop_bay_id === bay.id);
                    return (
                      <Droppable droppableId={bay.id} key={bay.id}>
                        {(provided, snapshot) => (
                          <motion.div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedBay(bay)}
                            className={`relative group cursor-pointer rounded-2xl transition-all ${snapshot.isDraggingOver ? 'ring-4 ring-orange-500 ring-inset ring-offset-4 ring-offset-white' : ''}`}
                          >
                            {/* Terminal Bracket Style */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-gray-200 group-hover:border-orange-500 transition-colors" />
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-gray-200 group-hover:border-orange-500 transition-colors" />
                            
                            <div className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all p-4 ${
                              bay.status === 'available' ? 'bg-green-50/30 border-green-100 text-green-600' :
                              bay.status === 'occupied' ? 'bg-orange-50/30 border-orange-100 text-orange-600' :
                              'bg-red-50/30 border-red-100 text-red-600'
                            }`}>
                               <span className="text-[10px] font-black absolute top-3 left-3 bg-white px-2 py-0.5 rounded border border-inherit shadow-sm">STA-{String(index + 1).padStart(2, '0')}</span>
                               
                               <Wrench className={`w-8 h-8 mb-2 ${bay.status === 'available' ? 'opacity-20' : 'animate-pulse'}`} />
                               <p className="text-xs font-black uppercase text-center tracking-tight leading-tight">{bay.name}</p>
                               
                               {machine ? (
                                 <Draggable draggableId={machine.id} index={0}>
                                   {(provided) => (
                                     <div 
                                       {...provided.draggableProps}
                                       {...provided.dragHandleProps}
                                       ref={provided.innerRef}
                                       className="mt-4 w-full bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-inherit flex items-center justify-center space-x-2 shadow-sm"
                                     >
                                       <Truck className="w-3 h-3" />
                                       <span className="text-[10px] font-black tracking-widest">{machine.asset_tag}</span>
                                     </div>
                                   )}
                                 </Draggable>
                               ) : (
                                 <div className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] opacity-30">Vacant</div>
                               )}
                               {provided.placeholder}
                            </div>
                          </motion.div>
                        )}
                      </Droppable>
                    );
                  })}
               </div>
               
               {/* Hangar Floor Markings */}
               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {baysLoading ? (
                [1, 2, 3, 4].map(n => (
                  <div key={n} className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse"></div>
                ))
              ) : (
                bays?.map((bay: any) => {
                  const machineInBay = equipment?.find(e => e.workshop_bay_id === bay.id);
                  return (
                    <Droppable droppableId={bay.id} key={bay.id}>
                      {(provided, snapshot) => (
                        <motion.div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          whileHover={{ y: -4 }}
                          className={`bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer shadow-sm ${selectedBay?.id === bay.id ? 'border-orange-500 shadow-orange-100 shadow-xl' : 'border-transparent hover:border-gray-200'} ${snapshot.isDraggingOver ? 'bg-orange-50 ring-2 ring-orange-500' : ''}`}
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
                            <Draggable draggableId={machineInBay.id} index={0}>
                              {(provided) => (
                                <div 
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  ref={provided.innerRef}
                                  className="pt-4 border-t border-gray-50 flex items-center justify-between"
                                >
                                   <div className="flex items-center space-x-3">
                                     <div className="p-2 bg-orange-50 rounded-lg">
                                       <Truck className="w-4 h-4 text-orange-600" />
                                     </div>
                                     <div>
                                       <p className="text-xs font-black text-gray-900">{machineInBay.asset_tag}</p>
                                       <p className="text-[10px] text-gray-400">{machineInBay.manufacturer} {machineInBay.model}</p>
                                     </div>
                                   </div>
                                   <GripVertical className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </Draggable>
                          ) : (
                            <div className="pt-4 border-t border-gray-50 italic text-gray-300 text-xs">
                              {t('available')}
                            </div>
                          )}
                          {provided.placeholder}
                        </motion.div>
                      )}
                    </Droppable>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Wrench className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">Hangar Status</h3>
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

          {/* New: Unassigned Equipment Queue */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Awaiting Bay</h3>
            <Droppable droppableId="unassigned">
               {(provided, snapshot) => (
                 <div 
                   {...provided.droppableProps}
                   ref={provided.innerRef}
                   className={`space-y-2 min-h-[100px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-orange-50 p-2 ring-2 ring-orange-200' : ''}`}
                 >
                    {equipment?.filter(e => !e.workshop_bay_id && e.status === 'down').map((e, index) => (
                      <Draggable key={e.id} draggableId={e.id} index={index}>
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-all shadow-sm"
                          >
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                 <Truck className="w-4 h-4 text-orange-600" />
                               </div>
                               <div>
                                 <p className="text-xs font-black text-gray-900">{e.asset_tag}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">{e.model}</p>
                               </div>
                             </div>
                             <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {equipment?.filter(e => !e.workshop_bay_id && e.status === 'down').length === 0 && (
                      <div className="h-full flex items-center justify-center py-8 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        Queue Empty
                      </div>
                    )}
                    {provided.placeholder}
                 </div>
               )}
            </Droppable>
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
    </DragDropContext>
  );
}
