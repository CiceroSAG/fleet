import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../lib/api';
import { 
  LayoutDashboard, Truck, Users, Fuel, Settings, LogOut, 
  ClipboardList, Wrench, AlertTriangle, FileText, Package, 
  Map, Activity, Menu, X, Wifi, WifiOff, PlusCircle, ScanLine, ShieldCheck, Languages, Warehouse,
  Moon, Sun, Circle, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRScanner from './QRScanner';
import DiagnosticsModal from './DiagnosticsModal';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/theme';

import SyncManager from './SyncManager';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { signOut, profile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/equipment', icon: Truck, label: t('fleet') },
    { to: '/workshop', icon: Warehouse, label: t('workshop'), feature: 'maintenance', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/tires', icon: Circle, label: 'Tires', feature: 'maintenance', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/operators', icon: Users, label: t('operators') || 'Operators', roles: ['Admin', 'Manager'] },
    { to: '/fuel', icon: Fuel, label: t('fuel_logs') || 'Fuel Logs', feature: 'fuel_logs', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/parts', icon: Package, label: t('inventory'), feature: 'parts', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/maintenance', icon: ClipboardList, label: t('maintenance'), feature: 'maintenance', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/repairs', icon: Wrench, label: t('repairs') || 'Repairs', feature: 'repairs', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/incidents', icon: AlertTriangle, label: t('incidents') || 'Incidents', feature: 'incidents' },
    { to: '/tracking', icon: Map, label: t('tracking') || 'Real-Time Tracking', feature: 'tracking', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/driver-behavior', icon: Activity, label: t('driver_behavior') || 'Driver Behavior', feature: 'driver_behavior', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/fuel-management', icon: Fuel, label: t('fuel_management') || 'Fuel Management', feature: 'fuel_management', roles: ['Admin', 'Manager'] },
    { to: '/maintenance-scheduling', icon: ClipboardList, label: t('scheduling') || 'Scheduling', feature: 'scheduling', roles: ['Admin', 'Manager'] },
    { to: '/compliance', icon: ShieldCheck, label: 'Compliance Registry', feature: 'compliance', roles: ['Admin', 'Manager', 'Operator'] },
    { to: '/operator-scorecards', icon: Star, label: 'Scorecards', feature: 'driver_behavior', roles: ['Admin', 'Manager'] },
    { to: '/utilization', icon: Activity, label: t('utilization') || 'Utilization', feature: 'utilization', roles: ['Admin', 'Manager'] },
    { to: '/reports', icon: FileText, label: t('reports') || 'Reports', feature: 'reports', roles: ['Admin', 'Manager'] },
    { to: '/field-service-reports', icon: FileText, label: t('field_service_reports') || 'Field Service Reports', feature: 'field_service_reports', roles: ['Admin', 'Manager', 'Technician'] },
    { to: '/inspections', icon: ShieldCheck, label: t('inspections'), feature: 'inspections', roles: ['Admin', 'Manager', 'Operator', 'Technician'] },
    { to: '/users', icon: Users, label: t('user_management') || 'User Management', feature: 'user_management', roles: ['Admin'] },
    { to: '/technicians', icon: Wrench, label: t('technicians') || 'Technicians', feature: 'technicians', roles: ['Admin', 'Manager'] },
    { to: '/settings', icon: Settings, label: t('settings'), roles: ['Admin', 'Manager'] },
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

  const quickActions = [
    { label: 'Log Fuel', icon: Fuel, to: '/fuel', color: 'bg-blue-50 text-blue-600', feature: 'fuel_logs' },
    { label: 'Create Task', icon: PlusCircle, to: '/maintenance-scheduling?action=new', color: 'bg-orange-50 text-orange-600', feature: 'scheduling', roles: ['Admin', 'Manager'] },
    { label: 'Field Report', icon: FileText, to: '/field-service-reports?action=new', color: 'bg-purple-50 text-purple-600', feature: 'field_service_reports', roles: ['Admin', 'Manager', 'Technician'] },
    { label: 'Scan Asset', icon: ScanLine, to: '#scan', color: 'bg-green-50 text-green-600', feature: 'tracking' },
    { label: 'Log Repair', icon: Wrench, to: '/repairs', color: 'bg-red-50 text-red-600', feature: 'maintenance' },
  ].filter(action => {
    if (action.feature && settings?.features && !settings.features[action.feature as keyof typeof settings.features]) return false;
    if (action.roles && profile?.role && !action.roles.includes(profile.role)) return false;
    return true;
  });

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Company Logo" className="h-12 w-auto max-w-[120px] object-contain" />
          ) : (
            <Truck className="w-8 h-8 text-orange-600" />
          )}
          <h1 className="text-xl font-bold text-orange-600">
            <span>{settings?.company_name || 'MineFleet'}</span>
          </h1>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Live
              </div>
            ) : (
              <div className="flex items-center text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                Offline
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsScanning(true)}
              className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
              title="Pulse Scan"
            >
              <ScanLine className="w-4 h-4" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
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
        {deferredPrompt && !isStandalone && (
          <button
            onClick={handleInstall}
            className="flex items-center space-x-3 px-3 py-2 w-full text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold text-left"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Install App</span>
          </button>
        )}
      </nav>
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
        <Languages className="w-4 h-4 text-gray-400" />
        <div className="flex space-x-1">
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-2 py-1 text-[10px] font-black rounded-md transition-all ${i18n.language === 'en' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            EN
          </button>
          <button
            onClick={() => i18n.changeLanguage('fr')}
            className={`px-2 py-1 text-[10px] font-black rounded-md transition-all ${i18n.language === 'fr' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            FR
          </button>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 space-y-1">
        <button
          onClick={() => {
            setIsDiagnosticsOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center space-x-3 px-3 py-2 w-full text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors group"
        >
          <ShieldCheck className="w-5 h-5 text-gray-500 group-hover:text-orange-600" />
          <span className="font-bold text-sm">Diagnostics</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-3 py-2 w-full text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('sign_out') || 'Sign Out'}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-gray-50 text-gray-900'} flex flex-col lg:flex-row transition-colors duration-300`}>
      {/* Mobile Header */}
      <header className={`lg:hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40 pt-safe transition-colors`}>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold text-orange-600 flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span>Faned Fleet</span>
          </h1>
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center text-[10px] text-green-600 font-bold ml-2 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                <Wifi className="w-3 h-3 mr-1" />
                ONLINE
              </div>
            ) : (
              <div className="flex items-center text-[10px] text-red-600 font-bold ml-2 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                <WifiOff className="w-3 h-3 mr-1" />
                OFFLINE
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsScanning(true)}
            className="p-2 text-orange-600 bg-orange-50 dark:bg-orange-950/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors active:scale-95"
            title="Scan Asset QR"
          >
            <ScanLine className="w-5 h-5" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-64 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-r flex-col sticky top-0 h-screen transition-colors`}>
        <NavContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isQuickActionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickActionOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[70] lg:hidden rounded-t-[32px] p-8 pb-safe shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                <button 
                  onClick={() => setIsQuickActionOpen(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                    <Link 
                      key={index}
                      to={action.to === '#scan' ? location.pathname : action.to} 
                      onClick={() => {
                        setIsQuickActionOpen(false);
                        if (action.to === '#scan') setIsScanning(true);
                      }}
                      className={`flex flex-col items-center p-6 ${action.color} rounded-2xl border border-current shadow-sm transition-all active:scale-95`}
                    >
                    <action.icon className="w-8 h-8 mb-3" />
                    <span className="text-sm font-bold text-center leading-tight">{action.label}</span>
                  </Link>
                ))}
                {quickActions.length === 0 && (
                  <p className="col-span-2 py-8 text-center text-gray-500 italic">No quick actions available for your role.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
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

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <QRScanner
            onScan={(tag) => {
              setIsScanning(false);
              // Logic to find equipment and navigate
              // For demo, we navigate to the first equipment that matches or just /equipment
              navigate(`/equipment?search=${tag}`);
            }}
            onClose={() => setIsScanning(false)}
          />
        )}
      </AnimatePresence>

      <DiagnosticsModal 
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet context={{ setIsScanning }} />
        </div>
        <SyncManager />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center py-3 space-y-1 ${location.pathname === '/' ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link
          to="/equipment"
          className={`flex-1 flex flex-col items-center py-3 space-y-1 ${location.pathname.startsWith('/equipment') ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Fleet</span>
        </Link>
        
        <div className="flex-1 flex flex-col items-center -mt-8 relative h-full">
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="w-14 h-14 bg-orange-600 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-white"
          >
            <PlusCircle className="w-8 h-8" />
          </button>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter mt-1">Actions</span>
        </div>

        <Link
          to={profile?.role === 'Technician' ? '/field-service-reports' : '/maintenance'}
          className={`flex-1 flex flex-col items-center py-3 space-y-1 ${(location.pathname === '/field-service-reports' || location.pathname === '/maintenance') ? 'text-orange-600' : 'text-gray-400'}`}
        >
          {profile?.role === 'Technician' ? <FileText className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          <span className="text-[10px] font-bold uppercase tracking-tighter">{profile?.role === 'Technician' ? 'Reports' : 'Service'}</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex-1 flex flex-col items-center py-3 space-y-1 text-gray-400"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
        </button>
      </nav>
    </div>
  );
}
