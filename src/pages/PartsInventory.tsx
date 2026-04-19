import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPartsInventory, createPart, updatePart, deletePart, getSettings } from '../lib/api';
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit2, Trash2, X, Filter, ShoppingCart, DollarSign, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrencySymbol } from '../lib/utils';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: getPartsInventory
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const currencySymbol = getCurrencySymbol(settings?.currency);

  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    category: 'Mechanical',
    current_stock: 0,
    min_stock: 5,
    unit_price: 0,
    supplier_id: ''
  });

  const createMutation = useMutation({
    mutationFn: createPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsFormOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; part: any }) => updatePart(data.id, data.part),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsFormOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      part_number: '',
      category: 'Mechanical',
      current_stock: 0,
      min_stock: 5,
      unit_price: 0,
      supplier_id: ''
    });
    setEditingPart(null);
  };

  const handleEdit = (part: any) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number,
      category: part.category || 'Mechanical',
      current_stock: part.current_stock,
      min_stock: part.min_stock,
      unit_price: part.unit_price,
      supplier_id: part.supplier_id || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart) {
      updateMutation.mutate({ id: editingPart.id, part: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredInventory = inventory?.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory?.filter((item: any) => item.current_stock <= item.min_stock);
  const totalValue = inventory?.reduce((sum: number, item: any) => sum + (item.current_stock * item.unit_price), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-orange-600" />
            Parts Inventory
          </h1>
          <p className="text-gray-500">Manage spare parts and maintenance supplies</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Part</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total SKUs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inventory?.length || 0}</p>
          <div className="mt-1 flex items-center text-green-600 text-xs font-bold">
            <Activity className="w-3 h-3 mr-1" />
            <span>Active Inventory</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{lowStockItems?.length || 0}</p>
          <div className="mt-1 flex items-center text-red-600 text-xs font-bold">
            <ShoppingCart className="w-3 h-3 mr-1" />
            <span>Requires Action</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currencySymbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center text-gray-500 text-xs font-bold">
            <span>Capital Investment</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wait for AI</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">3</p>
          <div className="mt-1 flex items-center text-blue-600 text-xs font-bold">
            <span>Forecasted Usage</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Low Stock Alert</p>
              <p className="text-xs text-red-700">{lowStockItems.length} items are below their minimum threshold.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm">
            Order Now
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by part name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-4 px-2">Part Details</th>
                <th className="pb-4 px-2">Stock Level</th>
                <th className="pb-4 px-2">Price</th>
                <th className="pb-4 px-2">Value</th>
                <th className="pb-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInventory?.map((item: any) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-all">
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Package className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.part_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        item.current_stock <= item.min_stock ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500'
                      }`} />
                      <span className={`text-sm font-bold ${item.current_stock <= item.min_stock ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.current_stock} pcs
                      </span>
                      <span className="text-[10px] text-gray-400">/ min {item.min_stock}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">
                    {currencySymbol}{(item.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-2 text-sm font-bold text-gray-900">
                    {currencySymbol}{((item.current_stock || 0) * (item.unit_price || 0)).toFixed(2)}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this part?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!filteredInventory || filteredInventory.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p>No parts found in inventory.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Part Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPart ? 'Edit Part' : 'Add New Part'}
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Number / SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.part_number}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Level *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    >
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Tires">Tires</option>
                      <option value="Fluids">Fluids</option>
                      <option value="Cabin">Cabin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 font-sans"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingPart ? 'Update Part' : 'Add Part')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
