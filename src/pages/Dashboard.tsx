import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEquipment, getOperators, getMaintenanceLogs, getFuelLogs, getAssignedMaintenanceSchedules, getFieldServiceReports, getRepairLogs, getMaintenanceSchedules } from '../lib/api';
import { Truck, Users, ClipboardList, Fuel, TrendingUp, BarChart3, PieChart, FileText, ChevronRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import FieldServiceReportForm from '../components/FieldServiceReportForm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function Dashboard() {
  const { profile, session } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });
  const { data: maintenance } = useQuery({ queryKey: ['maintenanceLogs'], queryFn: getMaintenanceLogs });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuelLogs'], queryFn: getFuelLogs });
  const { data: fsr } = useQuery({ queryKey: ['fieldServiceReports'], queryFn: getFieldServiceReports });
  const { data: repairLogs } = useQuery({ queryKey: ['repairLogs'], queryFn: getRepairLogs });
  const { data: schedules } = useQuery({ queryKey: ['maintenanceSchedules'], queryFn: getMaintenanceSchedules });
  const { data: assignedTasks } = useQuery({ 
    queryKey: ['assignedTasks', session?.user?.id], 
    queryFn: () => getAssignedMaintenanceSchedules(session?.user?.id || ''),
    enabled: !!session?.user?.id && profile?.role === 'Technician'
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
      label: 'Total Equipment', 
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
      label: 'Mean Time To Repair', 
      value: `${mttr} hrs`, 
      icon: Clock, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    },
    { 
      label: 'Service Reports', 
      value: fsr?.length || 0, 
      icon: FileText, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50' 
    },
  ];

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

  const COLORS = ['#ea580c', '#2563eb', '#16a34a', '#9333ea', '#dc2626'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Overview</h1>
      </div>

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
                    <button
                      onClick={() => setSelectedSchedule(task)}
                      className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 text-xs font-bold transition-colors"
                    >
                      <span>Submit FSR</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
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

        {/* Recent Equipment */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Equipment</h2>
          <div className="space-y-4">
            {equipment?.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded">
                    <Truck className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.asset_tag}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
            {(!equipment || equipment.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No equipment found</p>
            )}
          </div>
        </div>

        {/* Top Technicians (Admin Only) */}
        {profile?.role === 'Admin' && (
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
