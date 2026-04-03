import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, getCategories, createCategory, deleteCategory } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Save, Plus, Trash2, MapPin, Shield, FileCheck, Wrench, Fuel, TrendingUp } from 'lucide-react';

export default function Settings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  
  // Settings State
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Telematics Settings
  const [gpsUpdateInterval, setGpsUpdateInterval] = useState(30); // seconds
  const [speedLimitThreshold, setSpeedLimitThreshold] = useState(65); // mph
  const [idleThreshold, setIdleThreshold] = useState(5); // minutes
  const [enableTelematics, setEnableTelematics] = useState(true);
  
  // Compliance Settings
  const [hosEnabled, setHosEnabled] = useState(true);
  const [dvirEnabled, setDvirEnabled] = useState(true);
  const [maxDrivingHours, setMaxDrivingHours] = useState(11);
  const [maxDutyHours, setMaxDutyHours] = useState(14);
  const [requireDvir, setRequireDvir] = useState(true);
  
  // Maintenance Settings
  const [preventiveMaintenanceInterval, setPreventiveMaintenanceInterval] = useState(90); // days
  const [maintenanceReminderDays, setMaintenanceReminderDays] = useState(7);
  const [autoScheduleMaintenance, setAutoScheduleMaintenance] = useState(true);
  
  // Fuel Settings
  const [fuelEfficiencyTarget, setFuelEfficiencyTarget] = useState(8.0); // mpg
  const [fuelPricePerGallon, setFuelPricePerGallon] = useState(3.50);
  const [trackIdleFuel, setTrackIdleFuel] = useState(true);
  
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
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setCurrency(settings.currency || 'USD');
      setLogoUrl(settings.logo_url || '');
      
      // Telematics settings
      setGpsUpdateInterval(settings.gps_update_interval || 30);
      setSpeedLimitThreshold(settings.speed_limit_threshold || 65);
      setIdleThreshold(settings.idle_threshold || 5);
      setEnableTelematics(settings.enable_telematics !== false);
      
      // Compliance settings
      setHosEnabled(settings.hos_enabled !== false);
      setDvirEnabled(settings.dvir_enabled !== false);
      setMaxDrivingHours(settings.max_driving_hours || 11);
      setMaxDutyHours(settings.max_duty_hours || 14);
      setRequireDvir(settings.require_dvir !== false);
      
      // Maintenance settings
      setPreventiveMaintenanceInterval(settings.preventive_maintenance_interval || 90);
      setMaintenanceReminderDays(settings.maintenance_reminder_days || 7);
      setAutoScheduleMaintenance(settings.auto_schedule_maintenance !== false);
      
      // Fuel settings
      setFuelEfficiencyTarget(settings.fuel_efficiency_target || 8.0);
      setFuelPricePerGallon(settings.fuel_price_per_gallon || 3.50);
      setTrackIdleFuel(settings.track_idle_fuel !== false);
    }
  }, [settings]);

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
      logo_url: logoUrl,
      // Telematics settings
      gps_update_interval: gpsUpdateInterval,
      speed_limit_threshold: speedLimitThreshold,
      idle_threshold: idleThreshold,
      enable_telematics: enableTelematics,
      // Compliance settings
      hos_enabled: hosEnabled,
      dvir_enabled: dvirEnabled,
      max_driving_hours: maxDrivingHours,
      max_duty_hours: maxDutyHours,
      require_dvir: requireDvir,
      // Maintenance settings
      preventive_maintenance_interval: preventiveMaintenanceInterval,
      maintenance_reminder_days: maintenanceReminderDays,
      auto_schedule_maintenance: autoScheduleMaintenance,
      // Fuel settings
      fuel_efficiency_target: fuelEfficiencyTarget,
      fuel_price_per_gallon: fuelPricePerGallon,
      track_idle_fuel: trackIdleFuel
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
          <nav className="-mb-px flex flex-wrap" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              General & Branding
            </button>
            <button
              onClick={() => setActiveTab('telematics')}
              className={`${
                activeTab === 'telematics'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Telematics & GPS
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`${
                activeTab === 'compliance'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Compliance
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`${
                activeTab === 'maintenance'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className={`${
                activeTab === 'fuel'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Fuel & Efficiency
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Categories
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

          {activeTab === 'telematics' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Telematics & GPS Settings</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GPS Update Interval (seconds)</label>
                <input
                  type="number"
                  value={gpsUpdateInterval}
                  onChange={(e) => setGpsUpdateInterval(Number(e.target.value))}
                  min="30"
                  max="3600"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">How often vehicles report their location (30-3600 seconds)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Speed Limit Threshold (mph)</label>
                <input
                  type="number"
                  value={speedLimitThreshold}
                  onChange={(e) => setSpeedLimitThreshold(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Alert when vehicle exceeds this speed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Idle Time Threshold (minutes)</label>
                <input
                  type="number"
                  value={idleThreshold}
                  onChange={(e) => setIdleThreshold(Number(e.target.value))}
                  min="1"
                  max="120"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Alert when vehicle is idle longer than this</p>
              </div>

              <div className="flex items-center">
                <input
                  id="enableTelematics"
                  type="checkbox"
                  checked={enableTelematics}
                  onChange={(e) => setEnableTelematics(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="enableTelematics" className="ml-2 block text-sm text-gray-900">
                  Enable telematics and GPS tracking
                </label>
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

          {activeTab === 'compliance' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Compliance Settings</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Driving Hours per Day</label>
                <input
                  type="number"
                  value={maxDrivingHours}
                  onChange={(e) => setMaxDrivingHours(Number(e.target.value))}
                  min="8"
                  max="14"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">FMCSA regulated maximum driving hours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum On-Duty Hours per Day</label>
                <input
                  type="number"
                  value={maxDutyHours}
                  onChange={(e) => setMaxDutyHours(Number(e.target.value))}
                  min="14"
                  max="16"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">FMCSA regulated maximum on-duty hours</p>
              </div>

              <div className="flex items-center">
                <input
                  id="hosEnabled"
                  type="checkbox"
                  checked={hosEnabled}
                  onChange={(e) => setHosEnabled(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="hosEnabled" className="ml-2 block text-sm text-gray-900">
                  Enable Hours of Service (HOS) tracking
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="dvirEnabled"
                  type="checkbox"
                  checked={dvirEnabled}
                  onChange={(e) => setDvirEnabled(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="dvirEnabled" className="ml-2 block text-sm text-gray-900">
                  Enable Daily Vehicle Inspection Reports (DVIR)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="requireDvir"
                  type="checkbox"
                  checked={requireDvir}
                  onChange={(e) => setRequireDvir(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="requireDvir" className="ml-2 block text-sm text-gray-900">
                  Require DVIR before starting trips
                </label>
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

          {activeTab === 'maintenance' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center mb-4">
                <Wrench className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Maintenance Settings</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preventive Maintenance Interval (days)</label>
                <input
                  type="number"
                  value={preventiveMaintenanceInterval}
                  onChange={(e) => setPreventiveMaintenanceInterval(Number(e.target.value))}
                  min="30"
                  max="365"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">How often to schedule preventive maintenance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maintenance Reminder (days before due)</label>
                <input
                  type="number"
                  value={maintenanceReminderDays}
                  onChange={(e) => setMaintenanceReminderDays(Number(e.target.value))}
                  min="1"
                  max="90"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Alert when maintenance is due within X days</p>
              </div>

              <div className="flex items-center">
                <input
                  id="autoScheduleMaintenance"
                  type="checkbox"
                  checked={autoScheduleMaintenance}
                  onChange={(e) => setAutoScheduleMaintenance(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="autoScheduleMaintenance" className="ml-2 block text-sm text-gray-900">
                  Auto-schedule maintenance based on usage and time
                </label>
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

          {activeTab === 'fuel' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center mb-4">
                <Fuel className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Fuel & Efficiency Settings</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fuel Efficiency Target (MPG)</label>
                <input
                  type="number"
                  value={fuelEfficiencyTarget}
                  onChange={(e) => setFuelEfficiencyTarget(Number(e.target.value))}
                  min="5"
                  max="25"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Target fuel efficiency for fleet</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fuel Price per Gallon ($)</label>
                <input
                  type="number"
                  value={fuelPricePerGallon}
                  onChange={(e) => setFuelPricePerGallon(Number(e.target.value))}
                  min="2"
                  max="10"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">Current fuel price for cost calculations</p>
              </div>

              <div className="flex items-center">
                <input
                  id="trackIdleFuel"
                  type="checkbox"
                  checked={trackIdleFuel}
                  onChange={(e) => setTrackIdleFuel(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="trackIdleFuel" className="ml-2 block text-sm text-gray-900">
                  Track fuel consumption during idle time
                </label>
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
