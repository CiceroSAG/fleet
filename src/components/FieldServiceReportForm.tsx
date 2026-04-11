import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, getTechnicians, createFieldServiceReport, updateFieldServiceReport, getTechnicianByUserId } from '../lib/api';
import { Plus, Trash2, Save, X, Building2, Wrench, Package, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';

interface FieldServiceReportFormProps {
  onClose: () => void;
  initialData?: {
    id?: string;
    scheduleId?: string;
    workplace?: string;
    job_type?: string;
    job_description?: string;
    action_taken?: string;
    technician_name?: string;
    supervisor_name?: string;
    supervisor_date?: string;
    manager_name?: string;
    manager_date?: string;
    kamoa_hod_name?: string;
    kamoa_hod_date?: string;
    technician_id?: string;
    report_date?: string;
    assets?: { equipment_id: string; index_value: number; next_service_date: string }[];
    parts?: { part_description: string; quantity_used: number; remark: string }[];
  };
}

export default function FieldServiceReportForm({ onClose, initialData }: FieldServiceReportFormProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: getTechnicians });

  const { data: technicianRecord } = useQuery({
    queryKey: ['technicianRecord', profile?.id],
    queryFn: () => profile?.id ? getTechnicianByUserId(profile.id) : null,
    enabled: profile?.role === 'Technician',
  });

  const [report, setReport] = useState({
    workplace: initialData?.workplace || '',
    job_type: initialData?.job_type || 'PM',
    job_description: initialData?.job_description || '',
    action_taken: initialData?.action_taken || '',
    technician_name: initialData?.technician_name || '',
    supervisor_name: initialData?.supervisor_name || '',
    supervisor_date: initialData?.supervisor_date || new Date().toISOString().split('T')[0],
    manager_name: initialData?.manager_name || '',
    manager_date: initialData?.manager_date || new Date().toISOString().split('T')[0],
    kamoa_hod_name: initialData?.kamoa_hod_name || '',
    kamoa_hod_date: initialData?.kamoa_hod_date || new Date().toISOString().split('T')[0],
    technician_id: initialData?.technician_id || profile?.id || '',
    report_date: initialData?.report_date || new Date().toISOString().split('T')[0],
  });

  // Update technician name when record is loaded
  React.useEffect(() => {
    if (technicianRecord?.name) {
      setReport(prev => ({ ...prev, technician_name: technicianRecord.name }));
    }
  }, [technicianRecord]);

  const [assets, setAssets] = useState(initialData?.assets || [{ equipment_id: '', index_value: 0, next_service_date: '' }]);
  const [parts, setParts] = useState(initialData?.parts || [{ part_description: '', quantity_used: 0, remark: '' }]);

  const mutation = useMutation({
    mutationFn: (data: { report: any; assets: any[]; parts: any[] }) => 
      initialData?.id 
        ? updateFieldServiceReport(initialData.id, data.report, data.assets, data.parts)
        : createFieldServiceReport(data.report, data.assets, data.parts, initialData?.scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldServiceReports'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['repairLogs'] });
      queryClient.invalidateQueries({ queryKey: ['assignedTasks'] });
      onClose();
    },
  });

  const handleAddAsset = () => {
    if (assets.length < 8) {
      setAssets([...assets, { equipment_id: '', index_value: 0, next_service_date: '' }]);
    }
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const handleAssetChange = (index: number, field: string, value: any) => {
    const newAssets = [...assets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setAssets(newAssets);
  };

  const handleAddPart = () => {
    setParts([...parts, { part_description: '', quantity_used: 0, remark: '' }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      report,
      assets: assets.filter(a => a.equipment_id),
      parts: parts.filter(p => p.part_description)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{initialData?.id ? 'Edit' : 'New'} Field Service Report</h2>
            <p className="text-sm text-gray-500">FANED MINING SERVICES SARL</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
          {mutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center space-x-2">
              <X className="w-5 h-5 flex-shrink-0" />
              <span>{mutation.error instanceof Error ? mutation.error.message : 'An error occurred while saving the report.'}</span>
            </div>
          )}
          {/* Section 1: Report Info */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
              <Building2 className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">General Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Workplace / Lieu de travail</label>
                <input
                  type="text"
                  required
                  value={report.workplace}
                  onChange={e => setReport({ ...report, workplace: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="e.g. Kamoa Mine Site"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Type</label>
                <select
                  value={report.job_type}
                  onChange={e => setReport({ ...report, job_type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="BD">Breakdown (BD)</option>
                  <option value="PM">Preventive Maintenance (PM)</option>
                  <option value="RP">Repair (RP)</option>
                  <option value="SAF">Safety (SAF)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={report.report_date}
                  onChange={e => setReport({ ...report, report_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Assets */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-orange-100 pb-2">
              <div className="flex items-center space-x-2 text-orange-600">
                <Wrench className="w-5 h-5" />
                <h3 className="font-semibold uppercase tracking-wider text-sm">Equipment Details</h3>
              </div>
              <button
                type="button"
                onClick={handleAddAsset}
                disabled={assets.length >= 8}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Machine</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {assets.map((asset, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group"
                  >
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Asset ID</label>
                        <select
                          required
                          value={asset.equipment_id}
                          onChange={e => handleAssetChange(index, 'equipment_id', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                          <option value="">Select Asset</option>
                          {equipment?.map(e => (
                            <option key={e.id} value={e.id}>{e.asset_tag}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Model / S.N.</label>
                        <div className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-md text-gray-500 truncate h-[34px] flex items-center">
                          {asset.equipment_id ? (
                            (() => {
                              const eq = equipment?.find(e => e.id === asset.equipment_id);
                              return eq ? `${eq.model} / ${eq.serial_number || 'N/A'}` : '---';
                            })()
                          ) : '---'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Index (Hours/KM)</label>
                      <input
                        type="number"
                        value={asset.index_value}
                        onChange={e => handleAssetChange(index, 'index_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Next Service Due</label>
                      <input
                        type="date"
                        value={asset.next_service_date}
                        onChange={e => handleAssetChange(index, 'next_service_date', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      {assets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAsset(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Section 3: Job Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
                <h3 className="font-semibold uppercase tracking-wider text-sm">Description of Job Required</h3>
              </div>
              <textarea
                required
                value={report.job_description}
                onChange={e => setReport({ ...report, job_description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Detail the work requested..."
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
                <h3 className="font-semibold uppercase tracking-wider text-sm">Action Taken / Work Done</h3>
              </div>
              <textarea
                required
                value={report.action_taken}
                onChange={e => setReport({ ...report, action_taken: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Detail the actions performed..."
              />
            </div>
          </section>

          {/* Section 4: Parts Used */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-orange-100 pb-2">
              <div className="flex items-center space-x-2 text-orange-600">
                <Package className="w-5 h-5" />
                <h3 className="font-semibold uppercase tracking-wider text-sm">Spare Parts Used</h3>
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Part</span>
              </button>
            </div>
            <div className="space-y-3">
              {parts.map((part, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Part Description"
                      value={part.part_description}
                      onChange={e => handlePartChange(index, 'part_description', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={part.quantity_used}
                      onChange={e => handlePartChange(index, 'quantity_used', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Remark"
                      value={part.remark}
                      onChange={e => handlePartChange(index, 'remark', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Signatures */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
              <UserCheck className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Approvals & Signatures</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Technician</label>
                <select
                  value={report.technician_name}
                  onChange={e => setReport({ ...report, technician_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Select Technician</option>
                  {technicians?.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={report.report_date}
                  onChange={e => setReport({ ...report, report_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Supervisor</label>
                <input
                  type="text"
                  value={report.supervisor_name}
                  onChange={e => setReport({ ...report, supervisor_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.supervisor_date}
                  onChange={e => setReport({ ...report, supervisor_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Manager</label>
                <input
                  type="text"
                  value={report.manager_name}
                  onChange={e => setReport({ ...report, manager_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.manager_date}
                  onChange={e => setReport({ ...report, manager_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">KAMOA HOD</label>
                <input
                  type="text"
                  value={report.kamoa_hod_name}
                  onChange={e => setReport({ ...report, kamoa_hod_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.kamoa_hod_date}
                  onChange={e => setReport({ ...report, kamoa_hod_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </section>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-8 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
