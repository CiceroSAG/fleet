import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tractor, 
  Users, 
  Fuel, 
  Wrench, 
  Hammer, 
  AlertTriangle,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  MapPin,
  Shield,
  BarChart3,
  Calendar,
  FileCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehicles & Equipment', href: '/equipment', icon: Tractor },
  { name: 'Operators', href: '/operators', icon: Users },
  { name: 'Fuel Logs', href: '/fuel', icon: Fuel },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Repairs', href: '/repairs', icon: Hammer },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Real-Time Tracking', href: '/tracking', icon: MapPin },
  { name: 'Driver Behavior', href: '/driver-behavior', icon: Shield },
  { name: 'Fuel Management', href: '/fuel-management', icon: Fuel },
  { name: 'Maintenance Scheduling', href: '/maintenance-scheduling', icon: Calendar },
  { name: 'Compliance', href: '/compliance', icon: FileCheck },
  { name: 'Asset Utilization', href: '/utilization', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Layout() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter navigation based on role
  const filteredNav = navigation.filter(item => {
    if (item.name === 'Settings') {
      return profile?.role === 'Admin' || profile?.role === 'Manager';
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
        <div className="flex items-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-8 w-auto mr-2 object-contain" />
          ) : (
            <Tractor className="h-6 w-6 text-orange-600 mr-2" />
          )}
          <span className="text-lg font-bold text-gray-900 truncate">{settings?.company_name || 'MineFleet'}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        mobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-200">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-8 w-auto mr-2 object-contain" />
          ) : (
            <Tractor className="h-6 w-6 text-orange-600 mr-2" />
          )}
          <span className="text-lg font-bold text-gray-900 truncate">{settings?.company_name || 'MineFleet'}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500',
                    'flex-shrink-0 -ml-1 mr-3 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Role: {profile?.role || 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            <LogOut className="flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 w-full">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
