import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';

interface DriverBehaviorEvent {
  id: string;
  equipment_id: string;
  operator_id: string;
  event_type: string;
  severity: string;
  value: number;
  location_lat: number;
  location_lng: number;
  timestamp: string;
  equipment: {
    asset_tag: string;
  };
  operators: {
    name: string;
  };
}

export default function DriverBehavior() {
  const [events, setEvents] = useState<DriverBehaviorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    eventType: 'all',
    severity: 'all',
    dateRange: '7' // days
  });

  useEffect(() => {
    fetchDriverBehaviorEvents();
  }, [filter]);

  const fetchDriverBehaviorEvents = async () => {
    try {
      let query = supabase
        .from('driver_behavior_events')
        .select(`
          *,
          equipment:equipment_id (
            asset_tag
          ),
          operators:operator_id (
            name
          )
        `)
        .order('timestamp', { ascending: false });

      // Apply date filter
      if (filter.dateRange !== 'all') {
        const days = parseInt(filter.dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('timestamp', startDate.toISOString());
      }

      // Apply event type filter
      if (filter.eventType !== 'all') {
        query = query.eq('event_type', filter.eventType);
      }

      // Apply severity filter
      if (filter.severity !== 'all') {
        query = query.eq('severity', filter.severity);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching driver behavior events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'speeding': return '🚗';
      case 'harsh_braking': return '🛑';
      case 'rapid_acceleration': return '⚡';
      case 'harsh_cornering': return '🔄';
      case 'idling': return '⏸️';
      default: return '⚠️';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'speeding': return 'Speeding';
      case 'harsh_braking': return 'Harsh Braking';
      case 'rapid_acceleration': return 'Rapid Acceleration';
      case 'harsh_cornering': return 'Harsh Cornering';
      case 'idling': return 'Excessive Idling';
      default: return eventType;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getValueUnit = (eventType: string) => {
    switch (eventType) {
      case 'speeding': return 'mph over limit';
      case 'harsh_braking':
      case 'rapid_acceleration':
      case 'harsh_cornering': return 'g-force';
      case 'idling': return 'minutes';
      default: return '';
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalEvents = events.length;
    const highSeverity = events.filter(e => e.severity === 'high').length;
    const uniqueDrivers = new Set(events.map(e => e.operator_id)).size;
    const avgEventsPerDay = filter.dateRange !== 'all'
      ? totalEvents / parseInt(filter.dateRange)
      : totalEvents / 30; // fallback to monthly average

    return {
      totalEvents,
      highSeverity,
      uniqueDrivers,
      avgEventsPerDay: Math.round(avgEventsPerDay * 10) / 10
    };
  }, [events, filter.dateRange]);

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
        <h1 className="text-2xl font-bold text-gray-900">Driver Behavior & Safety</h1>
        <button
          onClick={fetchDriverBehaviorEvents}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Severity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highSeverity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Events/Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgEventsPerDay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              value={filter.eventType}
              onChange={(e) => setFilter(prev => ({ ...prev, eventType: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Events</option>
              <option value="speeding">Speeding</option>
              <option value="harsh_braking">Harsh Braking</option>
              <option value="rapid_acceleration">Rapid Acceleration</option>
              <option value="harsh_cornering">Harsh Cornering</option>
              <option value="idling">Excessive Idling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Severity</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time Period</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Safety Events
          </h3>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No safety events found for the selected filters.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getEventTypeIcon(event.event_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {getEventTypeLabel(event.event_type)}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.operators?.name || 'Unknown Driver'} • {event.equipment?.asset_tag || 'Unknown Vehicle'}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Value: <strong>{event.value} {getValueUnit(event.event_type)}</strong></span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          {event.location_lat && event.location_lng && (
                            <span>
                              {event.location_lat.toFixed(4)}, {event.location_lng.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
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