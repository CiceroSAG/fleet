import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuelLogs, deleteFuelLog, getSettings } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Filter, Fuel, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import FuelLogForm from '@/components/FuelLogForm';
import { useAuth } from '@/lib/auth';
import { getCurrencySymbol } from '@/lib/utils';

export default function FuelLogs() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  
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

  const filteredLogs = logs?.filter((item: any) => {
    const matchesSearch = item.equipment?.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment?.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || item.date.startsWith(dateFilter);
    const matchesEquipment = equipmentFilter === 'all' || item.equipment_id === equipmentFilter;
    
    return matchesSearch && matchesDate && matchesEquipment;
  });

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (!filteredLogs) return { total: 0, totalQuantity: 0, totalCost: 0, avgPrice: 0 };
    
    const total = filteredLogs.length;
    const totalQuantity = filteredLogs.reduce((sum, log) => sum + Number(log.quantity), 0);
    const totalCost = filteredLogs.reduce((sum, log) => sum + Number(log.cost), 0);
    const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    
    return { total, totalQuantity, totalCost, avgPrice };
  }, [filteredLogs]);

  // Get unique equipment for filter dropdown
  const equipmentOptions = React.useMemo(() => {
    if (!logs) return [];
    const unique = new Map();
    logs.forEach((log: any) => {
      if (log.equipment && !unique.has(log.equipment.id)) {
        unique.set(log.equipment.id, log.equipment);
      }
    });
    return Array.from(unique.values());
  }, [logs]);

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Fuel className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fuel</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity.toFixed(1)} L</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">{currencySymbol}{stats.totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Price/L</p>
              <p className="text-2xl font-bold text-gray-900">{currencySymbol}{stats.avgPrice.toFixed(2)}</p>
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
                placeholder="Search by asset tag..."
              />
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-5 w-5 text-gray-400" />
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm border"
              />
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm border"
              >
                <option key="all" value="all">All Equipment</option>
                {equipmentOptions.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.asset_tag} ({eq.type})
                  </option>
                ))}
              </select>
            </div>
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
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.odometer_reading || '-'}</td>
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
