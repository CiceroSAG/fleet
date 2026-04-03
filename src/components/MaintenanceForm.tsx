import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createMaintenanceLog, updateMaintenanceLog, getEquipment, getSettings } from '@/lib/api';
import { X } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';

const maintenanceSchema = z.object({
  equipment_id: z.string().uuid('Equipment is required'),
  service_type: z.enum(['routine', 'major', 'emergency']),
  date: z.string().min(1, 'Date is required'),
  cost: z.coerce.number().min(0, 'Cost must be 0 or greater'),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  log?: any;
  onClose: () => void;
}

export default function MaintenanceForm({ log, onClose }: MaintenanceFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const currencySymbol = getCurrencySymbol(settings?.currency);

  const { register, handleSubmit, formState: { errors } } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: {
      equipment_id: log?.equipment_id || '',
      service_type: log?.service_type || 'routine',
      date: log?.date ? new Date(log.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      cost: log?.cost || 0,
      notes: log?.notes || '',
    }
  });

  const createMutation = useMutation({
    mutationFn: createMaintenanceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: MaintenanceFormData) => updateMaintenanceLog(log.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      onClose();
    }
  });

  const onSubmit = (data: MaintenanceFormData) => {
    const payload = {
      ...data,
      date: new Date(data.date).toISOString()
    };

    if (log) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {log ? 'Edit Maintenance Log' : 'Add Maintenance Log'}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment *</label>
              <select
                {...register('equipment_id')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="">Select Equipment</option>
                {equipment?.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>{eq.asset_tag} - {eq.type}</option>
                ))}
              </select>
              {errors.equipment_id && <p className="mt-1 text-sm text-red-600">{errors.equipment_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Type *</label>
              <select
                {...register('service_type')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="routine">Routine</option>
                <option value="major">Major</option>
                <option value="emergency">Emergency</option>
              </select>
              {errors.service_type && <p className="mt-1 text-sm text-red-600">{errors.service_type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time *</label>
              <input
                type="datetime-local"
                {...register('date')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost ({currencySymbol}) *</label>
              <input
                type="number"
                step="0.01"
                {...register('cost')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
