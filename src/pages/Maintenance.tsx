import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaintenanceLogs, getEquipment, deleteMaintenanceLog } from '../lib/api';
import { Plus, Search, Calendar, Wrench, CheckCircle2, Clock, AlertTriangle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import MaintenanceForm from '../components/MaintenanceForm';

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['maintenanceLogs'],
    queryFn: getMaintenanceLogs,
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setOpenMenuId(null);
    },
  });

  const filteredLogs = logs?.filter(log => {
    const equip = equipment?.find(e => e.id === log.equipment_id);
    const searchStr = `${equip?.asset_tag} ${log.service_type} ${log.description}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleEdit = (log: any) => {
    setSelectedLog(log);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance log?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading maintenance logs...</div>;
  }

  const stats = {
    scheduled: logs?.filter(l => l.status === 'scheduled').length || 0,
    inProgress: logs?.filter(l => l.status === 'in_progress').length || 0,
    overdue: logs?.filter(l => l.status === 'overdue').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Logs</h1>
        <button 
          onClick={() => {
            setSelectedLog(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Log Maintenance</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Scheduled</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">In Progress</span>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Overdue</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset tag or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs?.map((log) => {
                const equip = equipment?.find(e => e.id === log.equipment_id);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <Wrench className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{equip?.asset_tag || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{(log.service_type || '').replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${log.cost?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                        ) : log.status === 'in_progress' ? (
                          <Clock className="w-4 h-4 text-orange-500 mr-2" />
                        ) : (
                          <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                        )}
                        <span className="text-sm text-gray-700 capitalize">{(log.status || '').replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === log.id ? null : log.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === log.id && (
                          <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                            <button
                              onClick={() => handleEdit(log)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No maintenance logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isFormOpen && (
        <MaintenanceForm
          log={selectedLog}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}
