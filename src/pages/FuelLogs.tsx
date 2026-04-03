import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuelLogs, deleteFuelLog, getSettings } from '@/lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import FuelLogForm from '@/components/FuelLogForm';
import { useAuth } from '@/lib/auth';
import { getCurrencySymbol } from '@/lib/utils';

export default function FuelLogs() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  // Operators can insert, Admins/Managers can edit/delete
  const canEditDelete = profile?.role === 'Admin' || profile?.role === 'Manager';

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: getFuelLogs
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const currencySymbol = getCurrencySymbol(settings?.currency);

  const deleteMutation = useMutation({
    mutationFn: deleteFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditForm = (item: any) => {
    setEditingLog(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingLog(null);
    setIsFormOpen(false);
  };

  const filteredLogs = logs?.filter((item: any) => 
    item.equipment?.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipment?.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track fuel consumption and costs across the fleet.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsFormOpen(true)}
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Log Fuel
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 border"
              placeholder="Search by asset tag..."
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Database Connection Error</p>
            <p className="text-sm mt-1">Please ensure your Supabase URL and Anon Key are set.</p>
          </div>
        ) : !filteredLogs || filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No fuel logs found. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipment</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity (L)</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost ({currencySymbol})</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Odometer</th>
                  {canEditDelete && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.map((item: any) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {new Date(item.date).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {item.equipment?.asset_tag} ({item.equipment?.type})
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{currencySymbol}{item.cost}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.odometer || '-'}</td>
                    {canEditDelete && (
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <FuelLogForm log={editingLog} onClose={closeForm} />
      )}
    </div>
  );
}
