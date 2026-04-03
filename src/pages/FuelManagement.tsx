import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Fuel, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface FuelEfficiencyMetric {
  id: string;
  equipment_id: string;
  date: string;
  fuel_consumed: number;
  distance_traveled: number;
  mpg: number;
  cost_per_mile: number;
  idle_time_hours: number;
  idle_fuel_wasted: number;
  equipment: {
    asset_tag: string;
    type: string;
  };
}

export default function FuelManagement() {
  const [metrics, setMetrics] = useState<FuelEfficiencyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    fetchFuelMetrics();
  }, [selectedPeriod]);

  const fetchFuelMetrics = async () => {
    try {
      const days = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('fuel_efficiency_metrics')
        .select(`
          *,
          equipment:equipment_id (
            asset_tag,
            type
          )
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching fuel metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (metrics.length === 0) return null;

    const totalFuel = metrics.reduce((sum, m) => sum + m.fuel_consumed, 0);
    const totalDistance = metrics.reduce((sum, m) => sum + m.distance_traveled, 0);
    const avgMPG = metrics.reduce((sum, m) => sum + m.mpg, 0) / metrics.length;
    const totalIdleFuel = metrics.reduce((sum, m) => sum + m.idle_fuel_wasted, 0);
    const avgCostPerMile = metrics.reduce((sum, m) => sum + m.cost_per_mile, 0) / metrics.length;

    return {
      totalFuel: Math.round(totalFuel * 10) / 10,
      totalDistance: Math.round(totalDistance * 10) / 10,
      avgMPG: Math.round(avgMPG * 10) / 10,
      totalIdleFuel: Math.round(totalIdleFuel * 10) / 10,
      avgCostPerMile: Math.round(avgCostPerMile * 100) / 100,
      fuelEfficiency: Math.round((totalIdleFuel / totalFuel) * 100 * 10) / 10
    };
  }, [metrics]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const groupedByDate = metrics.reduce((acc, metric) => {
      const date = metric.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalFuel: 0,
          totalDistance: 0,
          avgMPG: 0,
          count: 0
        };
      }
      acc[date].totalFuel += metric.fuel_consumed;
      acc[date].totalDistance += metric.distance_traveled;
      acc[date].avgMPG = (acc[date].avgMPG * acc[date].count + metric.mpg) / (acc[date].count + 1);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        avgMPG: Math.round(item.avgMPG * 10) / 10
      }));
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Management & Optimization</h1>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'table'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'chart'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Fuel className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fuel Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFuel} gal</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg MPG</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgMPG}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cost/Mile</p>
                <p className="text-2xl font-bold text-gray-900">${stats.avgCostPerMile}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Idle Fuel Waste</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIdleFuel} gal</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Fuel className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Idle %</p>
                <p className="text-2xl font-bold text-gray-900">{stats.fuelEfficiency}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'chart' ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fuel Efficiency Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="totalFuel" fill="#3B82F6" name="Fuel Used (gal)" />
                <Line yAxisId="right" type="monotone" dataKey="avgMPG" stroke="#10B981" strokeWidth={2} name="Avg MPG" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Fuel Efficiency by Vehicle
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuel Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MPG
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost/Mile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idle Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idle Fuel
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric.equipment?.asset_tag || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(metric.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.fuel_consumed} gal
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.distance_traveled} mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.mpg}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${metric.cost_per_mile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.idle_time_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.idle_fuel_wasted} gal
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {metrics.length === 0 && (
              <p className="text-gray-500 text-center py-8">No fuel efficiency data found for the selected period.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}