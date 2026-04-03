import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, AlertTriangle, Wrench, Fuel, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getEquipment, getOperators, getFuelLogs, getMaintenanceLogs, getIncidents, getDriverBehaviorEvents } from '@/lib/api';
import { format } from 'date-fns';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  dataFunction: () => Promise<any[]>;
  columns: { key: string; label: string; format?: (value: any) => string }[];
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'equipment',
    name: 'Equipment Report',
    description: 'Complete list of all equipment with status and details',
    icon: BarChart3,
    dataFunction: getEquipment,
    columns: [
      { key: 'asset_tag', label: 'Asset Tag' },
      { key: 'equipment_type', label: 'Type' },
      { key: 'model', label: 'Model' },
      { key: 'status', label: 'Status' },
      { key: 'last_maintenance', label: 'Last Maintenance', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A' },
      { key: 'next_maintenance', label: 'Next Maintenance', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A' }
    ]
  },
  {
    id: 'operators',
    name: 'Operators Report',
    description: 'List of all operators with contact information',
    icon: Users,
    dataFunction: getOperators,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'license_number', label: 'License Number' },
      { key: 'license_expiry', label: 'License Expiry', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A' },
      { key: 'status', label: 'Status' }
    ]
  },
  {
    id: 'fuel',
    name: 'Fuel Usage Report',
    description: 'Fuel consumption and cost analysis',
    icon: Fuel,
    dataFunction: getFuelLogs,
    columns: [
      { key: 'equipment.asset_tag', label: 'Equipment' },
      { key: 'fuel_amount', label: 'Fuel Amount (L)' },
      { key: 'fuel_cost', label: 'Cost ($)' },
      { key: 'odometer_reading', label: 'Odometer' },
      { key: 'date', label: 'Date', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd HH:mm') : 'N/A' }
    ]
  },
  {
    id: 'maintenance',
    name: 'Maintenance Report',
    description: 'Maintenance history and scheduling',
    icon: Wrench,
    dataFunction: getMaintenanceLogs,
    columns: [
      { key: 'date', label: 'Date', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A' },
      { key: 'equipment.asset_tag', label: 'Equipment' },
      { key: 'service_type', label: 'Service Type' },
      { key: 'cost', label: 'Cost ($)' },
      { key: 'notes', label: 'Notes' }
    ]
  },
  {
    id: 'incidents',
    name: 'Incidents Report',
    description: 'Safety incidents and accidents',
    icon: AlertTriangle,
    dataFunction: getIncidents,
    columns: [
      { key: 'equipment.asset_tag', label: 'Equipment' },
      { key: 'incident_type', label: 'Type' },
      { key: 'severity', label: 'Severity' },
      { key: 'description', label: 'Description' },
      { key: 'date', label: 'Date', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A' },
      { key: 'status', label: 'Status' }
    ]
  },
  {
    id: 'driver-behavior',
    name: 'Driver Behavior Report',
    description: 'Driver safety and behavior analytics',
    icon: TrendingUp,
    dataFunction: getDriverBehaviorEvents,
    columns: [
      { key: 'equipment.asset_tag', label: 'Equipment' },
      { key: 'operators.name', label: 'Operator' },
      { key: 'event_type', label: 'Event Type' },
      { key: 'severity', label: 'Severity' },
      { key: 'value', label: 'Value' },
      { key: 'timestamp', label: 'Timestamp', format: (date) => date ? format(new Date(date), 'yyyy-MM-dd HH:mm') : 'N/A' }
    ]
  }
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', selectedReport?.id, dateRange],
    queryFn: async () => {
      if (!selectedReport) return [];
      const data = await selectedReport.dataFunction();
      // Apply date filtering if the data has timestamp/date fields
      return data.filter((item: any) => {
        const itemDate = item.timestamp || item.date_reported || item.date || item.scheduled_date || item.completed_date;
        if (!itemDate) return true;
        const date = new Date(itemDate);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end + 'T23:59:59');
      });
    },
    enabled: !!selectedReport
  });

  const exportToExcel = () => {
    if (!reportData || !selectedReport) return;

    const formattedData = reportData.map((item: any) =>
      selectedReport.columns.reduce((acc, col) => {
        // Handle nested properties like 'equipment.asset_tag'
        const value = col.key.includes('.')
          ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
          : item[col.key];
        acc[col.label] = col.format ? col.format(value) : value;
        return acc;
      }, {} as any)
    );

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedReport.name);
    XLSX.writeFile(wb, `${selectedReport.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!selectedReport) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.text(selectedReport.name, margin, yPosition);
    yPosition += 15;

    // Date range
    pdf.setFontSize(12);
    pdf.text(`Report Period: ${dateRange.start} to ${dateRange.end}`, margin, yPosition);
    yPosition += 10;

    // Generated date
    pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, margin, yPosition);
    yPosition += 20;

    // Data
    if (reportData && reportData.length > 0) {
      pdf.setFontSize(10);

      // Headers
      const colWidth = (pageWidth - 2 * margin) / selectedReport.columns.length;
      selectedReport.columns.forEach((col, index) => {
        pdf.text(col.label, margin + index * colWidth, yPosition);
      });
      yPosition += 10;

      // Data rows
      reportData.forEach((item: any, rowIndex: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        selectedReport.columns.forEach((col, colIndex) => {
          // Handle nested properties like 'equipment.asset_tag'
          const value = col.key.includes('.')
            ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
            : item[col.key];
          const text = String(col.format ? col.format(value) : value || '').substring(0, 20); // Truncate long text
          pdf.text(text, margin + colIndex * colWidth, yPosition);
        });
        yPosition += 8;
      });
    } else {
      pdf.text('No data available for the selected period.', margin, yPosition);
    }

    pdf.save(`${selectedReport.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
            <div className="space-y-3">
              {reportConfigs.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedReport?.id === report.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <report.icon className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          {selectedReport && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Date Range</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={() => refetch()}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h2>
                    <p className="text-sm text-gray-500">{selectedReport.description}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={exportToExcel}
                      disabled={!reportData || reportData.length === 0}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                    <button
                      onClick={exportToPDF}
                      disabled={!reportData || reportData.length === 0}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  </div>
                ) : reportData && reportData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {selectedReport.columns.map((col) => (
                            <th
                              key={col.key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {selectedReport.columns.map((col) => {
                              // Handle nested properties like 'equipment.asset_tag'
                              const value = col.key.includes('.')
                                ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
                                : item[col.key];
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {col.format ? col.format(value) : value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No records found for the selected date range.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a report</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a report from the list to view and export data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}