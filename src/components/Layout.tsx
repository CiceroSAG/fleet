import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../lib/api';
import { 
  LayoutDashboard, Truck, Users, Fuel, Settings, LogOut, 
  ClipboardList, Wrench, AlertTriangle, FileText, Package, 
  Map, Activity, Menu, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/equipment', icon: Truck, label: 'Equipment' },
    { to: '/operators', icon: Users, label: 'Operators', roles: ['Admin', 'Manager'] },
    { to: '/fuel', icon: Fuel, label: 'Fuel Logs', feature: 'fuel_logs', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/parts', icon: Package, label: 'Parts Inventory', feature: 'parts', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/maintenance', icon: ClipboardList, label: 'Maintenance', feature: 'maintenance', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/repairs', icon: Wrench, label: 'Repairs', feature: 'repairs', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/incidents', icon: AlertTriangle, label: 'Incidents', feature: 'incidents' },
    { to: '/tracking', icon: Map, label: 'Real-Time Tracking', feature: 'tracking', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/driver-behavior', icon: Activity, label: 'Driver Behavior', feature: 'driver_behavior', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/fuel-management', icon: Fuel, label: 'Fuel Management', feature: 'fuel_management', roles: ['Admin', 'Manager'] },
    { to: '/maintenance-scheduling', icon: ClipboardList, label: 'Scheduling', feature: 'scheduling', roles: ['Admin', 'Manager'] },
    { to: '/compliance', icon: FileText, label: 'Compliance', feature: 'compliance', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/utilization', icon: Activity, label: 'Utilization', feature: 'utilization', roles: ['Admin', 'Manager'] },
    { to: '/reports', icon: FileText, label: 'Reports', feature: 'reports', roles: ['Admin', 'Manager'] },
    { to: '/field-service-reports', icon: FileText, label: 'Field Service Reports', feature: 'field_service_reports', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/users', icon: Users, label: 'User Management', feature: 'user_management', roles: ['Admin'] },
    { to: '/technicians', icon: Wrench, label: 'Technicians', feature: 'technicians', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['Admin', 'Manager'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    // Check feature flag
    if (item.feature && settings?.features) {
      if (!settings.features[item.feature as keyof typeof settings.features]) return false;
    }
    
    // Check role access
    if (item.roles && profile?.role) {
      if (!item.roles.includes(profile.role)) return false;
    }
    
    return true;
  });

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Company Logo" className="h-12 w-auto max-w-[120px] object-contain" />
          ) : (
            <Truck className="w-8 h-8 text-orange-600" />
          )}
          <h1 className="text-xl font-bold text-orange-600">
            <span>{settings?.company_name || 'MineFleet'}</span>
          </h1>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-orange-50 text-orange-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-3 py-2 w-full text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-bold text-orange-600 flex items-center space-x-2">
          <Truck className="w-5 h-5" />
          <span>Fanned Fleet</span>
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden flex flex-col shadow-xl"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
