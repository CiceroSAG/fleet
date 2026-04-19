import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, deleteEquipment } from '../lib/api';
import { Plus, Search, Filter, MoreVertical, Truck, Info, Wrench, Fuel, Edit2, Trash2, Users, Calendar, PlusCircle, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import EquipmentForm from '../components/EquipmentForm';
import FuelLogForm from '../components/FuelLogForm';
import MaintenanceForm from '../components/MaintenanceForm';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../lib/auth';
import QRCodeGenerator from '../components/QRCodeGenerator';

export default function EquipmentList() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrItem, setQrItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setOpenMenuId(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      alert(`Could not delete equipment. It may be referenced by other records (maintenance logs, fuel logs, etc.). Please delete related records first or ensure database cascading is enabled.\n\nError: ${error.message || 'Unknown error'}`);
    }
  });

  const filteredEquipment = equipment?.filter(item => {
    const matchesSearch = item.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item: any) => {
    setSelectedItem(item);
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading equipment...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Fleet</h1>
        <button 
          onClick={() => {
            setSelectedItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset tag or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-600" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[450px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Operator</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipment?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg mr-3">
                        <Truck className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.asset_tag}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                      item.status.toLowerCase() === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                      item.status.toLowerCase() === 'repair' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.operators?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 relative">
                      <button
                        onClick={() => { setSelectedItem(item); setIsFuelFormOpen(true); }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Log Fuel"
                      >
                        <Fuel className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setIsMaintenanceFormOpen(true); }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Log Maintenance"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setQrItem(item); setShowQR(true); }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Generate QR Tag"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/equipment/${item.id}`}
                        className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                        title="View Details"
                      >
                        <Info className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === item.id && (
                        <div className={`absolute right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 ${
                          index > (filteredEquipment?.length || 0) - 3 && (filteredEquipment?.length || 0) > 3 ? 'bottom-full mb-2' : 'top-10'
                        }`}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span>Edit Equipment</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Equipment</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEquipment?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No equipment found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredEquipment?.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{item.asset_tag}</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{item.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                item.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                item.status.toLowerCase() === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                item.status.toLowerCase() === 'repair' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">{item.operators?.name || 'Unassigned Operator'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              <button
                onClick={() => { setSelectedItem(item); setIsFuelFormOpen(true); }}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Fuel className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Fuel</span>
              </button>
              <button
                onClick={() => { setSelectedItem(item); setIsMaintenanceFormOpen(true); }}
                className="flex flex-col items-center justify-center p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Wrench className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Log</span>
              </button>
              <Link
                to="/maintenance-scheduling?action=new"
                className="flex flex-col items-center justify-center p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <PlusCircle className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Task</span>
              </Link>
              <Link
                to={`/equipment/${item.id}`}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Info className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Info</span>
              </Link>
            </div>
            
            <div className="flex border-t border-gray-50 pt-3 mt-1 justify-between items-center">
              <button 
                onClick={() => handleEdit(item)}
                className="text-xs font-bold text-gray-500 hover:text-gray-900"
              >
                Edit Asset
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredEquipment?.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
             <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
             <p className="text-gray-500 font-medium">No results found.</p>
          </div>
        )}
      </div>
      {showQR && qrItem && (
        <QRCodeGenerator 
          assetTag={qrItem.asset_tag}
          assetName={`${qrItem.manufacturer} ${qrItem.model}`}
          onClose={() => { setShowQR(false); setQrItem(null); }}
        />
      )}

      {isFormOpen && (
        <EquipmentForm
          item={selectedItem}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedItem(null);
          }}
        />
      )}

      {isFuelFormOpen && (
        <FuelLogForm
          onClose={() => {
            setIsFuelFormOpen(false);
            setSelectedItem(null);
          }}
          initialData={{ equipment_id: selectedItem?.id }}
        />
      )}

      {isMaintenanceFormOpen && (
        <MaintenanceForm
          onClose={() => {
            setIsMaintenanceFormOpen(false);
            setSelectedItem(null);
          }}
          initialData={{ equipment_id: selectedItem?.id }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Equipment"
        message="Are you sure you want to delete this equipment? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
