import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, getCategories, createCategory, deleteCategory, uploadLogo } from '../lib/api';
import { Save, Building2, DollarSign, Clock, CheckCircle2, Tag, Plus, Trash2, Upload } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Settings() {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    fuel_price_per_gallon: 0,
    preventive_maintenance_interval: 0,
    currency: 'USD',
    features: {
      fuel_logs: true,
      parts: true,
      maintenance: true,
      repairs: true,
      incidents: true,
      tracking: true,
      driver_behavior: true,
      fuel_management: true,
      scheduling: true,
      compliance: true,
      utilization: true,
      reports: true,
      user_management: true,
      technicians: true,
      field_service_reports: true
    }
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        logo_url: settings.logo_url || '',
        fuel_price_per_gallon: settings.fuel_price_per_gallon || 0,
        preventive_maintenance_interval: settings.preventive_maintenance_interval || 0,
        currency: settings.currency || 'USD',
        features: settings.features || formData.features,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      addCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCategoryMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'company_name' || name === 'currency' || name === 'logo_url' ? value : parseFloat(value) || 0,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature as keyof typeof prev.features]
      }
    }));
  };

  if (settingsLoading || categoriesLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading settings...</div>;
  }

  const featureLabels: Record<string, string> = {
    fuel_logs: 'Fuel Logs',
    parts: 'Parts Inventory',
    maintenance: 'Maintenance',
    repairs: 'Repairs',
    incidents: 'Incidents',
    tracking: 'Real-Time Tracking',
    driver_behavior: 'Driver Behavior',
    fuel_management: 'Fuel Management',
    scheduling: 'Scheduling',
    compliance: 'Compliance',
    utilization: 'Utilization',
    reports: 'Reports',
    user_management: 'User Management',
    technicians: 'Technicians',
    field_service_reports: 'Field Service Reports'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        {showSuccess && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <div className="flex items-center space-x-4">
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Company Logo" className="h-16 w-auto max-w-[160px] object-contain rounded" />
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fleet Configuration */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Fleet Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Price per Unit ({formData.currency})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="fuel_price_per_gallon"
                    value={formData.fuel_price_per_gallon}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PM Interval (Days)
                </label>
                <input
                  type="number"
                  name="preventive_maintenance_interval"
                  value={formData.preventive_maintenance_interval}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">Default interval for preventive maintenance alerts.</p>
              </div>
            </div>
          </div>

          {/* Feature Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Feature Management</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Enable or disable specific modules of the application.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(featureLabels).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.features[key as keyof typeof formData.features]}
                      onChange={() => handleFeatureToggle(key)}
                    />
                    <span
                      className={`${
                        formData.features[key as keyof typeof formData.features] ? 'bg-orange-600' : 'bg-gray-200'
                      } absolute inset-0 rounded-full transition-colors`}
                    />
                    <span
                      className={`${
                        formData.features[key as keyof typeof formData.features] ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{mutation.isPending ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Categories Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Tag className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Equipment Categories</h2>
          </div>
          
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
              className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories?.map((category: any) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group"
              >
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!categories || categories.length === 0) && (
              <p className="col-span-full text-center text-sm text-gray-500 py-4">No categories defined yet.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
