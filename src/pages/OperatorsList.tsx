import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperators, deleteOperator } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Users, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import OperatorForm from '@/components/OperatorForm';
import { useAuth } from '@/lib/auth';

export default function OperatorsList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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

  const filteredOperators = operators?.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.license_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.is_active) || 
      (statusFilter === 'inactive' && !item.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (!operators) return { total: 0, active: 0, withLicense: 0 };
    
    const total = operators.length;
    const active = operators.filter(op => op.is_active).length;
    const withLicense = operators.filter(op => op.license_number).length;
    
    return { total, active, withLicense };
  }, [operators]);

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Operators</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With License</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withLicense}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm border"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
