import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, createRepairLog, updateRepairLog } from '../lib/api';
import { X, Save, AlertCircle } from 'lucide-react';

interface RepairLogFormProps {
  log?: any;
  schedule?: any;
  onClose: () => void;
}

export default function RepairLogForm({ log, schedule, onClose }: RepairLogFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });

  const [formData, setFormData] = useState({
    equipment_id: schedule?.equipment_id || '',
    repair_type: 'mechanical',
    date_reported: new Date().toISOString().split('T')[0],
    cost: schedule?.estimated_cost || 0,
    status: 'completed', // Default to completed if coming from schedule
    issue_description: schedule?.notes || '',
    action_taken: '',
    workplace: '',
    index_value: '',
  });

  useEffect(() => {
    if (log) {
      setFormData({
        equipment_id: log.equipment_id || '',
        repair_type: log.repair_type || 'mechanical',
        date_reported: log.date_reported ? new Date(log.date_reported).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        cost: log.cost || 0,
        status: log.status || 'in_progress',
        issue_description: log.issue_description || '',
        action_taken: log.action_taken || '',
        workplace: log.workplace || '',
        index_value: log.index_value?.toString() || '',
      });
    } else if (schedule) {
      setFormData(prev => ({
        ...prev,
        equipment_id: schedule.equipment_id || '',
        cost: schedule.estimated_cost || 0,
        issue_description: schedule.notes || '',
        status: 'completed',
        action_taken: '',
        workplace: '',
        index_value: '',
      }));
    }
  }, [log, schedule]);

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => log ? updateRepairLog(log.id, data) : createRepairLog(data, schedule?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairLogs'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      onClose();
    },
    onError: (err: any) => {
      console.error('Error saving repair log:', err);
      setError(err.message || 'Failed to save repair log');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' || name === 'index_value' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {log ? 'Edit Repair Log' : 'New Repair Log'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                value={formData.equipment_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">Select Equipment</option>
                {equipment?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.asset_tag} - {item.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repair Type</label>
                <select
                  name="repair_type"
                  value={formData.repair_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="mechanical">Mechanical</option>
                  <option value="electrical">Electrical</option>
                  <option value="hydraulic">Hydraulic</option>
                  <option value="body">Body Work</option>
                  <option value="tires">Tires</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Reported</label>
                <input
                  type="date"
                  name="date_reported"
                  value={formData.date_reported}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Index Value (Hours/KM)</label>
                <input
                  type="number"
                  name="index_value"
                  value={formData.index_value}
                  onChange={handleChange}
                  placeholder="Current reading"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workplace</label>
                <input
                  type="text"
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleChange}
                  placeholder="Location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
              <textarea
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                placeholder="Describe the issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken / Work Done</label>
              <textarea
                name="action_taken"
                value={formData.action_taken}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                placeholder="Describe the work performed..."
              />
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
              <span>{mutation.isPending ? 'Saving...' : 'Save Repair Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
