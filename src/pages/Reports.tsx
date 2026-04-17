import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment, getFuelLogs, getMaintenanceLogs, getIncidents, getOperators, getSettings } from '../lib/api';
import { FileText, Download, PieChart, BarChart3, TrendingUp, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getCurrencySymbol } from '../lib/utils';

export default function Reports() {
  const { data: equipment } = useQuery({ queryKey: ['equipment'], queryFn: getEquipment });
  const { data: fuelLogs } = useQuery({ queryKey: ['fuelLogs'], queryFn: getFuelLogs });
  const { data: maintenance } = useQuery({ queryKey: ['maintenanceLogs'], queryFn: getMaintenanceLogs });
  const { data: incidents } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });
  const { data: operators } = useQuery({ queryKey: ['operators'], queryFn: getOperators });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const currencySymbol = getCurrencySymbol(settings?.currency);

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
      costs[tag] = (costs[tag] || 0) + Number(log.cost || 0);
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
      costs[tag] = (costs[tag] || 0) + Number(log.cost || 0);
    });
    return Object.entries(costs)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [maintenance]);

  const costByCategory = useMemo(() => {
    if (!equipment || (!maintenance && !fuelLogs)) return [];
    const categoryCosts: Record<string, number> = {};
    
    maintenance?.forEach((log: any) => {
      const category = log.equipment?.type || 'Other';
      categoryCosts[category] = (categoryCosts[category] || 0) + Number(log.cost || 0);
    });
    
    fuelLogs?.forEach((log: any) => {
      const category = log.equipment?.type || 'Other';
      categoryCosts[category] = (categoryCosts[category] || 0) + Number(log.cost || 0);
    });
    
    return Object.entries(categoryCosts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipment, maintenance, fuelLogs]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportToPDF = (reportType: string) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Header Design
    doc.setFillColor(249, 115, 22); // Orange-500
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FLEET MANAGEMENT SYSTEM', 105, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportType.toUpperCase()} REPORT`, 105, 28, { align: 'center' });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 10, 50);
    doc.text(`Fleet Summary: Distance: ${totalDistance.toLocaleString()} km | Fuel: ${currencySymbol}${totalFuelCost.toLocaleString()} | Maint: ${currencySymbol}${totalMaintenanceCost.toLocaleString()}`, 10, 56);

    let tableData: any[] = [];
    let columns: string[] = [];

    if (reportType === 'Fleet Utilization') {
      columns = ['Asset Tag', 'Type', 'Status', 'Manufacturer', 'Model', 'Odometer'];
      tableData = equipment?.map(eq => [
        eq.asset_tag,
        eq.type,
        eq.status,
        eq.manufacturer,
        eq.model,
        `${eq.odometer?.toLocaleString()} km`
      ]) || [];
    } else if (reportType === 'Fuel Consumption') {
      columns = ['Date', 'Asset Tag', 'Quantity (L)', 'Cost', 'Odometer'];
      tableData = fuelLogs?.map(log => [
        new Date(log.date).toLocaleDateString(),
        log.equipment?.asset_tag,
        log.quantity,
        `${currencySymbol}${log.cost}`,
        log.odometer_reading
      ]) || [];
    } else if (reportType === 'Maintenance Summary') {
      columns = ['Date', 'Asset Tag', 'Type', 'Cost', 'Status', 'Description'];
      tableData = maintenance?.map(log => [
        new Date(log.date).toLocaleDateString(),
        log.equipment?.asset_tag,
        log.service_type,
        `${currencySymbol}${log.cost}`,
        log.status,
        log.notes || log.description
      ]) || [];
    } else if (reportType === 'Safety & Incidents') {
      columns = ['Date', 'Asset Tag', 'Type', 'Severity', 'Description'];
      tableData = incidents?.map(inc => [
        new Date(inc.date).toLocaleDateString(),
        inc.equipment?.asset_tag,
        inc.type,
        inc.severity,
        inc.description
      ]) || [];
    }

    autoTable(doc, {
      startY: 65,
      head: [columns],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { top: 65 },
    });

    doc.save(`Fleet_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (reportType: string) => {
    let data: any[] = [];
    if (reportType === 'Fleet Utilization') {
      data = equipment || [];
    } else if (reportType === 'Fuel Consumption') {
      data = fuelLogs?.map(log => ({
        Date: new Date(log.date).toLocaleDateString(),
        Asset: log.equipment?.asset_tag,
        Quantity: log.quantity,
        Cost: log.cost,
        Odometer: log.odometer_reading
      })) || [];
    } else if (reportType === 'Maintenance Summary') {
      data = maintenance?.map(log => ({
        Date: new Date(log.date).toLocaleDateString(),
        Asset: log.equipment?.asset_tag,
        Type: log.service_type,
        Cost: log.cost,
        Status: log.status,
        Description: log.notes || log.description
      })) || [];
    } else if (reportType === 'Safety & Incidents') {
      data = incidents?.map(inc => ({
        Date: new Date(inc.date).toLocaleDateString(),
        Asset: inc.equipment?.asset_tag,
        Type: inc.type,
        Severity: inc.severity,
        Description: inc.description
      })) || [];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Fleet_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const reportTypes = [
    { title: 'Fleet Utilization', description: 'Detailed analysis of equipment usage and idle time.', icon: PieChart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Fuel Consumption', description: 'Fuel efficiency and cost analysis across the fleet.', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Maintenance Summary', description: 'Overview of completed and pending service tasks.', icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Safety & Incidents', description: 'Incident reports and safety compliance metrics.', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => exportToPDF('Fleet Summary')}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Summary PDF</span>
          </button>
        </div>
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Total Cost Breakdown by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={costByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
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
                onClick={() => exportToExcel(report.title)}
                className="flex items-center space-x-1 text-sm font-medium text-green-600 hover:text-green-700 px-3 py-1 rounded-md hover:bg-green-50 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => exportToPDF(report.title)}
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
            <p className="text-3xl font-bold text-gray-900 mt-2">{currencySymbol}{totalFuelCost.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total from all fuel logs</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Maintenance Cost</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{currencySymbol}{totalMaintenanceCost.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total from all maintenance logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
