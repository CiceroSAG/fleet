import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, createMaintenanceLog, updateMaintenanceLog, getTechnicians } from '../lib/api';
import { X, Save, AlertCircle, User, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface MaintenanceFormProps {
  log?: any;
  schedule?: any;
  initialData?: any;
  onClose: () => void;
}

export default function MaintenanceForm({ log, schedule, initialData, onClose }: MaintenanceFormProps) {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: getTechnicians });

  const [error, setError] = useState<string | null>(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: initialData?.equipment_id || '',
    service_type: 'routine',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    index_value: '',
    next_service_date: '',
    workplace: '',
    description: '',
    parts_replaced: '',
    parts_ordered: '',
    status: 'completed',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (log) {
      setFormData({
        equipment_id: log.equipment_id || '',
        service_type: log.service_type || 'routine',
        date: log.date ? new Date(log.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        cost: log.cost?.toString() || '',
        index_value: log.index_value?.toString() || '',
        next_service_date: log.next_service_date || '',
        workplace: log.workplace || '',
        description: log.notes || log.description || '',
        parts_replaced: log.parts_replaced || '',
        parts_ordered: log.parts_ordered || '',
        status: log.status || 'completed',
      });
      
      if (log.maintenance_technicians) {
        setSelectedTechnicians(log.maintenance_technicians.map((mt: any) => mt.technician_id));
      }
    } else if (schedule) {
      setFormData({
        equipment_id: schedule.equipment_id || (schedule.id.startsWith('under-maintenance-') ? schedule.id.replace('under-maintenance-', '') : ''),
        service_type: schedule.maintenance_type || 'routine',
        date: new Date().toISOString().split('T')[0],
        cost: schedule.estimated_cost?.toString() || '',
        index_value: '',
        next_service_date: '',
        workplace: '',
        description: schedule.description || '',
        parts_replaced: schedule.parts_replaced || '',
        parts_ordered: schedule.parts_ordered || '',
        status: 'completed',
      });
      
      if (schedule.assigned_to) {
        setSelectedTechnicians([schedule.assigned_to]);
      }
    }
  }, [log, schedule]);

  const mutation = useMutation({
    mutationFn: (data: any) => log 
      ? updateMaintenanceLog(log.id, data, selectedTechnicians) 
      : createMaintenanceLog(data, selectedTechnicians, schedule?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      onClose();
    },
    onError: (err: any) => {
      console.error('Error saving maintenance log:', err);
      setError(err.message || 'Failed to save maintenance log');
    }
  });

  const { profile } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const submitData = {
      ...formData,
      cost: formData.cost ? (parseFloat(formData.cost) || 0) : 0,
      index_value: formData.index_value ? (parseFloat(formData.index_value) || 0) : 0,
      notes: formData.description,
      next_service_date: formData.next_service_date || null,
    };
    
    // If a technician is submitting or editing, set approval_status to pending
    if (profile?.role === 'Technician') {
      (submitData as any).approval_status = 'pending';
    }

    mutation.mutate(submitData);
  };

  const toggleTechnician = (id: string) => {
    setSelectedTechnicians(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {log ? 'Edit Maintenance Log' : 'Log New Maintenance'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <select
                name="equipment_id"
                value={formData.equipment_id || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">Select Equipment</option>
                {equipment?.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.asset_tag} - {item.type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  name="service_type"
                  value={formData.service_type || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="routine">Routine Service</option>
                  <option value="inspection">Inspection</option>
                  <option value="oil_change">Oil Change</option>
                  <option value="tire_rotation">Tire Rotation</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="preventive">Preventive Maintenance</option>
                  <option value="predictive">Predictive Maintenance</option>
                  <option value="corrective">Corrective Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Index Value (Hours/KM)</label>
                <input
                  type="number"
                  name="index_value"
                  value={formData.index_value || ''}
                  onChange={handleChange}
                  placeholder="Current reading"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workplace</label>
                <input
                  type="text"
                  name="workplace"
                  value={formData.workplace || ''}
                  onChange={handleChange}
                  placeholder="Location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Date</label>
                <input
                  type="date"
                  name="next_service_date"
                  value={formData.next_service_date || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technicians</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-left flex justify-between items-center bg-white"
                >
                  <span className="truncate">
                    {selectedTechnicians.length > 0
                      ? technicians
                          ?.filter((t: any) => selectedTechnicians.includes(t.id))
                          .map((t: any) => t.name)
                          .join(', ')
                      : 'Select Technicians'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isTechDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTechDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto p-2 space-y-1">
                    {technicians?.map((tech: any) => (
                      <label
                        key={tech.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTechnicians.includes(tech.id)}
                            onChange={() => toggleTechnician(tech.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                            <span className="text-xs text-gray-400">{tech.specialty}</span>
                          </div>
                        </div>
                        {selectedTechnicians.includes(tech.id) && (
                          <Check className="w-4 h-4 text-orange-600" />
                        )}
                      </label>
                    ))}
                    {(!technicians || technicians.length === 0) && (
                      <p className="text-xs text-gray-500 italic p-2 text-center">
                        No technicians available. Add them in the Technicians menu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={2}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                placeholder="Describe the work performed..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parts Replaced</label>
                <textarea
                  name="parts_replaced"
                  value={formData.parts_replaced || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                  placeholder="List parts replaced..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parts Ordered</label>
                <textarea
                  name="parts_ordered"
                  value={formData.parts_ordered || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                  placeholder="List parts ordered..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{mutation.isPending ? 'Saving...' : 'Save Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
