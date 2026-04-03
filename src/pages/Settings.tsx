import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, getCategories, createCategory, deleteCategory } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function Settings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  
  // Settings State
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Category State
  const [newCategory, setNewCategory] = useState('');

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Initialize state when settings load
  useState(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setCurrency(settings.currency || 'USD');
      setLogoUrl(settings.logo_url || '');
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Settings saved successfully!');
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategory('');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      company_name: companyName,
      currency,
      logo_url: logoUrl
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    createCategoryMutation.mutate({ name: newCategory.trim() });
  };

  if (profile?.role !== 'Admin' && profile?.role !== 'Manager') {
    return <div className="p-8 text-center text-red-500">You do not have permission to view this page.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              General & Branding
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Equipment Categories
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                {logoUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img src={logoUrl} alt="Logo Preview" className="h-12 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'categories' && (
            <div>
              <form onSubmit={handleAddCategory} className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">New Category Name</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Crane"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || !newCategory.trim()}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add
                </button>
              </form>

              {loadingCategories ? (
                <div className="text-center py-4 text-gray-500">Loading categories...</div>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {categories?.map((cat: any) => (
                    <li key={cat.id} className="flex items-center justify-between py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this category?')) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  {categories?.length === 0 && (
                    <li className="py-4 text-center text-sm text-gray-500">No categories defined.</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
