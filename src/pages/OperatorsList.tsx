import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperators, deleteOperator } from '@/lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import OperatorForm from '@/components/OperatorForm';
import { useAuth } from '@/lib/auth';

export default function OperatorsList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canEdit = profile?.role === 'Admin' || profile?.role === 'Manager';

  const { data: operators, isLoading, error } = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditForm = (item: any) => {
    setEditingOperator(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingOperator(null);
    setIsFormOpen(false);
  };

  const filteredOperators = operators?.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.license_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage drivers and operators for your fleet.
          </p>
        </div>
        {canEdit && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsFormOpen(true)}
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Operator
            </button>
          </div>
        )}
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
              placeholder="Search operators..."
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading operators...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Database Connection Error</p>
            <p className="text-sm mt-1">Please ensure your Supabase URL and Anon Key are set.</p>
          </div>
        ) : !filteredOperators || filteredOperators.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No operators found. Add some to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">License Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                  {canEdit && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOperators.map((item: any) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.license_type || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.contact || '-'}</td>
                    {canEdit && (
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit {item.name}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {item.name}</span>
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
        <OperatorForm operator={editingOperator} onClose={closeForm} />
      )}
    </div>
  );
}
