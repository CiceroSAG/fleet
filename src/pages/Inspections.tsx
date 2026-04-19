import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInspections, getInspectionChecklists, createInspection, getEquipment } from '../lib/api';
import { ClipboardCheck, Plus, Search, Calendar, CheckCircle2, AlertCircle, ChevronRight, X, Clock, Truck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';

export default function Inspections() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: getInspections
  });

  const { data: checklists } = useQuery({
    queryKey: ['checklists'],
    queryFn: getInspectionChecklists
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment
  });

  const [formData, setFormData] = useState({
    equipment_id: '',
    checklist_id: '',
    results: {} as Record<string, string>,
    notes: '',
    repair_required: false
  });

  const createMutation = useMutation({
    mutationFn: createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setIsFormOpen(false);
      setFormData({
        equipment_id: '',
        checklist_id: '',
        results: {},
        notes: '',
        repair_required: false
      });
    }
  });

  const filteredInspections = inspections?.filter((ins: any) => 
    ins.equipment?.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ins.inspection_checklists?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChecklist = checklists?.find((c: any) => c.id === formData.checklist_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      operator_id: profile?.id
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-600" />
            Equipment Inspections (DVIR)
          </h1>
          <p className="text-gray-500">Manage pre-trip and post-trip safety checks</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Inspection</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pass Rate</p>
            <p className="text-xl font-bold text-gray-900">
              {inspections?.length ? Math.round((inspections.filter((i: any) => !i.repair_required).length / inspections.length) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-red-100 p-3 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Open Repairs</p>
            <p className="text-xl font-bold text-gray-900">
              {inspections?.filter((i: any) => i.repair_required).length || 0}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Inspected Today</p>
            <p className="text-xl font-bold text-gray-900">
              {inspections?.filter((i: any) => new Date(i.created_at).toDateString() === new Date().toDateString()).length || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by asset tag or checklist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-4 px-2">Asset</th>
                <th className="pb-4 px-2">Checklist</th>
                <th className="pb-4 px-2">Inspector</th>
                <th className="pb-4 px-2">Result</th>
                <th className="pb-4 px-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInspections?.map((ins: any) => (
                <tr key={ins.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Truck className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{ins.equipment?.asset_tag}</p>
                        <p className="text-xs text-gray-500">{ins.equipment?.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-sm text-gray-700">{ins.inspection_checklists?.name}</span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {ins.profiles?.full_name?.charAt(0) || ins.profiles?.email.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">{ins.profiles?.full_name || ins.profiles?.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      ins.repair_required 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {ins.repair_required ? 'Repair Needed' : 'Passed'}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(ins.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ins.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              ))}
              {(!filteredInspections || filteredInspections.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p>No inspections found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-6 h-6 text-orange-600" />
                  New Safety Inspection
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Equipment *
                    </label>
                    <select
                      required
                      value={formData.equipment_id}
                      onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shrink-0"
                    >
                      <option value="">Select Equipment</option>
                      {equipment?.map((e: any) => (
                        <option key={e.id} value={e.id}>
                          {e.asset_tag} - {e.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Checklist *
                    </label>
                    <select
                      required
                      value={formData.checklist_id}
                      onChange={(e) => setFormData({ ...formData, checklist_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shrink-0"
                    >
                      <option value="">Select Checklist</option>
                      {checklists?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedChecklist && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Inspection Items</h3>
                    <div className="space-y-3">
                      {selectedChecklist.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="font-medium text-gray-900">{item.label}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                results: { ...formData.results, [item.id]: 'pass' }
                              })}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                formData.results[item.id] === 'pass'
                                  ? 'bg-green-600 text-white shadow-sm'
                                  : 'bg-white text-gray-500 border border-gray-200'
                              }`}
                            >
                              PASS
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                results: { ...formData.results, [item.id]: 'fail' },
                                repair_required: true
                              })}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                formData.results[item.id] === 'fail'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'bg-white text-gray-500 border border-gray-200'
                              }`}
                            >
                              FAIL
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inspection Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Describe any issues found..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="flex items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <input
                    type="checkbox"
                    id="repair_required"
                    checked={formData.repair_required}
                    onChange={(e) => setFormData({ ...formData, repair_required: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="repair_required" className="ml-3 text-sm font-medium text-orange-900">
                    Flag for immediate repair / creation of repair task
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Submit Inspection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
