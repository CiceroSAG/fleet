import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOperator, updateOperator } from '@/lib/api';
import { X } from 'lucide-react';

const operatorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  license_type: z.string().optional(),
  contact: z.string().optional(),
});

type OperatorFormData = z.infer<typeof operatorSchema>;

interface OperatorFormProps {
  operator?: any;
  onClose: () => void;
}

export default function OperatorForm({ operator, onClose }: OperatorFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      name: operator?.name || '',
      license_type: operator?.license_type || '',
      contact: operator?.contact || '',
    }
  });

  const createMutation = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: OperatorFormData) => updateOperator(operator.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      onClose();
    }
  });

  const onSubmit = (data: OperatorFormData) => {
    if (operator) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {operator ? 'Edit Operator' : 'Add Operator'}
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
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Type</label>
              <input
                {...register('license_type')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact</label>
              <input
                {...register('contact')}
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
