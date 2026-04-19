import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, getProfiles, createMaintenanceSchedule, updateMaintenanceSchedule } from '../lib/api';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceScheduleFormProps {
  schedule?: any;
  onClose: () => void;
}

export default function MaintenanceScheduleForm({ schedule, onClose }: MaintenanceScheduleFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: getProfiles });

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type: 'preventive',
    description: '',
    interval_type: 'days',
    interval_value: '',
    next_due: new Date().toISOString().split('T')[0],
    priority: 'normal',
    status: 'active',
    assigned_to: '',
    estimated_cost: '',
    parts_replaced: '',
    parts_ordered: '',
    notes: '',
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        equipment_id: schedule.equipment_id || '',
        maintenance_type: schedule.maintenance_type || 'preventive',
        description: schedule.description || '',
        interval_type: schedule.interval_type || 'days',
        interval_value: schedule.interval_value?.toString() || '',
        next_due: schedule.next_due ? new Date(schedule.next_due).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: schedule.priority || 'normal',
        status: schedule.status || 'active',
        assigned_to: schedule.assigned_to || '',
        estimated_cost: schedule.estimated_cost?.toString() || '',
        parts_replaced: schedule.parts_replaced || '',
        parts_ordered: schedule.parts_ordered || '',
        notes: schedule.notes || '',
      });
    }
  }, [schedule]);

  const createMutation = useMutation({
    mutationFn: createMaintenanceSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceWorkload'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateMaintenanceSchedule(schedule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceWorkload'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dataToSubmit = {
      ...formData,
      interval_value: formData.interval_value ? parseInt(formData.interval_value) : 0,
      estimated_cost: formData.estimated_cost ? (parseFloat(formData.estimated_cost) || 0) : 0,
      assigned_to: formData.assigned_to || null,
    };

    if (schedule) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {schedule ? 'Edit Maintenance Schedule' : 'Add Maintenance Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment *
              </label>
              <select
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="">Select Equipment</option>
                {equipment?.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.asset_tag} - {eq.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Type *
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="preventive">Preventive</option>
                <option value="predictive">Predictive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval Type *
              </label>
              <select
                name="interval_type"
                value={formData.interval_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="days">Days</option>
                <option value="hours">Hours</option>
                <option value="miles">Miles</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval Value *
              </label>
              <input
                type="number"
                name="interval_value"
                value={formData.interval_value || ''}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Date *
              </label>
              <input
                type="date"
                name="next_due"
                value={formData.next_due || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="">Unassigned</option>
                {profiles?.filter((p: any) => ['Admin', 'Manager', 'Technician'].includes(p.role)).map((profile: any) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email} ({profile.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                name="estimated_cost"
                value={formData.estimated_cost || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parts Replaced (Planned)
                </label>
                <textarea
                  name="parts_replaced"
                  value={formData.parts_replaced || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  placeholder="Parts usually replaced during this service..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parts Ordered (Planned)
                </label>
                <textarea
                  name="parts_ordered"
                  value={formData.parts_ordered || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  placeholder="Parts to be ordered before service..."
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isPending ? 'Saving...' : 'Save Schedule'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
