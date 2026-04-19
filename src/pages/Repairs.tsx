import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRepairLogs, getEquipment, deleteRepairLog, getSettings } from '../lib/api';
import { Plus, Search, AlertCircle, Wrench, Clock, CheckCircle2, MoreVertical, Trash2, Edit2, Calendar } from 'lucide-react';
import RepairLogForm from '../components/RepairLogForm';
import ConfirmModal from '../components/ConfirmModal';
import { getCurrencySymbol } from '../lib/utils';

export default function Repairs() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['repairLogs'],
    queryFn: getRepairLogs,
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const currencySymbol = getCurrencySymbol(settings?.currency);

  const deleteMutation = useMutation({
    mutationFn: deleteRepairLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairLogs'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setOpenMenuId(null);
    },
  });

  const filteredLogs = logs?.filter(log => {
    const equip = equipment?.find(e => e.id === log.equipment_id);
    const searchStr = `${equip?.asset_tag} ${log.repair_type} ${log.issue_description}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleEdit = (log: any) => {
    setSelectedLog(log);
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading repair logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Repair Logs</h1>
        <button 
          onClick={() => {
            setSelectedLog(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Log Repair</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset tag or repair type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technicians</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs?.map((log, index) => {
                const equip = equipment?.find(e => e.id === log.equipment_id);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-red-100 p-2 rounded-lg mr-3">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{equip?.asset_tag || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{(log.repair_type || '').replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.date_reported).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {currencySymbol}{log.cost?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-1">
                        {log.repair_technicians?.length > 0 ? (
                          log.repair_technicians.map((rt: any, i: number) => (
                            <div 
                              key={i} 
                              className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center"
                              title={rt.technicians?.name}
                            >
                              <span className="text-[10px] font-medium text-gray-600">
                                {rt.technicians?.name?.split(' ').map((n: any) => n[0]).join('')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {log.schedule_id ? (
                        <span className="inline-flex items-center text-orange-600 font-medium">
                          <Calendar className="w-3 h-3 mr-1" />
                          Linked
                        </span>
                      ) : (
                        <span className="text-gray-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700' :
                        log.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {(log.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === log.id ? null : log.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openMenuId === log.id && (
                        <div className={`absolute right-6 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 ${
                          index > (filteredLogs?.length || 0) - 3 && (filteredLogs?.length || 0) > 3 ? 'bottom-full mb-2' : 'top-10'
                        }`}>
                          <button
                            onClick={() => handleEdit(log)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No repair logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <RepairLogForm
          log={selectedLog}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedLog(null);
          }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Repair Log"
        message="Are you sure you want to delete this repair log?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
