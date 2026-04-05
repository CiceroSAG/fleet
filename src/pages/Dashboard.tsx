import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment, getOperators, getMaintenanceLogs, getFuelLogs } from '../lib/api';
import { Truck, Users, ClipboardList, Fuel, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart as RePieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function Dashboard() {
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });
  const { data: maintenance } = useQuery({ queryKey: ['maintenanceLogs'], queryFn: getMaintenanceLogs });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuelLogs'], queryFn: getFuelLogs });

  const stats = [
    { 
      label: 'Total Equipment', 
      value: equipment?.length || 0, 
      icon: Truck, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50' 
    },
    { 
      label: 'Active Operators', 
      value: operators?.length || 0, 
      icon: Users, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    },
    { 
      label: 'Maintenance Tasks', 
      value: maintenance?.length || 0, 
      icon: ClipboardList, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    },
    { 
      label: 'Recent Fuel Logs', 
      value: fuelLogs?.length || 0, 
      icon: Fuel, 
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
      daily[date] = (daily[date] || 0) + Number(log.quantity);
    });
    return Object.entries(daily).map(([date, quantity]) => ({ date, quantity }));
  }, [fuelLogs]);

  const maintenanceCostData = useMemo(() => {
    if (!maintenance) return [];
    const monthly: Record<string, number> = {};
    maintenance.slice(-10).forEach((log: any) => {
      const date = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      monthly[date] = (monthly[date] || 0) + Number(log.cost);
    });
    return Object.entries(monthly).map(([date, cost]) => ({ date, cost }));
  }, [maintenance]);

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
      </div>
    </div>
  );
}
