import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperators, createEquipment, updateEquipment, getCategories } from '@/lib/api';
import { X } from 'lucide-react';

const equipmentSchema = z.object({
  asset_tag: z.string().min(1, 'Asset Tag is required'),
  type: z.string().min(1, 'Type is required'),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z.coerce.number().optional(),
  serial_number: z.string().optional(),
  license_plate: z.string().optional(),
  vin: z.string().optional(),
  assigned_operator_id: z.string().uuid().optional().or(z.literal('')),
  current_location: z.string().optional(),
  status: z.enum(['Active', 'Under Maintenance', 'Out of Service', 'Damaged']),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  equipment?: any;
  onClose: () => void;
}

export default function EquipmentForm({ equipment, onClose }: EquipmentFormProps) {
  const queryClient = useQueryClient();
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema) as any,
    defaultValues: {
      asset_tag: equipment?.asset_tag || '',
      type: equipment?.type || '',
      model: equipment?.model || '',
      manufacturer: equipment?.manufacturer || '',
      year: equipment?.year || undefined,
      serial_number: equipment?.serial_number || '',
      license_plate: equipment?.license_plate || '',
      vin: equipment?.vin || '',
      assigned_operator_id: equipment?.assigned_operator_id || '',
      current_location: equipment?.current_location || '',
      status: equipment?.status || 'Active',
    }
  });

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => updateEquipment(equipment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    }
  });

  const onSubmit = (data: EquipmentFormData) => {
    // Clean up empty strings for optional UUIDs
    const payload = {
      ...data,
      assigned_operator_id: data.assigned_operator_id === '' ? null : data.assigned_operator_id
    };

    if (equipment) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {equipment ? 'Edit Equipment' : 'Add Equipment'}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Tag *</label>
              <input
                {...register('asset_tag')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.asset_tag && <p className="mt-1 text-sm text-red-600">{errors.asset_tag.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                {...register('type')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="">Select a type</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <input
                {...register('manufacturer')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <input
                {...register('model')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="number"
                {...register('year')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <input
                {...register('serial_number')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate (Vehicles)</label>
              <input
                {...register('license_plate')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">VIN (Vehicles)</label>
              <input
                {...register('vin')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Operator</label>
              <select
                {...register('assigned_operator_id')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="">Unassigned</option>
                {operators?.map((op: any) => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Current Location / Site</label>
              <input
                {...register('current_location')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                {...register('status')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              >
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Damaged">Damaged</option>
              </select>
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
