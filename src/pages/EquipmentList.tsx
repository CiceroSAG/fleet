import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, deleteEquipment } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import EquipmentForm from '@/components/EquipmentForm';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';

export default function EquipmentList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canEdit = profile?.role === 'Admin' || profile?.role === 'Manager';

  const { data: equipment, isLoading, error } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditForm = (item: any) => {
    setEditingEquipment(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingEquipment(null);
    setIsFormOpen(false);
  };

  const filteredEquipment = equipment?.filter((item: any) => {
    const matchesSearch = item.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all mining equipment in your fleet.
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
              Add Equipment
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 border"
              placeholder="Search equipment..."
            />
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm border"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading equipment...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Database Connection Error</p>
            <p className="text-sm mt-1">Please ensure your Supabase URL and Anon Key are set in the environment variables, and you have run the `supabase-schema.sql` script.</p>
          </div>
        ) : !filteredEquipment || filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No equipment found. Add some to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Asset Tag</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Model</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">License Plate</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  {canEdit && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEquipment.map((item: any) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link to={`/equipment/${item.id}`} className="text-orange-600 hover:text-orange-900 hover:underline">
                        {item.asset_tag}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.type}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.manufacturer} {item.model}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.license_plate || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.current_location || 'Unassigned'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        item.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                        item.status === 'Damaged' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit {item.asset_tag}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {item.asset_tag}</span>
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
        <EquipmentForm equipment={editingEquipment} onClose={closeForm} />
      )}
    </div>
  );
}


