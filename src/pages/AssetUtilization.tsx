import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface UtilizationMetric {
  id: string;
  equipment_id: string;
  date: string;
  total_available_hours: number;
  operating_hours: number;
  idle_hours: number;
  maintenance_hours: number;
  utilization_percentage: number;
  revenue_generated: number;
  operating_cost: number;
  equipment: {
    asset_tag: string;
    type: string;
  };
}

export default function AssetUtilization() {
  const [metrics, setMetrics] = useState<UtilizationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');

  useEffect(() => {
    fetchUtilizationMetrics();
  }, [selectedPeriod]);

  const fetchUtilizationMetrics = async () => {
    try {
      const days = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('utilization_metrics')
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
      console.error('Error fetching utilization metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (metrics.length === 0) return null;

    const totalAssets = new Set(metrics.map(m => m.equipment_id)).size;
    const avgUtilization = metrics.reduce((sum, m) => sum + m.utilization_percentage, 0) / metrics.length;
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue_generated, 0);
    const totalOperatingCost = metrics.reduce((sum, m) => sum + m.operating_cost, 0);
    const netProfit = totalRevenue - totalOperatingCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalAssets,
      avgUtilization: Math.round(avgUtilization * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOperatingCost: Math.round(totalOperatingCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10
    };
  }, [metrics]);

  // Prepare chart data
  const utilizationChartData = React.useMemo(() => {
    const groupedByAsset = metrics.reduce((acc, metric) => {
      const assetId = metric.equipment_id;
      const assetTag = metric.equipment?.asset_tag || 'Unknown';

      if (!acc[assetId]) {
        acc[assetId] = {
          asset: assetTag,
          totalUtilization: 0,
          count: 0,
          avgUtilization: 0,
          totalRevenue: 0,
          totalCost: 0
        };
      }

      acc[assetId].totalUtilization += metric.utilization_percentage;
      acc[assetId].count += 1;
      acc[assetId].totalRevenue += metric.revenue_generated;
      acc[assetId].totalCost += metric.operating_cost;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByAsset)
      .map((item: any) => ({
        ...item,
        avgUtilization: Math.round((item.totalUtilization / item.count) * 10) / 10,
        netProfit: Math.round((item.totalRevenue - item.totalCost) * 100) / 100
      }))
      .sort((a: any, b: any) => b.avgUtilization - a.avgUtilization);
  }, [metrics]);

  const timeSeriesData = React.useMemo(() => {
    const groupedByDate = metrics.reduce((acc, metric) => {
      const date = metric.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          avgUtilization: 0,
          totalRevenue: 0,
          totalCost: 0,
          count: 0
        };
      }
      acc[date].avgUtilization = (acc[date].avgUtilization * acc[date].count + metric.utilization_percentage) / (acc[date].count + 1);
      acc[date].totalRevenue += metric.revenue_generated;
      acc[date].totalCost += metric.operating_cost;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        avgUtilization: Math.round(item.avgUtilization * 10) / 10,
        netProfit: Math.round((item.totalRevenue - item.totalCost) * 100) / 100
      }));
  }, [metrics]);

  const utilizationDistribution = React.useMemo(() => {
    const ranges = [
      { name: '0-25%', min: 0, max: 25, count: 0 },
      { name: '26-50%', min: 26, max: 50, count: 0 },
      { name: '51-75%', min: 51, max: 75, count: 0 },
      { name: '76-100%', min: 76, max: 100, count: 0 }
    ];

    metrics.forEach(metric => {
      const utilization = metric.utilization_percentage;
      const range = ranges.find(r => utilization >= r.min && utilization <= r.max);
      if (range) range.count++;
    });

    return ranges.map(range => ({
      name: range.name,
      value: range.count,
      percentage: metrics.length > 0 ? Math.round((range.count / metrics.length) * 100) : 0
    }));
  }, [metrics]);

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

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
        <h1 className="text-2xl font-bold text-gray-900">Asset Utilization Reports</h1>
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
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'chart'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Charts
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgUtilization}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Operating Cost</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalOperatingCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className={`h-8 w-8 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className={`h-8 w-8 ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className={`text-2xl font-bold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.profitMargin}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilization by Asset */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilization by Asset</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="asset" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgUtilization" fill="#3B82F6" name="Avg Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Utilization Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilization Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {utilizationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Series Utilization */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilization Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="avgUtilization" fill="#10B981" name="Avg Utilization %" />
                  <Bar yAxisId="right" dataKey="netProfit" fill="#F59E0B" name="Net Profit ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Asset Utilization Details
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operating Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idle Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operating Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Profit
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
                        <span className={`font-medium ${
                          metric.utilization_percentage >= 75 ? 'text-green-600' :
                          metric.utilization_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {metric.utilization_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.operating_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.idle_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${metric.revenue_generated.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${metric.operating_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          (metric.revenue_generated - metric.operating_cost) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${(metric.revenue_generated - metric.operating_cost).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {metrics.length === 0 && (
              <p className="text-gray-500 text-center py-8">No utilization data found for the selected period.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}