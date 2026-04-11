import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician, getProfiles, getFieldServiceReports } from '../lib/api';
import { Plus, Search, User, Mail, Briefcase, CheckCircle2, XCircle, MoreVertical, Edit2, Trash2, X, Link as LinkIcon, FileText } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Technicians() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const { data: reports } = useQuery({
    queryKey: ['fieldServiceReports'],
    queryFn: getFieldServiceReports,
  });

  const getReportCount = (techName: string) => {
    return reports?.filter(r => r.technician_name === techName).length || 0;
  };

  const createMutation = useMutation({
    mutationFn: createTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setIsFormOpen(false);
      setSelectedTechnician(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setIsFormOpen(false);
      setSelectedTechnician(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setOpenMenuId(null);
    },
  });

  const filteredTechnicians = technicians?.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tech: any) => {
    setSelectedTechnician(tech);
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading technicians...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <button 
          onClick={() => {
            setSelectedTechnician(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Technician</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians?.map((tech) => (
          <div key={tech.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
            <div className="absolute right-4 top-4">
              <div className="relative">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === tech.id ? null : tech.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {openMenuId === tech.id && (
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                    <button
                      onClick={() => handleEdit(tech)}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(tech.id)}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{tech.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {tech.specialty || 'General Technician'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {tech.contact_info || 'No contact info'}
              </div>
              <div className="flex items-center justify-between">
                {tech.status === 'Active' ? (
                  <div className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </div>
                )}
                <div className="flex items-center space-x-1 text-orange-600">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs font-bold">{getReportCount(tech.name)} Reports</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredTechnicians?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No technicians found.
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedTechnician ? 'Edit Technician' : 'Add New Technician'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name'),
                  specialty: formData.get('specialty'),
                  contact_info: formData.get('contact_info'),
                  status: formData.get('status'),
                  user_id: formData.get('user_id') || null,
                };
                if (selectedTechnician) {
                  updateMutation.mutate({ id: selectedTechnician.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={selectedTechnician?.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input
                  name="specialty"
                  type="text"
                  placeholder="e.g. Hydraulics, Engine, Electrical"
                  defaultValue={selectedTechnician?.specialty}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (Email/Phone)</label>
                <input
                  name="contact_info"
                  type="text"
                  defaultValue={selectedTechnician?.contact_info}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to User Account</label>
                <select
                  name="user_id"
                  defaultValue={selectedTechnician?.user_id || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">No linked account</option>
                  {profiles?.map((profile: any) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.email} ({profile.role})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Allows the technician to log in and manage their assigned tasks.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={selectedTechnician?.status || 'Active'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {selectedTechnician ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Technician"
        message="Are you sure you want to delete this technician?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
