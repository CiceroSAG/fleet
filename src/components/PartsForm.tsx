import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createPart, updatePart, getPartsSuppliers } from '@/lib/api';
import { X } from 'lucide-react';

const partSchema = z.object({
  part_number: z.string().min(1, 'Part number is required'),
  name: z.string().min(1, 'Part name is required'),
  description: z.string().optional(),
  current_stock: z.number().min(0, 'Stock must be non-negative'),
  min_stock: z.number().min(0, 'Minimum stock must be non-negative'),
  max_stock: z.number().min(0, 'Maximum stock must be non-negative').optional(),
  unit_cost: z.number().min(0, 'Cost must be non-negative').optional(),
  supplier_id: z.string().uuid('Supplier is required').optional(),
  category: z.string().optional(),
});

type PartFormData = z.infer<typeof partSchema>;

interface PartsFormProps {
  part?: any;
  onClose: () => void;
}

export default function PartsForm({ part, onClose }: PartsFormProps) {
  const queryClient = useQueryClient();
  const { data: suppliers } = useQuery({ queryKey: ['partsSuppliers'], queryFn: getPartsSuppliers });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      part_number: part?.part_number || '',
      name: part?.name || '',
      description: part?.description || '',
      current_stock: part?.current_stock || 0,
      min_stock: part?.min_stock || 0,
      max_stock: part?.max_stock || undefined,
      unit_cost: part?.unit_cost || undefined,
      supplier_id: part?.supplier_id || '',
      category: part?.category || '',
    }
  });

  const createMutation = useMutation({
    mutationFn: createPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partsInventory'] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: PartFormData) => updatePart(part.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partsInventory'] });
      onClose();
    }
  });

  const onSubmit = (data: PartFormData) => {
    const payload = {
      ...data,
      max_stock: data.max_stock || null,
      unit_cost: data.unit_cost || null,
      supplier_id: data.supplier_id || null,
    };

    if (part) {
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
            {part ? 'Edit Part' : 'Add New Part'}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Part Number *</label>
              <input
                {...register('part_number')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.part_number && <p className="mt-1 text-sm text-red-600">{errors.part_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Part Name *</label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock *</label>
              <input
                {...register('current_stock', { valueAsNumber: true })}
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.current_stock && <p className="mt-1 text-sm text-red-600">{errors.current_stock.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Min Stock *</label>
              <input
                {...register('min_stock', { valueAsNumber: true })}
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.min_stock && <p className="mt-1 text-sm text-red-600">{errors.min_stock.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Stock</label>
              <input
                {...register('max_stock', { valueAsNumber: true })}
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
              <input
                {...register('unit_cost', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                {...register('category')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                placeholder="e.g., Engine, Transmission"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              {...register('supplier_id')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
            >
              <option value="">Select Supplier</option>
              {suppliers?.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              className="rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : (part ? 'Update Part' : 'Add Part')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}