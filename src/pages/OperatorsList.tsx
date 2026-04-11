import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperators, deleteOperator } from '../lib/api';
import { Plus, Search, User, Mail, Phone, MoreVertical, ShieldCheck, Clock, Edit2, Trash2 } from 'lucide-react';
import OperatorForm from '../components/OperatorForm';
import ConfirmModal from '../components/ConfirmModal';

export default function OperatorsList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: operators, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      setOpenMenuId(null);
    },
  });

  const filteredOperators = operators?.filter(op => 
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (op: any) => {
    setSelectedOperator(op);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading operators...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
        <button 
          onClick={() => {
            setSelectedOperator(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOperators?.map((operator) => (
          <div key={operator.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{operator.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                      <span>License: {operator.license_number}</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === operator.id ? null : operator.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openMenuId === operator.id && (
                    <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                      <button
                        onClick={() => handleEdit(operator)}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(operator.id)}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{operator.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{operator.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Status: <span className="text-green-600 font-medium">{operator.status || 'Active'}</span></span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-100">
              <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                View Profile
              </button>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Assign Equipment
              </button>
            </div>
          </div>
        ))}
        {filteredOperators?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No operators found matching your search.
          </div>
        )}
      </div>
      {isFormOpen && (
        <OperatorForm
          operator={selectedOperator}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedOperator(null);
          }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Operator"
        message="Are you sure you want to delete this operator? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
