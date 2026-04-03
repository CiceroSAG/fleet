import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSettings } from '@/lib/api';
import { Tractor, AlertTriangle, Fuel, Activity, MapPin, Shield, BarChart3, Calendar, FileCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getCurrencySymbol } from '@/lib/utils';
import { Link } from 'react-router-dom';

const COLORS = ['#22c55e', '#eab308', '#9ca3af', '#ef4444']; // Active, Maintenance, Out of Service, Damaged

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const currencySymbol = getCurrencySymbol(settings?.currency);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return (
    <div className="p-8 max-w-2xl mx-auto mt-8">
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Could not connect to Supabase. Please ensure you have:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Added your Supabase URL and Anon Key to the environment variables.</li>
                <li>Run the provided <code>supabase-schema.sql</code> script in your Supabase SQL Editor.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (!stats) return null;

  const cards = [
    { name: 'Total Equipment', value: stats.totalEquipment, icon: Tractor, color: 'bg-blue-500' },
    { name: 'Active Machines', value: stats.activeEquipment, icon: Activity, color: 'bg-green-500' },
    { name: 'Active Trips', value: stats.activeTrips || 0, icon: MapPin, color: 'bg-purple-500' },
    { name: 'HOS Violations', value: stats.hosViolations || 0, icon: Shield, color: 'bg-red-500' },
    { name: 'Maintenance Due', value: stats.maintenanceDue || 0, icon: AlertTriangle, color: 'bg-yellow-500' },
    { name: 'Avg Fuel Efficiency', value: `${(stats.avgFuelEfficiency || 0).toFixed(1)} MPG`, icon: Fuel, color: 'bg-orange-500' },
  ];

  // Process fuel logs for chart
  const fuelDataMap = new Map();
  stats.fuelLogs.forEach((log: any) => {
    if (!log.date) return;
    const date = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!fuelDataMap.has(date)) {
      fuelDataMap.set(date, { date, quantity: 0, cost: 0 });
    }
    const current = fuelDataMap.get(date);
    current.quantity += Number(log.quantity);
    current.cost += Number(log.cost);
  });
  
  const fuelChartData = Array.from(fuelDataMap.values()).slice(-14); // Last 14 days with data

  // Process maintenance logs for chart
  const maintenanceDataMap = new Map();
  stats.maintenanceLogs.forEach((log: any) => {
    if (!log.date) return;
    const date = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!maintenanceDataMap.has(date)) {
      maintenanceDataMap.set(date, { date, cost: 0 });
    }
    const current = maintenanceDataMap.get(date);
    current.cost += Number(log.cost || 0);
  });

  const maintenanceChartData = Array.from(maintenanceDataMap.values()).slice(-14); // Last 14 days with data

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {stats.overdueEquipment && stats.overdueEquipment.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Maintenance Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{stats.overdueEquipment.length} active vehicles have not had maintenance in over 90 days:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stats.overdueEquipment.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card) => (
          <div key={card.name} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{card.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Fuel Consumption & Cost</h3>
          </div>
          <div className="p-6 h-80">
            {fuelChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No fuel data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#f97316" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantity" name="Quantity (L)" fill="#f97316" />
                  <Bar yAxisId="right" dataKey="cost" name={`Cost (${currencySymbol})`} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Equipment Status</h3>
          </div>
          <div className="p-6 h-80">
            {stats.equipmentStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No equipment data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.equipmentStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Maintenance Costs</h3>
          </div>
          <div className="p-6 h-80">
            {maintenanceChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No maintenance data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintenanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis stroke="#8b5cf6" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cost" name={`Cost (${currencySymbol})`} stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Incidents</h3>
          </div>
          <div className="p-6">
            {stats.recentIncidents.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent incidents reported.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {stats.recentIncidents.map((incident: any) => (
                  <li key={incident.id} className="py-4">
                    <div className="flex space-x-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{incident.type_of_damage}</h3>
                          <p className="text-sm text-gray-500">{new Date(incident.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-gray-500">Severity: {incident.severity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Fleet Management Features */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Advanced Fleet Management</h3>
          <p className="mt-1 text-sm text-gray-500">Access comprehensive fleet management tools</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/tracking"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Real-Time Tracking</h4>
                <p className="text-sm text-gray-500">GPS tracking and telematics</p>
              </div>
            </Link>

            <Link
              to="/driver-behavior"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Driver Behavior</h4>
                <p className="text-sm text-gray-500">Safety monitoring and coaching</p>
              </div>
            </Link>

            <Link
              to="/fuel-management"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Fuel className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Fuel Management</h4>
                <p className="text-sm text-gray-500">Optimization and efficiency tracking</p>
              </div>
            </Link>

            <Link
              to="/maintenance-scheduling"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Maintenance Scheduling</h4>
                <p className="text-sm text-gray-500">Automated scheduling and tracking</p>
              </div>
            </Link>

            <Link
              to="/compliance"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileCheck className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Compliance Management</h4>
                <p className="text-sm text-gray-500">HoS and DVIR reporting</p>
              </div>
            </Link>

            <Link
              to="/utilization"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Asset Utilization</h4>
                <p className="text-sm text-gray-500">Performance and efficiency reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

