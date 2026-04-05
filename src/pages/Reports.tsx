import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment, getFuelLogs, getMaintenanceLogs, getIncidents, getOperators } from '../lib/api';
import { FileText, Download, PieChart, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Reports() {
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuelLogs'], queryFn: getFuelLogs });
  const { data: maintenance } = useQuery({ queryKey: ['maintenanceLogs'], queryFn: getMaintenanceLogs });
  const { data: incidents } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });

  const reportTypes = [
    { title: 'Fleet Utilization', description: 'Detailed analysis of equipment usage and idle time.', icon: PieChart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Fuel Consumption', description: 'Fuel efficiency and cost analysis across the fleet.', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Maintenance Summary', description: 'Overview of completed and pending service tasks.', icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Safety & Incidents', description: 'Incident reports and safety compliance metrics.', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  const totalDistance = equipment?.reduce((sum, eq) => sum + (eq.odometer || 0), 0) || 0;
  const totalFuelCost = fuelLogs?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;
  const totalMaintenanceCost = maintenance?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;

  // Chart Data Preparation
  const utilizationData = useMemo(() => {
    if (!equipment) return [];
    const counts: Record<string, number> = {};
    equipment.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [equipment]);

  const fuelByEquipment = useMemo(() => {
    if (!fuelLogs) return [];
    const costs: Record<string, number> = {};
    fuelLogs.forEach((log: any) => {
      const tag = log.equipment?.asset_tag || 'Unknown';
      costs[tag] = (costs[tag] || 0) + Number(log.cost);
    });
    return Object.entries(costs)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [fuelLogs]);

  const maintenanceByEquipment = useMemo(() => {
    if (!maintenance) return [];
    const costs: Record<string, number> = {};
    maintenance.forEach((log: any) => {
      const tag = log.equipment?.asset_tag || 'Unknown';
      costs[tag] = (costs[tag] || 0) + Number(log.cost);
    });
    return Object.entries(costs)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [maintenance]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleExport = (type: string) => {
    console.log(`Exporting ${type} report...`);
    alert(`${type} report export started. In a real app, this would download a PDF or Excel file.`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export All Data</span>
        </button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Fleet Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Fuel Cost by Asset (Top 8)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelByEquipment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
                <Tooltip />
                <Bar dataKey="cost" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance Cost by Asset (Top 8)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceByEquipment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div key={report.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`${report.bgColor} p-3 rounded-lg`}>
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-50">
              <button 
                onClick={() => handleExport(report.title)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-all"
              >
                View Details
              </button>
              <button 
                onClick={() => handleExport(report.title)}
                className="flex items-center space-x-1 text-sm font-medium text-orange-600 hover:text-orange-700 px-3 py-1 rounded-md hover:bg-orange-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Fleet Summary (All Time)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Fleet Distance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalDistance.toLocaleString()} km</p>
            <p className="text-xs text-gray-500 mt-1">Based on current odometer readings</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Fuel Spent</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${totalFuelCost.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total from all fuel logs</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Maintenance Cost</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${totalMaintenanceCost.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total from all maintenance logs</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Generated Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { name: 'Q1 Fuel Analysis', date: '2024-03-15', status: 'Completed' },
                { name: 'Annual Safety Audit', date: '2024-03-10', status: 'Completed' },
                { name: 'March Maintenance Log', date: '2024-03-01', status: 'Archived' },
              ].map((report) => (
                <tr key={report.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-orange-600 hover:text-orange-900">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
