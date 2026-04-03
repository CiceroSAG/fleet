import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createRepairLog, updateRepairLog, getEquipment, getSettings } from '@/lib/api';
import { X } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/utils';

const repairSchema = z.object({
  equipment_id: z.string().uuid('Equipment is required'),
  issue_description: z.string().min(1, 'Issue description is required'),
  date_reported: z.string().min(1, 'Date reported is required'),
  status: z.enum(['Pending', 'In Progress', 'Completed']),
  cost: z.coerce.number().optional(),
});

type RepairFormData = z.infer<typeof repairSchema>;

interface RepairFormProps {
  log?: any;
  onClose: () => void;
}

export default function RepairForm({ log, onClose }: RepairFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const currencySymbol = getCurrencySymbol(settings?.currency);

  const { register, handleSubmit, formState: { errors } } = useForm<RepairFormData>({
    resolver: zodResolver(repairSchema) as any,
    defaultValues: {
      equipment_id: log?.equipment_id || '',
      issue_description: log?.issue_description || '',
      date_reported: log?.date_reported ? new Date(log.date_reported).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: log?.status || 'Pending',
      cost: log?.cost || undefined,
    }
  });

  const createMutation = useMutation({
    mutationFn: createRepairLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairLogs'] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: RepairFormData) => updateRepairLog(log.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairLogs'] });
      onClose();
    }
  });

  const onSubmit = (data: RepairFormData) => {
    const payload = {
      ...data,
      date_reported: new Date(data.date_reported).toISOString()
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
            {log ? 'Edit Repair Log' : 'Add Repair Log'}
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
              <label className="block text-sm font-medium text-gray-700">Issue Description *</label>
              <textarea
                {...register('issue_description')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.issue_description && <p className="mt-1 text-sm text-red-600">{errors.issue_description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Reported *</label>
              <input
                type="datetime-local"
                {...register('date_reported')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.date_reported && <p className="mt-1 text-sm text-red-600">{errors.date_reported.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select
                {...register('status')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                {...register('cost')}
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
