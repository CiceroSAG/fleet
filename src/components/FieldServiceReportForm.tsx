import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, getTechnicians, createFieldServiceReport, updateFieldServiceReport, getTechnicianByUserId } from '../lib/api';
import { Plus, Trash2, Save, X, Building2, Wrench, Package, UserCheck, ShieldCheck, CheckCircle2, AlertTriangle, User, ChevronDown, Check } from 'lucide-react';
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
    technician_ids?: string[];
    report_date?: string;
    status?: string;
    parts_replaced?: string;
    parts_ordered?: string;
    maintenance_details?: any;
    repair_details?: any;
    safety_details?: any;
    assets?: { equipment_id: string; index_value: number; next_service_date: string }[];
    parts?: { part_description: string; quantity_used: number; remark: string }[];
  };
}

export default function FieldServiceReportForm({ onClose, initialData }: FieldServiceReportFormProps) {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: getTechnicians });

  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  
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
    status: initialData?.status || 'pending',
    parts_replaced: initialData?.parts_replaced || '',
    parts_ordered: initialData?.parts_ordered || '',
    maintenance_details: initialData?.maintenance_details || {
      inspection: false,
      oil_change: false,
      greasing: false,
      other: false,
    },
    repair_details: initialData?.repair_details || {
      mechanical: false,
      electrical: false,
      hydraulic: false,
      body_work: false,
      tires: false,
    },
    safety_details: initialData?.safety_details || {
      incident_type: 'none',
      severity: 'Minor',
    },
  });

  // Update technician name when record is loaded
  useEffect(() => {
    if (technicianRecord?.name) {
      setReport(prev => ({ ...prev, technician_name: technicianRecord.name }));
      if (!selectedTechnicians.includes(technicianRecord.id)) {
        setSelectedTechnicians(prev => [...prev, technicianRecord.id]);
      }
    }
  }, [technicianRecord]);

  useEffect(() => {
    if (initialData?.technician_ids) {
      setSelectedTechnicians(initialData.technician_ids);
    } else if (initialData?.technician_id) {
      setSelectedTechnicians([initialData.technician_id]);
    }
  }, [initialData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [assets, setAssets] = useState(initialData?.assets || [{ equipment_id: '', index_value: 0, next_service_date: '' }]);
  const [parts, setParts] = useState(initialData?.parts || [{ part_description: '', quantity_used: 0, remark: '' }]);
  const [customMaintField, setCustomMaintField] = useState('');
  const [customRepairField, setCustomRepairField] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { report: any; assets: any[]; parts: any[]; technician_ids: string[] }) => 
      initialData?.id 
        ? updateFieldServiceReport(initialData.id, data.report, data.assets, data.parts, data.technician_ids)
        : createFieldServiceReport(data.report, data.assets, data.parts, initialData?.scheduleId, data.technician_ids),
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

  const addCustomMaint = () => {
    if (customMaintField.trim()) {
      const key = customMaintField.trim().toLowerCase().replace(/\s+/g, '_');
      setReport({
        ...report,
        maintenance_details: { ...report.maintenance_details, [key]: true }
      });
      setCustomMaintField('');
    }
  };

  const addCustomRepair = () => {
    if (customRepairField.trim()) {
      const key = customRepairField.trim().toLowerCase().replace(/\s+/g, '_');
      setReport({
        ...report,
        repair_details: { ...report.repair_details, [key]: true }
      });
      setCustomRepairField('');
    }
  };

  const removeCustomMaint = (key: string) => {
    const newMaint = { ...report.maintenance_details };
    delete newMaint[key];
    setReport({ ...report, maintenance_details: newMaint });
  };

  const removeCustomRepair = (key: string) => {
    const newRepair = { ...report.repair_details };
    delete newRepair[key];
    setReport({ ...report, repair_details: newRepair });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      report,
      assets: assets.filter(a => a.equipment_id),
      parts: parts.filter(p => p.part_description),
      technician_ids: selectedTechnicians
    });
  };

  const toggleTechnician = (id: string) => {
    setSelectedTechnicians(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Workplace / Lieu de travail</label>
                <input
                  type="text"
                  required
                  value={report.workplace || ''}
                  onChange={e => setReport({ ...report, workplace: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="e.g. Kamoa Mine Site"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Type</label>
                <select
                  value={report.job_type || ''}
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={report.status || ''}
                  onChange={e => setReport({ ...report, status: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
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

          {/* New Sections: Multi-Module Checklists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Maintenance Section */}
            <section className="space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-2 text-blue-600 border-b border-blue-100 pb-2">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-semibold uppercase tracking-wider text-[10px]">Maintenance Checklist</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.keys(report.maintenance_details).map((type) => (
                  <div key={type} className="flex items-center justify-between group/item">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={report.maintenance_details[type] || false}
                        onChange={(e) => setReport({
                          ...report,
                          maintenance_details: { ...report.maintenance_details, [type]: e.target.checked }
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </label>
                    {!['inspection', 'oil_change', 'greasing', 'other'].includes(type) && (
                      <button
                        type="button"
                        onClick={() => removeCustomMaint(type)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-blue-50 mt-2">
                <input
                  type="text"
                  value={customMaintField}
                  onChange={(e) => setCustomMaintField(e.target.value)}
                  placeholder="Custom Item"
                  className="flex-1 px-2 py-1 text-xs border border-blue-100 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomMaint}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Repair Section */}
            <section className="space-y-4 bg-orange-50/30 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
                <Wrench className="w-5 h-5" />
                <h3 className="font-semibold uppercase tracking-wider text-[10px]">Repair types</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.keys(report.repair_details).map((type) => (
                  <div key={type} className="flex items-center justify-between group/item">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={report.repair_details[type] || false}
                        onChange={(e) => setReport({
                          ...report,
                          repair_details: { ...report.repair_details, [type]: e.target.checked }
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-700 capitalize group-hover:text-orange-600 transition-colors">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </label>
                    {!['mechanical', 'electrical', 'hydraulic', 'body_work', 'tires'].includes(type) && (
                      <button
                        type="button"
                        onClick={() => removeCustomRepair(type)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-orange-50 mt-2">
                <input
                  type="text"
                  value={customRepairField}
                  onChange={(e) => setCustomRepairField(e.target.value)}
                  placeholder="Custom Repair"
                  className="flex-1 px-2 py-1 text-xs border border-orange-100 rounded focus:ring-1 focus:ring-orange-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomRepair}
                  className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Safety/Incident Section */}
            <section className="space-y-4 bg-red-50/30 p-4 rounded-xl border border-red-100">
              <div className="flex items-center space-x-2 text-red-600 border-b border-red-100 pb-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-semibold uppercase tracking-wider text-[10px]">Safety / Incident</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Incident Type</label>
                  <select
                    value={report.safety_details?.incident_type || 'none'}
                    onChange={(e) => setReport({
                      ...report,
                      safety_details: { ...report.safety_details, incident_type: e.target.value }
                    })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="none">None</option>
                    <option value="collision">Collision</option>
                    <option value="breakdown">Breakdown</option>
                    <option value="theft">Theft</option>
                    <option value="personal_injury">Personal Injury</option>
                    <option value="environmental_spill">Environmental Spill</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Severity</label>
                  <select
                    value={report.safety_details?.severity || 'Minor'}
                    onChange={(e) => setReport({
                      ...report,
                      safety_details: { ...report.safety_details, severity: e.target.value }
                    })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

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
                          value={asset.equipment_id || ''}
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
                        value={asset.next_service_date || ''}
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
                value={report.job_description || ''}
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
                value={report.action_taken || ''}
                onChange={e => setReport({ ...report, action_taken: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Detail the actions performed..."
              />
            </div>
          </section>

          {/* Section 3.5: Parts Summary */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
                <h3 className="font-semibold uppercase tracking-wider text-sm">Parts Replaced (Summary)</h3>
              </div>
              <textarea
                value={report.parts_replaced || ''}
                onChange={e => setReport({ ...report, parts_replaced: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Summary of parts replaced..."
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 border-b border-orange-100 pb-2">
                <h3 className="font-semibold uppercase tracking-wider text-sm">Parts Ordered (Summary)</h3>
              </div>
              <textarea
                value={report.parts_ordered || ''}
                onChange={e => setReport({ ...report, parts_ordered: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                placeholder="Summary of parts ordered..."
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
                      value={part.part_description || ''}
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
                      value={part.remark || ''}
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
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Technicians</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate text-gray-700">
                        {selectedTechnicians.length > 0 
                          ? `${selectedTechnicians.length} Selected`
                          : 'Select Technicians'
                        }
                      </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isTechDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isTechDropdownOpen && (
                      <div className="absolute z-50 w-full mb-1 bottom-full bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-40 overflow-y-auto">
                        {technicians?.map((tech: any) => (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => toggleTechnician(tech.id)}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-orange-50 flex items-center justify-between group transition-colors"
                          >
                            <span className={`${selectedTechnicians.includes(tech.id) ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                              {tech.name}
                            </span>
                            {selectedTechnicians.includes(tech.id) && (
                              <Check className="w-4 h-4 text-orange-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  type="date"
                  value={report.report_date || ''}
                  onChange={e => setReport({ ...report, report_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Supervisor</label>
                <input
                  type="text"
                  value={report.supervisor_name || ''}
                  onChange={e => setReport({ ...report, supervisor_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.supervisor_date || ''}
                  onChange={e => setReport({ ...report, supervisor_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Manager</label>
                <input
                  type="text"
                  value={report.manager_name || ''}
                  onChange={e => setReport({ ...report, manager_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.manager_date || ''}
                  onChange={e => setReport({ ...report, manager_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">KAMOA HOD</label>
                <input
                  type="text"
                  value={report.kamoa_hod_name || ''}
                  onChange={e => setReport({ ...report, kamoa_hod_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Name"
                />
                <input
                  type="date"
                  value={report.kamoa_hod_date || ''}
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
