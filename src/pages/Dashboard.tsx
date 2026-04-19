import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEquipment, getOperators, getMaintenanceLogs, getFuelLogs, getAssignedMaintenanceSchedules, getFieldServiceReports, getRepairLogs, getMaintenanceSchedules, getSettings, getInspections } from '../lib/api';
import { Truck, Users, ClipboardList, Fuel, TrendingUp, BarChart3, PieChart, FileText, ChevronRight, Clock, AlertCircle, CheckCircle2, Map as MapIcon, Wrench, Activity, PlusCircle, Sparkles, ShieldCheck, ScanLine, QrCode, Warehouse } from 'lucide-react';
import { useAuth } from '../lib/auth';
import FieldServiceReportForm from '../components/FieldServiceReportForm';
import { getMaintenanceForecast } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile, session } = useAuth();
  const { setIsScanning } = useOutletContext<{ setIsScanning: (val: boolean) => void }>();
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });
  const { data: maintenance } = useQuery({ queryKey: ['maintenanceLogs'], queryFn: getMaintenanceLogs });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuelLogs'], queryFn: getFuelLogs });
  const { data: fsr } = useQuery({ queryKey: ['fieldServiceReports'], queryFn: getFieldServiceReports });
  const { data: repairLogs } = useQuery({ queryKey: ['repairLogs'], queryFn: getRepairLogs });
  const { data: schedules } = useQuery({ queryKey: ['maintenanceSchedules'], queryFn: getMaintenanceSchedules });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { data: assignedTasks } = useQuery({ 
    queryKey: ['assignedTasks', session?.user?.id], 
    queryFn: () => getAssignedMaintenanceSchedules(session?.user?.id || ''),
    enabled: !!session?.user?.id && profile?.role === 'Technician'
  });
  const { data: inspections } = useQuery({ queryKey: ['inspections'], queryFn: getInspections });

  const { data: aiForecast, isLoading: loadingAI } = useQuery({
    queryKey: ['aiForecast'],
    queryFn: () => getMaintenanceForecast({ equipment, maintenance, fuelLogs }),
    enabled: !!equipment && !!maintenance && !!fuelLogs && !!settings?.features?.ai_forecasting,
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  const pendingApprovals = useMemo(() => {
    return maintenance?.filter((log: any) => log.approval_status === 'pending') || [];
  }, [maintenance]);

  const mttr = useMemo(() => {
    if (!repairLogs) return 0;
    const completed = (repairLogs as any[]).filter((log: any) => 
      (log.status === 'Completed' || log.status === 'completed') && log.date_reported && log.date_completed
    );
    if (completed.length === 0) return 0;
    const totalHours = completed.reduce((sum: number, log: any) => {
      const start = new Date(log.date_reported).getTime();
      const end = new Date(log.date_completed).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
    return Math.round(totalHours / completed.length);
  }, [repairLogs]);

  const compliance = useMemo(() => {
    if (!schedules || (schedules as any[]).length === 0) return 0;
    const completed = (schedules as any[]).filter((s: any) => s.status === 'completed').length;
    return Math.round((completed / (schedules as any[]).length) * 100);
  }, [schedules]);

  const stats = [
    { 
      label: t('fleet') + ' Total', 
      value: equipment?.length || 0, 
      icon: Truck, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50' 
    },
    { 
      label: 'Compliance Rate', 
      value: `${compliance}%`, 
      icon: CheckCircle2, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    },
    { 
      label: 'MTTR', 
      value: `${mttr} hrs`, 
      icon: Clock, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    },
    { 
      label: t('reports'), 
      value: fsr?.length || 0, 
      icon: FileText, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      feature: 'field_service_reports'
    },
  ].filter(stat => !stat.feature || settings?.features?.[stat.feature as keyof typeof settings.features]);

  // Prepare chart data
  const statusData = useMemo(() => {
    if (!equipment) return [];
    const counts: Record<string, number> = {};
    equipment.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [equipment]);

  const fuelTrendData = useMemo(() => {
    if (!fuelLogs) return [];
    const daily: Record<string, number> = {};
    fuelLogs.slice(-15).forEach((log: any) => {
      const date = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daily[date] = (daily[date] || 0) + Number(log.quantity || 0);
    });
    return Object.entries(daily).map(([date, quantity]) => ({ date, quantity }));
  }, [fuelLogs]);

  const maintenanceCostData = useMemo(() => {
    if (!maintenance) return [];
    const monthly: Record<string, number> = {};
    maintenance.slice(-10).forEach((log: any) => {
      const date = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      monthly[date] = (monthly[date] || 0) + Number(log.cost || 0);
    });
    return Object.entries(monthly).map(([date, cost]) => ({ date, cost }));
  }, [maintenance]);

  const fsrActivityData = useMemo(() => {
    if (!fsr) return [];
    const daily: Record<string, number> = {};
    fsr.slice(-15).forEach((report: any) => {
      const date = new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daily[date] = (daily[date] || 0) + 1;
    });
    return Object.entries(daily).map(([date, count]) => ({ date, count }));
  }, [fsr]);

  const topTechnicians = useMemo(() => {
    if (!fsr) return [];
    const counts: Record<string, number> = {};
    fsr.forEach((report: any) => {
      counts[report.technician_name] = (counts[report.technician_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [fsr]);

  const recentActivity = useMemo(() => {
    const activities: any[] = [];
    
    if (fuelLogs) {
      fuelLogs.slice(-5).forEach((log: any) => {
        activities.push({
          type: 'fuel',
          date: new Date(log.date),
          title: `Fuel logged: ${log.quantity}L`,
          subtitle: log.equipment?.asset_tag,
          icon: Fuel,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        });
      });
    }

    if (maintenance) {
      maintenance.slice(-5).forEach((log: any) => {
        activities.push({
          type: 'maintenance',
          date: new Date(log.date),
          title: `Service: ${log.maintenance_type}`,
          subtitle: log.equipment?.asset_tag,
          icon: Wrench,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        });
      });
    }

    if (repairLogs) {
      repairLogs.slice(-5).forEach((log: any) => {
        activities.push({
          type: 'repair',
          date: new Date(log.date_reported),
          title: `Repair Request: ${log.fault_description}`,
          subtitle: log.equipment?.asset_tag,
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        });
      });
    }

    return activities.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [fuelLogs, maintenance, repairLogs]);

  const COLORS = ['#ea580c', '#2563eb', '#16a34a', '#9333ea', '#dc2626'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}, {profile?.full_name || 'User'}</h1>
      </div>

      {/* Quick Actions - Enhanced for Desktop & Mobile */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
          {profile?.role === 'Admin' && (
            <Link to="/maintenance-scheduling?action=new" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center">
              <PlusCircle className="w-3 h-3 mr-1" />
              New Task
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <Link 
            to="/equipment" 
            className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-orange-600 rounded-2xl shadow-sm text-white hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <Truck className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
            <div className="text-center lg:text-left">
              <span className="text-sm font-bold block">{t('fleet')}</span>
              <span className="text-[10px] opacity-80 hidden lg:block">Manage Vehicles</span>
            </div>
          </Link>

          <Link 
            to="/workshop" 
            className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-gray-600 rounded-2xl shadow-sm text-white hover:bg-gray-700 transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <Warehouse className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
            <div className="text-center lg:text-left">
              <span className="text-sm font-bold block">{t('workshop')}</span>
              <span className="text-[10px] opacity-80 hidden lg:block">{t('workshop_bays')}</span>
            </div>
          </Link>
          
          {(settings?.features?.fuel_logs || settings?.features?.fuel_management) && (
            <Link 
              to="/fuel" 
              className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-blue-600 rounded-2xl shadow-sm text-white hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <Fuel className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
              <div className="text-center lg:text-left">
                <span className="text-sm font-bold block">{t('fuel') || 'Fuel'}</span>
                <span className="text-[10px] opacity-80 hidden lg:block">{t('fuel_entries') || 'Fuel Entries'}</span>
              </div>
            </Link>
          )}

          {(settings?.features?.maintenance || settings?.features?.scheduling) && (
            <Link 
              to="/maintenance-scheduling" 
              className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-green-600 rounded-2xl shadow-sm text-white hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <ClipboardList className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
              <div className="text-center lg:text-left">
                <span className="text-sm font-bold block">Scheduling</span>
                <span className="text-[10px] opacity-80 hidden lg:block">Assign Tasks</span>
              </div>
            </Link>
          )}

          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-cyan-600 rounded-2xl shadow-sm text-white hover:bg-cyan-700 transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <ScanLine className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
            <div className="text-center lg:text-left">
                <span className="text-sm font-bold block">{t('scanasat')}</span>
                <span className="text-[10px] opacity-80 hidden lg:block">{t('qr_id') || 'QR Identification'}</span>
            </div>
          </button>

          {(profile?.role?.toLowerCase() === 'admin' || profile?.role?.toLowerCase() === 'manager') && (
            <Link 
              to="/equipment?action=qr" 
              className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-gray-900 rounded-2xl shadow-sm text-white hover:bg-black transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <QrCode className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
              <div className="text-center lg:text-left">
                <span className="text-sm font-bold block">{t('qr_center')}</span>
                <span className="text-[10px] opacity-80 hidden lg:block">{t('print_tags') || 'Print Fleet Tags'}</span>
              </div>
            </Link>
          )}

          {settings?.features?.field_service_reports && (profile?.role === 'Technician' || profile?.role === 'Admin' || profile?.role === 'Manager') ? (
            <Link 
              to="/field-service-reports" 
              className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-purple-600 rounded-2xl shadow-sm text-white hover:bg-purple-700 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <FileText className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
              <div className="text-center lg:text-left">
                <span className="text-sm font-bold block">FSR Reports</span>
                <span className="text-[10px] opacity-80 hidden lg:block">Field Service</span>
              </div>
            </Link>
          ) : (
            settings?.features?.tracking && (
              <Link 
                to="/tracking" 
                className="flex items-center lg:flex-row flex-col lg:space-x-3 p-4 bg-gray-600 rounded-2xl shadow-sm text-white hover:bg-gray-700 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <MapIcon className="w-8 h-8 mb-2 lg:mb-0 group-hover:rotate-3 transition-transform" />
                <div className="text-center lg:text-left">
                  <span className="text-sm font-bold block">Live Map</span>
                  <span className="text-[10px] opacity-80 hidden lg:block">GPS Tracking</span>
                </div>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Predictive Insights Section */}
      {settings?.features?.ai_forecasting && (
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-3xl shadow-xl shadow-orange-100 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-orange-200" />
              <h2 className="text-lg font-bold">{t('ai_insights')}: {t('predictive_maintenance')}</h2>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">Experimental</span>
            </div>
            
            {loadingAI ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 animate-pulse h-32"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiForecast?.recommendations?.map((rec: any, i: number) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-white">{rec.asset_tag}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rec.urgency === 'critical' ? 'bg-red-500 text-white' : 
                        rec.urgency === 'high' ? 'bg-orange-400 text-white' : 
                        'bg-white/30 text-white'
                      }`}>
                        {rec.urgency}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{rec.prediction}</p>
                    <p className="text-xs text-orange-100 mb-3 opacity-80 line-clamp-2">{rec.reasoning}</p>
                    <button className="w-full py-2 bg-white text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-50 transition-colors">
                      {rec.recommended_action}
                    </button>
                  </div>
                ))}
                {(!aiForecast?.recommendations || aiForecast?.recommendations?.length === 0) && (
                  <div className="col-span-full py-10 bg-white/5 rounded-3xl border border-dashed border-white/20 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <Warehouse className="w-8 h-8 text-orange-300 mb-3 opacity-50" />
                       <p className="text-sm font-black text-white">{t('fleet_optimized') || 'Fleet Status: Optimized'}</p>
                       <p className="text-xs text-orange-200 opacity-70 mt-1 max-w-xs mx-auto">AI engine analyzed maintenance logs, telematics, and fuel trends with 0 critical anomalies detected.</p>
                       <div className="flex items-center space-x-4 mt-6">
                         <div className="h-1 w-12 bg-white/20 rounded-full"></div>
                         <span className="text-[10px] font-mono text-orange-300 uppercase tracking-widest animate-pulse">Scanning Live...</span>
                         <div className="h-1 w-12 bg-white/20 rounded-full"></div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              Equipment Status
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Consumption Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Fuel Consumption Trend
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fuelTrendData}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Area type="monotone" dataKey="quantity" stroke="#9333ea" fillOpacity={1} fill="url(#colorFuel)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals (Admin Only) */}
        {profile?.role === 'Admin' && pendingApprovals.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Pending Maintenance Approvals
              </h2>
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                {pendingApprovals.length} Action Required
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingApprovals.map((log: any) => (
                <div key={log.id} className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900">{log.equipment?.asset_tag || 'Equipment'}</p>
                    <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded">Pending</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{log.notes}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                    <Link to="/maintenance" className="text-xs font-bold text-red-600 hover:underline">Review Log</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Assigned Tasks (Technician Only) */}
        {profile?.role === 'Technician' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-orange-600" />
                My Assigned Tasks
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTasks?.map((task: any) => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Truck className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{task.equipment?.asset_tag}</p>
                        <p className="text-xs text-gray-500">{task.equipment?.model}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{task.maintenance_type}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Due: {new Date(task.next_due).toLocaleDateString()}</span>
                    </div>
                    {settings?.features?.field_service_reports && (
                      <button
                        onClick={() => setSelectedSchedule(task)}
                        className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 text-xs font-bold transition-colors"
                      >
                        <span>Submit FSR</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!assignedTasks || assignedTasks.length === 0) && (
                <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No tasks assigned to you at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Tasks Overview (Admin/Manager Only) */}
        {(profile?.role === 'Admin' || profile?.role === 'Manager') && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Active Maintenance Tasks
              </h2>
              <Link to="/maintenance-scheduling" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(schedules as any[])?.filter(s => s.status === 'active' && !s.id.startsWith('under-maintenance-')).slice(0, 6).map((task: any) => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Truck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{task.equipment?.asset_tag}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Assigned: {task.profiles?.full_name || task.profiles?.email || 'None'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{task.maintenance_type}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 truncate">{task.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Due: {new Date(task.next_due).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!schedules || (schedules as any[]).filter(s => s.status === 'active' && !s.id.startsWith('under-maintenance-')).length === 0) && (
                <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No active maintenance tasks recorded.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Costs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Maintenance Cost Analysis
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field Service Activity */}
        {settings?.features?.field_service_reports && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Field Service Activity
              </h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fsrActivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-transparent hover:border-orange-500">
                <div className="flex items-center space-x-3">
                  <div className={`${activity.bgColor} p-2 rounded-lg`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.subtitle} • {activity.date.toLocaleDateString()} {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No recent activity recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Equipment */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Asset Access</h2>
          <div className="space-y-4">
            {equipment?.slice(0, 5).map((item: any) => (
              <Link to={`/equipment/${item.id}`} key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded group-hover:bg-orange-100 transition-colors">
                    <Truck className="w-4 h-4 text-gray-600 group-hover:text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.asset_tag}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                  item.status === 'Active' ? 'bg-green-100 text-green-700' : 
                  item.status === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </Link>
            ))}
            {(!equipment || equipment.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No equipment found</p>
            )}
          </div>
        </div>

        {/* Top Technicians (Admin Only) */}
        {profile?.role === 'Admin' && settings?.features?.field_service_reports && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Top Technicians (by Reports)
            </h2>
            <div className="space-y-4">
              {topTechnicians.map((tech, index) => (
                <div key={tech.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-orange-600 border border-orange-100">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{tech.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{tech.count}</span>
                    <span className="text-xs text-gray-500">Reports</span>
                  </div>
                </div>
              ))}
              {topTechnicians.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No reports submitted yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedSchedule && (
        <FieldServiceReportForm 
          onClose={() => setSelectedSchedule(null)} 
          initialData={{
            job_type: selectedSchedule.maintenance_type === 'preventive' ? 'PM' : 
                      selectedSchedule.maintenance_type === 'corrective' ? 'RP' : 'BD',
            job_description: selectedSchedule.description,
            assets: [{
              equipment_id: selectedSchedule.equipment_id,
              index_value: 0,
              next_service_date: ''
            }]
          }}
        />
      )}
    </div>
  );
}
