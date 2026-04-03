import React, { useState, useEffect } from 'react';
import { getMaintenanceSchedulesWithUnderMaintenance } from '@/lib/api';
import { Wrench, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface MaintenanceSchedule {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string;
  interval_type: string;
  interval_value: number;
  last_performed: string;
  next_due: string;
  priority: string;
  status: string;
  assigned_to: string;
  estimated_cost: number;
  notes: string;
  equipment: {
    asset_tag: string;
    type: string;
  };
  profiles?: {
    email: string;
  };
}

export default function MaintenanceScheduling() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchMaintenanceSchedules();
  }, [filter]);

  const fetchMaintenanceSchedules = async () => {
    try {
      const data = await getMaintenanceSchedulesWithUnderMaintenance();

      // Apply filters
      let filteredData = data;

      if (filter.status !== 'all') {
        filteredData = filteredData.filter(s => s.status === filter.status);
      }

      if (filter.priority !== 'all') {
        filteredData = filteredData.filter(s => s.priority === filter.priority);
      }

      if (filter.type !== 'all') {
        filteredData = filteredData.filter(s => s.maintenance_type === filter.type);
      }

      setSchedules(filteredData);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleStatus = async (id: string, status: string) => {
    try {
      // Handle equipment under maintenance (they have special IDs)
      if (id.startsWith('under-maintenance-')) {
        const equipmentId = id.replace('under-maintenance-', '');
        // When marking "under maintenance" as completed, change equipment status back to Active
        if (status === 'completed') {
          const { error } = await supabase
            .from('equipment')
            .update({ status: 'Active' })
            .eq('id', equipmentId);

          if (error) throw error;
        }
      } else {
        // Regular maintenance schedule
        const { error } = await supabase
          .from('maintenance_schedules')
          .update({
            status,
            ...(status === 'completed' ? { last_performed: new Date().toISOString() } : {})
          })
          .eq('id', id);

        if (error) throw error;
      }

      fetchMaintenanceSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preventive': return '🛠️';
      case 'predictive': return '📊';
      case 'corrective': return '🔧';
      default: return '⚙️';
    }
  };

  const isOverdue = (nextDue: string) => {
    return new Date(nextDue) < new Date();
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = schedules.length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const overdue = schedules.filter(s => isOverdue(s.next_due) && s.status === 'active').length;
    const dueThisWeek = schedules.filter(s => {
      const nextDue = new Date(s.next_due);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return nextDue <= weekFromNow && nextDue >= new Date() && s.status === 'active';
    }).length;

    return { total, completed, overdue, dueThisWeek };
  }, [schedules]);

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
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Scheduling</h1>
        <button
          onClick={fetchMaintenanceSchedules}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
        >
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dueThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="preventive">Preventive</option>
              <option value="predictive">Predictive</option>
              <option value="corrective">Corrective</option>
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Schedules List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Maintenance Schedules
          </h3>
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No maintenance schedules found.</p>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getTypeIcon(schedule.maintenance_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {schedule.description}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                            {schedule.status.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(schedule.priority)}`}>
                            {schedule.priority.toUpperCase()}
                          </span>
                          {isOverdue(schedule.next_due) && schedule.status === 'active' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {schedule.equipment?.asset_tag || 'Unknown Vehicle'} • {schedule.maintenance_type}
                        </p>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Interval:</span>
                            <span className="ml-1">Every {schedule.interval_value} {schedule.interval_type}</span>
                          </div>
                          <div>
                            <span className="font-medium">Next Due:</span>
                            <span className="ml-1">{new Date(schedule.next_due).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="font-medium">Assigned:</span>
                            <span className="ml-1">{schedule.profiles?.email || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Est. Cost:</span>
                            <span className="ml-1">${schedule.estimated_cost}</span>
                          </div>
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notes:</span> {schedule.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {schedule.status === 'active' && (
                        <button
                          onClick={() => updateScheduleStatus(schedule.id, 'completed')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                      {schedule.status !== 'cancelled' && (
                        <button
                          onClick={() => updateScheduleStatus(schedule.id, 'cancelled')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}