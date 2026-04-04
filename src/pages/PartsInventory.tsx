import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPartsInventory, deletePart } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import PartsForm from '@/components/PartsForm';
import { useAuth } from '@/lib/auth';

export default function PartsInventory() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canEditDelete = profile?.role === 'Admin' || profile?.role === 'Manager';

  const { data: parts, isLoading, error } = useQuery({
    queryKey: ['partsInventory'],
    queryFn: getPartsInventory
  });

  const deleteMutation = useMutation({
    mutationFn: deletePart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partsInventory'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditForm = (part: any) => {
    setEditingPart(part);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingPart(null);
    setIsFormOpen(false);
  };

  const filteredParts = parts?.filter((part: any) =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage spare parts, stock levels, and suppliers.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsFormOpen(true)}
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Part
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
              placeholder="Search parts..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading parts inventory...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Error loading parts</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : !filteredParts || filteredParts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No parts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new part.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParts.map((part: any) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{part.name}</div>
                        <div className="text-sm text-gray-500">{part.part_number}</div>
                        {part.category && (
                          <div className="text-xs text-gray-400">{part.category}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {part.current_stock} / {part.min_stock}
                      </div>
                      <div className={`text-xs ${
                        part.current_stock <= part.min_stock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {part.current_stock <= part.min_stock ? 'Low Stock' : 'In Stock'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.parts_suppliers?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${part.unit_cost?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEditDelete && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditForm(part)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <PartsForm part={editingPart} onClose={closeForm} />
      )}
    </div>
  );
}