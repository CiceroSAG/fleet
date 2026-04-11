import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIncidents, getEquipment, getOperators, deleteIncident } from '../lib/api';
import { Plus, Search, AlertTriangle, ShieldAlert, Calendar, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import IncidentForm from '../components/IncidentForm';
import ConfirmModal from '../components/ConfirmModal';

export default function Incidents() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: getIncidents,
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  const { data: operators } = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setOpenMenuId(null);
    },
  });

  const filteredIncidents = incidents?.filter(incident => {
    const equip = equipment?.find(e => e.id === incident.equipment_id);
    const op = operators?.find(o => o.id === incident.operator_id);
    const searchStr = `${equip?.asset_tag} ${op?.name} ${incident.type} ${incident.description}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleEdit = (incident: any) => {
    setSelectedIncident(incident);
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading incidents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Safety Incidents</h1>
        <button 
          onClick={() => {
            setSelectedIncident(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by equipment, operator or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredIncidents?.map((incident) => {
          const equip = equipment?.find(e => e.id === incident.equipment_id);
          const op = operators?.find(o => o.id === incident.operator_id);
          
          return (
            <div key={incident.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      incident.severity === 'critical' || incident.severity === 'major' ? 'bg-red-100 text-red-600' :
                      incident.severity === 'moderate' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{(incident.type || '').replace('_', ' ')}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        incident.severity === 'critical' || incident.severity === 'major' ? 'bg-red-100 text-red-700' :
                        incident.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {(incident.severity || '').toUpperCase()} Severity
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === incident.id ? null : incident.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === incident.id && (
                      <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                        <button
                          onClick={() => handleEdit(incident)}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(incident.id)}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 line-clamp-2">{incident.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(incident.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    <span className="truncate">{op?.name || 'Unknown Operator'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    <span>{equip?.asset_tag || 'Unknown Vehicle'}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => handleEdit(incident)}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredIncidents?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No safety incidents found matching your search.
          </div>
        )}
      </div>
      {isFormOpen && (
        <IncidentForm
          incident={selectedIncident}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedIncident(null);
          }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Incident Report"
        message="Are you sure you want to delete this incident report?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
