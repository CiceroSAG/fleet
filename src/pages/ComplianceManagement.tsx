import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getHoursOfService, getDVIRReports } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface HoursOfService {
  id: string;
  operator_id: string;
  date: string;
  on_duty_hours: number;
  driving_hours: number;
  off_duty_hours: number;
  sleeper_berth_hours: number;
  total_hours: number;
  violations: any;
  operators: {
    name: string;
  };
}

interface DVIRReport {
  id: string;
  equipment_id: string;
  operator_id: string;
  report_date: string;
  report_type: string;
  vehicle_condition: string;
  defects_found: any;
  corrective_actions: string;
  signature: string;
  equipment: {
    asset_tag: string;
  };
  operators: {
    name: string;
  };
}

export default function ComplianceManagement() {
  const [hosData, setHosData] = useState<HoursOfService[]>([]);
  const [dvirReports, setDvirReports] = useState<DVIRReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hos' | 'dvir'>('hos');
  const [selectedPeriod, setSelectedPeriod] = useState('7'); // days

  const { data: hosDataQuery, isLoading: hosLoading } = useQuery({
    queryKey: ['hoursOfService', selectedPeriod],
    queryFn: () => getHoursOfService()
  });

  const { data: dvirDataQuery, isLoading: dvirLoading } = useQuery({
    queryKey: ['dvirReports', selectedPeriod],
    queryFn: () => getDVIRReports()
  });

  useEffect(() => {
    if (hosDataQuery) {
      setHosData(hosDataQuery);
    }
  }, [hosDataQuery]);

  useEffect(() => {
    if (dvirDataQuery) {
      setDvirReports(dvirDataQuery);
    }
  }, [dvirDataQuery]);

  useEffect(() => {
    setLoading(hosLoading || dvirLoading);
  }, [hosLoading, dvirLoading]);

  const getViolationStatus = (violations: any) => {
    if (!violations || violations.length === 0) return { status: 'compliant', color: 'text-green-600 bg-green-100' };
    const hasCritical = violations.some((v: any) => v.severity === 'critical');
    if (hasCritical) return { status: 'critical', color: 'text-red-600 bg-red-100' };
    return { status: 'warning', color: 'text-yellow-600 bg-yellow-100' };
  };

  const getVehicleConditionColor = (condition: string) => {
    switch (condition) {
      case 'satisfactory': return 'text-green-600 bg-green-100';
      case 'needs_attention': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_service': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Calculate HoS statistics
  const hosStats = React.useMemo(() => {
    if (hosData.length === 0) return null;

    const totalDrivers = new Set(hosData.map(h => h.operator_id)).size;
    const avgDrivingHours = hosData.reduce((sum, h) => sum + h.driving_hours, 0) / hosData.length;
    const violations = hosData.filter(h => h.violations && h.violations.length > 0).length;
    const complianceRate = ((hosData.length - violations) / hosData.length) * 100;

    return {
      totalDrivers,
      avgDrivingHours: Math.round(avgDrivingHours * 10) / 10,
      violations,
      complianceRate: Math.round(complianceRate * 10) / 10
    };
  }, [hosData]);

  // Calculate DVIR statistics
  const dvirStats = React.useMemo(() => {
    if (dvirReports.length === 0) return null;

    const totalReports = dvirReports.length;
    const satisfactory = dvirReports.filter(r => r.vehicle_condition === 'satisfactory').length;
    const needsAttention = dvirReports.filter(r => r.vehicle_condition === 'needs_attention').length;
    const outOfService = dvirReports.filter(r => r.vehicle_condition === 'out_of_service').length;
    const complianceRate = (satisfactory / totalReports) * 100;

    return {
      totalReports,
      satisfactory,
      needsAttention,
      outOfService,
      complianceRate: Math.round(complianceRate * 10) / 10
    };
  }, [dvirReports]);

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
        <h1 className="text-2xl font-bold text-gray-900">Compliance Management</h1>
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('hos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hos'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hours of Service (HoS)
          </button>
          <button
            onClick={() => setActiveTab('dvir')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dvir'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Driver Vehicle Inspection (DVIR)
          </button>
        </nav>
      </div>

      {/* Statistics Cards */}
      {activeTab === 'hos' && hosStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{hosStats.totalDrivers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Driving Hours</p>
                <p className="text-2xl font-bold text-gray-900">{hosStats.avgDrivingHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Violations</p>
                <p className="text-2xl font-bold text-gray-900">{hosStats.violations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{hosStats.complianceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dvir' && dvirStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{dvirStats.totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfactory</p>
                <p className="text-2xl font-bold text-gray-900">{dvirStats.satisfactory}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900">{dvirStats.needsAttention}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Service</p>
                <p className="text-2xl font-bold text-gray-900">{dvirStats.outOfService}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'hos' ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Hours of Service Records
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On Duty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driving
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Off Duty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sleeper
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hosData.map((record) => {
                    const violationStatus = getViolationStatus(record.violations);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.operators?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.on_duty_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.driving_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.off_duty_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.sleeper_berth_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${violationStatus.color}`}>
                            {violationStatus.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hosData.length === 0 && (
              <p className="text-gray-500 text-center py-8">No HoS records found for the selected period.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              DVIR Reports
            </h3>
            <div className="space-y-4">
              {dvirReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No DVIR reports found for the selected period.</p>
              ) : (
                dvirReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {report.equipment?.asset_tag || 'Unknown Vehicle'}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleConditionColor(report.vehicle_condition)}`}>
                            {report.vehicle_condition.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            {report.report_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Driver: {report.operators?.name || 'Unknown'} • {new Date(report.report_date).toLocaleDateString()}
                        </p>
                        {report.defects_found && report.defects_found.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Defects Found:</p>
                            <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                              {report.defects_found.map((defect: any, index: number) => (
                                <li key={index}>{defect.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {report.corrective_actions && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Corrective Actions:</span> {report.corrective_actions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}