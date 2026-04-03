import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Clock, Gauge, Fuel } from 'lucide-react';

interface VehicleLocation {
  id: string;
  equipment_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  odometer: number;
  engine_hours: number;
  fuel_level: number;
  timestamp: string;
  equipment: {
    asset_tag: string;
    type: string;
    assigned_operator_id: string;
    operators?: {
      name: string;
    };
  };
}

export default function RealTimeTracking() {
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestLocations();
    // Set up real-time subscription
    const subscription = supabase
      .channel('vehicle_locations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vehicle_locations'
      }, (payload) => {
        console.log('New location data:', payload);
        fetchLatestLocations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLatestLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select(`
          *,
          equipment:equipment_id (
            asset_tag,
            type,
            assigned_operator_id,
            operators:assigned_operator_id (
              name
            )
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (speed: number, fuelLevel: number) => {
    if (speed > 0) return 'text-green-600';
    if (fuelLevel < 20) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = (speed: number, fuelLevel: number) => {
    if (speed > 0) return 'Moving';
    if (fuelLevel < 20) return 'Low Fuel';
    return 'Stationary';
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Real-Time Vehicle Tracking</h1>
        <button
          onClick={fetchLatestLocations}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(locations.map(l => l.equipment_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Gauge className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Moving</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => l.speed > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Fuel className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Fuel</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => l.fuel_level < 20).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Speed</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.length > 0
                  ? Math.round(locations.reduce((sum, l) => sum + l.speed, 0) / locations.length)
                  : 0} mph
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Vehicle Status
          </h3>
          <div className="space-y-4">
            {locations.map((location) => (
              <div
                key={`${location.equipment_id}-${location.timestamp}`}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedVehicle(
                  selectedVehicle === location.equipment_id ? null : location.equipment_id
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {location.equipment?.asset_tag || 'Unknown Vehicle'}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(location.speed, location.fuel_level) === 'text-green-600' ? 'bg-green-100 text-green-800' : getStatusColor(location.speed, location.fuel_level) === 'text-red-600' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {getStatusText(location.speed, location.fuel_level)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.equipment?.operators?.name || 'Unassigned'} • {location.equipment?.type}
                    </p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Speed:</span>
                        <span className="ml-1 font-medium">{location.speed} mph</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fuel:</span>
                        <span className="ml-1 font-medium">{location.fuel_level}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Odometer:</span>
                        <span className="ml-1 font-medium">{location.odometer?.toLocaleString()} mi</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Update:</span>
                        <span className="ml-1 font-medium">
                          {new Date(location.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                {selectedVehicle === location.equipment_id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Heading:</span>
                        <span className="ml-1 font-medium">{location.heading}°</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Engine Hours:</span>
                        <span className="ml-1 font-medium">{location.engine_hours?.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-1 font-medium">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <span className="ml-1 font-medium">
                          {new Date(location.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}