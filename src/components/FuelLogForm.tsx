import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createFuelLog, updateFuelLog, getEquipment, getSettings, calculateFuelEfficiencyFromFuelLog } from '@/lib/api';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrencySymbol } from '@/lib/utils';

const fuelLogSchema = z.object({
  equipment_id: z.string().uuid('Equipment is required'),
  date: z.string().min(1, 'Date is required'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than 0'),
  cost: z.coerce.number().min(0, 'Cost must be 0 or greater'),
  odometer_reading: z.coerce.number().optional(),
});

type FuelLogFormData = z.infer<typeof fuelLogSchema>;

interface FuelLogFormProps {
  log?: any;
  initialData?: any;
  onClose: () => void;
}

export default function FuelLogForm({ log, initialData, onClose }: FuelLogFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment } = useQuery({ 
    queryKey: ['equipment'], 
    queryFn: getEquipment
  });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const currencySymbol = getCurrencySymbol(settings?.currency);

  const { register, handleSubmit, formState: { errors } } = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogSchema) as any,
    defaultValues: {
      equipment_id: log?.equipment_id || initialData?.equipment_id || '',
      date: log?.date ? new Date(log.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      quantity: log?.quantity || 0,
      cost: log?.cost || 0,
      odometer_reading: log?.odometer_reading || undefined,
    }
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['fuelEfficiencyMetrics'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save fuel log');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFuelLog(log!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['fuelEfficiencyMetrics'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update fuel log');
    }
  });

  const onSubmit = (data: FuelLogFormData) => {
    setError(null);
    // Convert local datetime-local string to ISO string for DB
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
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b p-4 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">
            {log ? 'Edit Fuel Log' : 'Add Fuel Log'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment *</label>
              <select
                {...register('equipment_id')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option key="default" value="">Select Equipment</option>
                {equipment?.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>{eq.asset_tag} - {eq.type}</option>
                ))}
              </select>
              {errors.equipment_id && <p className="mt-1 text-sm text-red-600">{errors.equipment_id.message}</p>}
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
              <label className="block text-sm font-medium text-gray-700">Quantity (Liters) *</label>
              <input
                type="number"
                step="0.01"
                {...register('quantity')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
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
              <label className="block text-sm font-medium text-gray-700">Odometer / Hour Meter</label>
              <input
                type="number"
                step="0.1"
                {...register('odometer_reading')}
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
      </motion.div>
    </div>
  );
}
