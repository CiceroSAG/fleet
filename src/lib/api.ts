import { supabase } from './supabase';

// --- Settings ---
export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
  return data;
}

export async function updateSettings(settings: any) {
  // Check if settings exist
  const existing = await getSettings();
  
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert([settings])
      .select();
    if (error) throw error;
    return data[0];
  }
}

// --- Categories ---
export async function getCategories() {
  const { data, error } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createCategory(category: any) {
  const { data, error } = await supabase
    .from('equipment_categories')
    .insert([category])
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
  if (error) throw error;
}

// --- Equipment ---
export async function getEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      operators (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createEquipment(equipment: any) {
  const { data, error } = await supabase
    .from('equipment')
    .insert([equipment])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateEquipment(id: string, equipment: any) {
  const { data: oldEquipment, error: fetchError } = await supabase
    .from('equipment')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('equipment')
    .update(equipment)
    .eq('id', id)
    .select();
  if (error) throw error;

  // If status changed to "Under Maintenance", create a maintenance log
  if (oldEquipment.status !== 'Under Maintenance' && equipment.status === 'Under Maintenance') {
    try {
      await createMaintenanceLog({
        equipment_id: id,
        date: new Date().toISOString().split('T')[0],
        service_type: 'emergency',
        cost: 0,
        notes: 'Automatic log created when equipment status changed to Under Maintenance'
      });
    } catch (logError) {
      console.error('Error creating maintenance log for status change:', logError);
      // Don't throw error as the equipment update was successful
    }
  }

  return data[0];
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Operators ---
export async function getOperators() {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createOperator(operator: any) {
  const { data, error } = await supabase
    .from('operators')
    .insert([operator])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateOperator(id: string, operator: any) {
  const { data, error } = await supabase
    .from('operators')
    .update(operator)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteOperator(id: string) {
  const { error } = await supabase
    .from('operators')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Fuel Logs ---
export async function getFuelLogs() {
  const { data, error } = await supabase
    .from('fuel_logs')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFuelLog(log: any) {
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert([log])
    .select();
  if (error) throw error;

  // Calculate fuel efficiency after creating log
  if (data && data[0]) {
    await calculateFuelEfficiencyFromFuelLog(data[0].id);
  }

  return data[0];
}

export async function updateFuelLog(id: string, log: any) {
  const { data, error } = await supabase
    .from('fuel_logs')
    .update(log)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteFuelLog(id: string) {
  const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Maintenance Logs ---
export async function getMaintenanceLogs() {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createMaintenanceLog(log: any) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert([log])
    .select();
  if (error) throw error;

  // Update maintenance schedule after creating log
  if (data && data[0]) {
    await updateMaintenanceScheduleFromLog(data[0].id);
  }

  return data[0];
}

export async function updateMaintenanceLog(id: string, log: any) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(log)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteMaintenanceLog(id: string) {
  const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Repair Logs ---
export async function getRepairLogs() {
  const { data, error } = await supabase
    .from('repair_logs')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date_reported', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRepairLog(log: any) {
  const { data, error } = await supabase
    .from('repair_logs')
    .insert([log])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateRepairLog(id: string, log: any) {
  const { data, error } = await supabase
    .from('repair_logs')
    .update(log)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteRepairLog(id: string) {
  const { error } = await supabase.from('repair_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Incidents ---
export async function getIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createIncident(incident: any) {
  const { data, error } = await supabase
    .from('incidents')
    .insert([incident])
    .select();
  if (error) throw error;

  // Create notification for admins about new incident
  const admins = await getAdminProfiles();
  for (const admin of admins) {
    await createNotification({
      user_id: admin.id,
      type: 'incident',
      title: 'New Incident Reported',
      message: `A new incident has been reported for equipment ${incident.equipment_id}`,
      related_id: data[0].id,
      related_table: 'incidents'
    });
  }

  return data[0];
}

export async function updateIncident(id: string, incident: any) {
  const { data, error } = await supabase
    .from('incidents')
    .update(incident)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteIncident(id: string) {
  const { error } = await supabase.from('incidents').delete().eq('id', id);
  if (error) throw error;
}

// --- Advanced Fleet Management CRUD Operations ---

// Vehicle Locations (Real-Time Tracking)
export async function getVehicleLocations(limit = 100) {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .select(`
      *,
      equipment (
        asset_tag,
        type,
        assigned_operator_id,
        operators:assigned_operator_id (
          name
        )
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getVehicleLocationsByEquipment(equipmentId: string, limit = 50) {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function createVehicleLocation(location: any) {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .insert([location])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateVehicleLocation(id: string, location: any) {
  const { data, error } = await supabase
    .from('vehicle_locations')
    .update(location)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteVehicleLocation(id: string) {
  const { error } = await supabase.from('vehicle_locations').delete().eq('id', id);
  if (error) throw error;
}

// Driver Behavior Events
export async function getDriverBehaviorEvents(limit = 100) {
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .select(`
      *,
      equipment (
        asset_tag
      ),
      operators:operator_id (
        name
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getDriverBehaviorByOperator(operatorId: string, limit = 50) {
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .select('*')
    .eq('operator_id', operatorId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function createDriverBehaviorEvent(event: any) {
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .insert([event])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateDriverBehaviorEvent(id: string, event: any) {
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .update(event)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteDriverBehaviorEvent(id: string) {
  const { error } = await supabase.from('driver_behavior_events').delete().eq('id', id);
  if (error) throw error;
}

// Routes
export async function getRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      profiles:created_by (
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRoute(route: any) {
  const { data, error } = await supabase
    .from('routes')
    .insert([route])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateRoute(id: string, route: any) {
  const { data, error } = await supabase
    .from('routes')
    .update(route)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteRoute(id: string) {
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error) throw error;
}

// Trips
export async function getTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      ),
      operators:operator_id (
        name
      ),
      routes:route_id (
        name
      )
    `)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTripsByOperator(operatorId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      ),
      routes:route_id (
        name
      )
    `)
    .eq('operator_id', operatorId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTrip(trip: any) {
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateTrip(id: string, trip: any) {
  const { data, error } = await supabase
    .from('trips')
    .update(trip)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteTrip(id: string) {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

// Hours of Service
export async function getHoursOfService(operatorId?: string) {
  let query = supabase
    .from('hours_of_service')
    .select(`
      *,
      operators:operator_id (
        name
      )
    `)
    .order('date', { ascending: false });

  if (operatorId) {
    query = query.eq('operator_id', operatorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createHoursOfService(hos: any) {
  const { data, error } = await supabase
    .from('hours_of_service')
    .insert([hos])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateHoursOfService(id: string, hos: any) {
  const { data, error } = await supabase
    .from('hours_of_service')
    .update(hos)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteHoursOfService(id: string) {
  const { error } = await supabase.from('hours_of_service').delete().eq('id', id);
  if (error) throw error;
}

// DVIR Reports
export async function getDVIRReports() {
  const { data, error } = await supabase
    .from('dvir_reports')
    .select(`
      *,
      equipment (
        asset_tag
      ),
      operators:operator_id (
        name
      )
    `)
    .order('report_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDVIRByOperator(operatorId: string) {
  const { data, error } = await supabase
    .from('dvir_reports')
    .select(`
      *,
      equipment (
        asset_tag
      )
    `)
    .eq('operator_id', operatorId)
    .order('report_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDVIRReport(report: any) {
  const { data, error } = await supabase
    .from('dvir_reports')
    .insert([report])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateDVIRReport(id: string, report: any) {
  const { data, error } = await supabase
    .from('dvir_reports')
    .update(report)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteDVIRReport(id: string) {
  const { error } = await supabase.from('dvir_reports').delete().eq('id', id);
  if (error) throw error;
}

// Maintenance Schedules
export async function getMaintenanceSchedules() {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      ),
      profiles:assigned_to (
        email
      )
    `)
    .order('next_due', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMaintenanceSchedulesByEquipment(equipmentId: string) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      profiles:assigned_to (
        email
      )
    `)
    .eq('equipment_id', equipmentId)
    .order('next_due', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createMaintenanceSchedule(schedule: any) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert([schedule])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateMaintenanceSchedule(id: string, schedule: any) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .update(schedule)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteMaintenanceSchedule(id: string) {
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id);
  if (error) throw error;
}

// Fuel Efficiency Metrics
export async function getFuelEfficiencyMetrics(limit = 100) {
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getFuelEfficiencyByEquipment(equipmentId: string, limit = 30) {
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function createFuelEfficiencyMetric(metric: any) {
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .insert([metric])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateFuelEfficiencyMetric(id: string, metric: any) {
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .update(metric)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteFuelEfficiencyMetric(id: string) {
  const { error } = await supabase.from('fuel_efficiency_metrics').delete().eq('id', id);
  if (error) throw error;
}

// Utilization Metrics
export async function getUtilizationMetrics(limit = 100) {
  const { data, error } = await supabase
    .from('utilization_metrics')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUtilizationByEquipment(equipmentId: string, limit = 30) {
  const { data, error } = await supabase
    .from('utilization_metrics')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function createUtilizationMetric(metric: any) {
  const { data, error } = await supabase
    .from('utilization_metrics')
    .insert([metric])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateUtilizationMetric(id: string, metric: any) {
  const { data, error } = await supabase
    .from('utilization_metrics')
    .update(metric)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteUtilizationMetric(id: string) {
  const { error } = await supabase.from('utilization_metrics').delete().eq('id', id);
  if (error) throw error;
}

// --- Integration Functions ---

// Auto-calculate fuel efficiency when fuel log is created/updated
export async function calculateFuelEfficiencyFromFuelLog(fuelLogId: string) {
  try {
    // Get the fuel log with equipment details
    const { data: fuelLog, error: fuelError } = await supabase
      .from('fuel_logs')
      .select(`
        *,
        equipment:equipment_id (
          id,
          asset_tag,
          type
        )
      `)
      .eq('id', fuelLogId)
      .single();

    if (fuelError || !fuelLog) return;

    // Get settings for fuel price
    const settings = await getSettings();
    const fuelPrice = settings?.fuel_price_per_gallon || 3.50;

    // Calculate MPG (simplified - in real app, you'd track distance per fuel fill)
    // For now, we'll use a basic calculation based on equipment type
    const baseMPG = fuelLog.equipment.type === 'Light Vehicle' ? 25 :
                   fuelLog.equipment.type === 'Dump Truck' ? 8 :
                   fuelLog.equipment.type === 'Excavator' ? 12 : 15;

    const mpg = baseMPG * (Math.random() * 0.4 + 0.8); // Add some variation
    const costPerMile = (fuelLog.price_per_gallon * fuelLog.gallons) / (fuelLog.odometer_end - fuelLog.odometer_start);

    // Create or update fuel efficiency metric
    const metricData = {
      equipment_id: fuelLog.equipment_id,
      date: fuelLog.date,
      fuel_consumed: fuelLog.gallons,
      distance_traveled: fuelLog.odometer_end - fuelLog.odometer_start,
      mpg: mpg,
      cost_per_mile: costPerMile,
      idle_time_hours: 0, // Would need GPS data for this
      idle_fuel_wasted: 0
    };

    // Check if metric already exists for this equipment and date
    const { data: existing } = await supabase
      .from('fuel_efficiency_metrics')
      .select('id')
      .eq('equipment_id', fuelLog.equipment_id)
      .eq('date', fuelLog.date)
      .single();

    if (existing) {
      await updateFuelEfficiencyMetric(existing.id, metricData);
    } else {
      await createFuelEfficiencyMetric(metricData);
    }

    return metricData;
  } catch (error) {
    console.error('Error calculating fuel efficiency:', error);
  }
}

// Auto-create maintenance schedule based on utilization
export async function createMaintenanceFromUtilization(equipmentId: string, utilizationPercentage: number) {
  try {
    const settings = await getSettings();
    const highUtilizationThreshold = 85; // Could be configurable

    if (utilizationPercentage >= highUtilizationThreshold) {
      // Check if maintenance schedule already exists
      const { data: existing } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .eq('equipment_id', equipmentId)
        .eq('maintenance_type', 'preventive')
        .eq('status', 'active')
        .single();

      if (!existing) {
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + (settings?.preventive_maintenance_interval || 90));

        await createMaintenanceSchedule({
          equipment_id: equipmentId,
          maintenance_type: 'preventive',
          description: 'High utilization preventive maintenance',
          interval_type: 'days',
          interval_value: settings?.preventive_maintenance_interval || 90,
          next_due: nextDue.toISOString(),
          priority: 'high',
          status: 'active',
          notes: `Auto-scheduled due to high utilization (${utilizationPercentage}%)`
        });
      }
    }
  } catch (error) {
    console.error('Error creating maintenance from utilization:', error);
  }
}

// Auto-update HOS violations based on driver behavior
export async function checkDriverBehaviorForHOSViolations(operatorId: string, eventType: string, severity: string) {
  try {
    if (eventType === 'speeding' && severity === 'high') {
      // Get today's HOS record
      const today = new Date().toISOString().split('T')[0];
      const { data: hosRecord } = await supabase
        .from('hours_of_service')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('date', today)
        .single();

      if (hosRecord) {
        const violations = hosRecord.violations || [];
        violations.push({
          type: 'speeding_violation',
          timestamp: new Date().toISOString(),
          severity: 'high',
          description: 'High severity speeding event detected'
        });

        await updateHoursOfService(hosRecord.id, {
          violations: violations
        });
      }
    }
  } catch (error) {
    console.error('Error checking HOS violations:', error);
  }
}

// Auto-calculate utilization metrics from GPS and maintenance data
export async function calculateUtilizationFromGPS(equipmentId: string, date: string) {
  try {
    // Get GPS data for the day
    const { data: locations } = await supabase
      .from('vehicle_locations')
      .select('*')
      .eq('equipment_id', equipmentId)
      .gte('timestamp', `${date}T00:00:00`)
      .lt('timestamp', `${date}T23:59:59`)
      .order('timestamp');

    if (!locations || locations.length === 0) return;

    // Calculate operating hours from GPS data
    let operatingHours = 0;
    let lastTimestamp = null;

    locations.forEach(location => {
      if (lastTimestamp && location.speed > 0) {
        const timeDiff = (new Date(location.timestamp).getTime() - new Date(lastTimestamp).getTime()) / (1000 * 60 * 60);
        operatingHours += Math.min(timeDiff, 1); // Cap at 1 hour per interval
      }
      lastTimestamp = location.timestamp;
    });

    // Get maintenance hours for the day
    const { data: maintenanceLogs } = await supabase
      .from('maintenance_logs')
      .select('hours_worked')
      .eq('equipment_id', equipmentId)
      .eq('date', date);

    const maintenanceHours = maintenanceLogs?.reduce((sum, log) => sum + (log.hours_worked || 0), 0) || 0;

    const totalAvailableHours = 24;
    const idleHours = Math.max(0, totalAvailableHours - operatingHours - maintenanceHours);
    const utilizationPercentage = (operatingHours / totalAvailableHours) * 100;

    const utilizationData = {
      equipment_id: equipmentId,
      date: date,
      total_available_hours: totalAvailableHours,
      operating_hours: operatingHours,
      idle_hours: idleHours,
      maintenance_hours: maintenanceHours,
      utilization_percentage: utilizationPercentage
    };

    // Check if utilization metric already exists
    const { data: existing } = await supabase
      .from('utilization_metrics')
      .select('id')
      .eq('equipment_id', equipmentId)
      .eq('date', date)
      .single();

    if (existing) {
      await updateUtilizationMetric(existing.id, utilizationData);
    } else {
      await createUtilizationMetric(utilizationData);
    }

    // Auto-create maintenance if utilization is high
    await createMaintenanceFromUtilization(equipmentId, utilizationPercentage);

    return utilizationData;
  } catch (error) {
    console.error('Error calculating utilization:', error);
  }
}

// Auto-create trip from GPS tracking
export async function createTripFromGPS(equipmentId: string, startTime: string, endTime: string) {
  try {
    // Get GPS data for the trip period
    const { data: locations } = await supabase
      .from('vehicle_locations')
      .select('*')
      .eq('equipment_id', equipmentId)
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .order('timestamp');

    if (!locations || locations.length < 2) return;

    const startLocation = locations[0];
    const endLocation = locations[locations.length - 1];

    // Calculate distance (simplified - would use proper distance calculation)
    const distance = Math.abs(endLocation.odometer - startLocation.odometer) || 10; // fallback

    // Calculate fuel used (simplified)
    const fuelUsed = distance / 10; // Assume 10 MPG average

    // Get assigned operator
    const { data: equipment } = await supabase
      .from('equipment')
      .select('assigned_operator_id')
      .eq('id', equipmentId)
      .single();

    const tripData = {
      equipment_id: equipmentId,
      operator_id: equipment?.assigned_operator_id,
      start_time: startTime,
      end_time: endTime,
      start_location_lat: startLocation.latitude,
      start_location_lng: startLocation.longitude,
      end_location_lat: endLocation.latitude,
      end_location_lng: endLocation.longitude,
      distance_traveled: distance,
      fuel_used: fuelUsed,
      status: 'completed'
    };

    await createTrip(tripData);

    // Update fuel efficiency metrics
    const date = new Date(startTime).toISOString().split('T')[0];
    await calculateUtilizationFromGPS(equipmentId, date);

    return tripData;
  } catch (error) {
    console.error('Error creating trip from GPS:', error);
  }
}

// Auto-update maintenance schedule when maintenance log is created
export async function updateMaintenanceScheduleFromLog(maintenanceLogId: string) {
  try {
    // Get the maintenance log with equipment details
    const { data: maintenanceLog, error: logError } = await supabase
      .from('maintenance_logs')
      .select(`
        *,
        equipment:equipment_id (
          id,
          asset_tag
        )
      `)
      .eq('id', maintenanceLogId)
      .single();

    if (logError || !maintenanceLog) return;

    // Find the corresponding maintenance schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('equipment_id', maintenanceLog.equipment_id)
      .eq('maintenance_type', maintenanceLog.maintenance_type || 'preventive')
      .eq('status', 'active')
      .single();

    if (scheduleError || !schedule) {
      // No active schedule found, create one if this was preventive maintenance
      if (maintenanceLog.maintenance_type === 'preventive' || !maintenanceLog.maintenance_type) {
        const settings = await getSettings();
        const nextDue = new Date(maintenanceLog.date);
        nextDue.setDate(nextDue.getDate() + (settings?.preventive_maintenance_interval || 90));

        await createMaintenanceSchedule({
          equipment_id: maintenanceLog.equipment_id,
          maintenance_type: 'preventive',
          description: 'Preventive maintenance schedule',
          interval_type: 'days',
          interval_value: settings?.preventive_maintenance_interval || 90,
          next_due: nextDue.toISOString(),
          last_completed: maintenanceLog.date,
          priority: 'medium',
          status: 'active',
          notes: `Auto-created from maintenance log on ${maintenanceLog.date}`
        });
      }
      return;
    }

    // Update the schedule with new next due date and last completed
    const nextDue = new Date(maintenanceLog.date);
    if (schedule.interval_type === 'days') {
      nextDue.setDate(nextDue.getDate() + schedule.interval_value);
    } else if (schedule.interval_type === 'hours') {
      // For hours-based, we'd need to track equipment hours - simplified for now
      nextDue.setDate(nextDue.getDate() + Math.ceil(schedule.interval_value / 8)); // Assume 8 hours/day
    } else if (schedule.interval_type === 'miles') {
      // For miles-based, we'd need odometer readings - simplified for now
      nextDue.setDate(nextDue.getDate() + 30); // Default to 30 days
    }

    await updateMaintenanceSchedule(schedule.id, {
      last_completed: maintenanceLog.date,
      next_due: nextDue.toISOString(),
      status: 'active' // Reset to active after completion
    });

  } catch (error) {
    console.error('Error updating maintenance schedule from log:', error);
  }
}

// Get dashboard summary with integrated data
export async function getDashboardSummary() {
  try {
    const [equipment, operators, fuelLogs, maintenanceLogs, incidents, locations, trips, hosRecords, dvirReports] = await Promise.all([
      getEquipment(),
      getOperators(),
      getFuelLogs(),
      getMaintenanceLogs(),
      getIncidents(),
      getVehicleLocations(10),
      getTrips(),
      getHoursOfService(),
      getDVIRReports()
    ]);

    // Calculate summary metrics
    const totalEquipment = equipment?.length || 0;
    const activeEquipment = equipment?.filter(e => e.status === 'Active').length || 0;
    const totalOperators = operators?.length || 0;
    const activeTrips = trips?.filter(t => t.status === 'in_progress').length || 0;

    // Calculate fuel efficiency average
    const recentFuelLogs = fuelLogs?.slice(0, 10) || [];
    const avgFuelEfficiency = recentFuelLogs.length > 0
      ? recentFuelLogs.reduce((sum, log) => sum + (log.mpg || 15), 0) / recentFuelLogs.length
      : 0;

    // Check for maintenance due
    const maintenanceDue = maintenanceLogs?.filter(log => {
      const dueDate = new Date(log.next_service_due);
      return dueDate <= new Date();
    }).length || 0;

    // Check for HOS violations
    const hosViolations = hosRecords?.filter(record =>
      record.violations && record.violations.length > 0
    ).length || 0;

    return {
      totalEquipment,
      activeEquipment,
      totalOperators,
      activeTrips,
      avgFuelEfficiency,
      maintenanceDue,
      hosViolations,
      recentLocations: locations,
      recentIncidents: incidents?.slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    return {};
  }
}

// --- Equipment Details (Audit Trail) ---
export async function getEquipmentDetails(id: string) {
  const [equipment, fuel, maintenance, repairs, incidents] = await Promise.all([
    supabase.from('equipment').select('*, operators(name)').eq('id', id).single(),
    supabase.from('fuel_logs').select('*').eq('equipment_id', id).order('date', { ascending: false }),
    supabase.from('maintenance_logs').select('*').eq('equipment_id', id).order('date', { ascending: false }),
    supabase.from('repair_logs').select('*').eq('equipment_id', id).order('date_reported', { ascending: false }),
    supabase.from('incidents').select('*').eq('equipment_id', id).order('date', { ascending: false }),
  ]);

  if (equipment.error) throw equipment.error;

  return {
    equipment: equipment.data,
    fuel: fuel.data || [],
    maintenance: maintenance.data || [],
    repairs: repairs.data || [],
    incidents: incidents.data || []
  };
}

// --- Dashboard ---
export async function getDashboardStats() {
  // Use the integrated summary function for better cross-feature data
  const summary = await getDashboardSummary();

  // Get additional dashboard-specific data
  const [equipmentRes, incidentsRes, fuelRes, maintenanceRes, allMaintRes] = await Promise.all([
    supabase.from('equipment').select('id, asset_tag, status', { count: 'exact' }),
    supabase.from('incidents').select('*').order('date', { ascending: false }).limit(5),
    supabase.from('fuel_logs').select('quantity, cost, date'),
    supabase.from('maintenance_logs').select('cost, date'),
    supabase.from('maintenance_logs').select('equipment_id, date').order('date', { ascending: false })
  ]);

  if (equipmentRes.error) throw equipmentRes.error;

  const equipment = equipmentRes.data || [];
  const statusCounts: Record<string, number> = {
    'Active': 0,
    'Under Maintenance': 0,
    'Out of Service': 0,
    'Damaged': 0
  };

  equipment.forEach(e => {
    if (statusCounts[e.status] !== undefined) {
      statusCounts[e.status]++;
    }
  });

  const equipmentStatusData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  const fuelLogs = fuelRes.data || [];
  const totalFuelQuantity = fuelLogs.reduce((sum, log) => sum + Number(log.quantity), 0);
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);

  // Calculate Overdue Maintenance (no maintenance in last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const latestMaintenanceMap = new Map();
  (allMaintRes.data || []).forEach((log: any) => {
    if (!latestMaintenanceMap.has(log.equipment_id)) {
      latestMaintenanceMap.set(log.equipment_id, new Date(log.date));
    }
  });

  const overdueEquipment = equipment.filter(e => {
    if (e.status !== 'Active') return false; // Only care about active equipment
    const lastMaint = latestMaintenanceMap.get(e.id);
    if (!lastMaint) return true; // Never had maintenance
    return lastMaint < ninetyDaysAgo;
  }).map(e => e.asset_tag);

  // Create notifications for overdue maintenance
  await createMaintenanceOverdueNotifications(overdueEquipment);

  // Merge with integrated summary data
  return {
    ...summary,
    maintenanceEquipment: summary.maintenanceDue || 0,
    totalFuelQuantity,
    totalFuelCost,
    recentIncidents: summary.recentIncidents || incidentsRes.data || [],
    fuelLogs,
    maintenanceLogs: maintenanceRes.data || [],
    equipmentStatusData,
    overdueEquipment
  };
}

export async function getEquipmentUnderMaintenance() {
  const { data, error } = await supabase
    .from('equipment')
    .select('id, asset_tag, type, manufacturer, model, current_location')
    .eq('status', 'Under Maintenance')
    .order('asset_tag');
  if (error) throw error;
  return data;
}

export async function getMaintenanceSchedulesWithUnderMaintenance() {
  // Get both scheduled maintenance and equipment under maintenance
  const [schedules, underMaintenance] = await Promise.all([
    getMaintenanceSchedules(),
    getEquipmentUnderMaintenance()
  ]);

  // Convert equipment under maintenance to schedule-like format
  const underMaintenanceSchedules = underMaintenance.map(equipment => ({
    id: `under-maintenance-${equipment.id}`,
    equipment_id: equipment.id,
    maintenance_type: 'corrective',
    description: 'Currently Under Maintenance',
    interval_type: 'manual',
    interval_value: 0,
    last_performed: null,
    next_due: new Date().toISOString(), // Due now
    priority: 'high',
    status: 'in_progress',
    assigned_to: null,
    estimated_cost: 0,
    notes: 'Equipment is currently under maintenance',
    equipment: {
      asset_tag: equipment.asset_tag,
      type: equipment.type
    },
    profiles: null,
    isUnderMaintenance: true
  }));

  return [...schedules, ...underMaintenanceSchedules];
}

// --- Notifications ---
export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createNotification(notification: any) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notification])
    .select();
  if (error) throw error;
  return data[0];
}

export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Get admin and manager profiles for notifications
export async function getAdminProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .in('role', ['Admin', 'Manager']);
  if (error) throw error;
  return data;
}

// Create maintenance overdue notifications
export async function createMaintenanceOverdueNotifications(overdueEquipment: string[]) {
  if (overdueEquipment.length === 0) return;

  const admins = await getAdminProfiles();
  const notifications = [];

  for (const admin of admins) {
    notifications.push({
      user_id: admin.id,
      type: 'maintenance',
      title: 'Maintenance Overdue',
      message: `${overdueEquipment.length} equipment items are overdue for maintenance: ${overdueEquipment.join(', ')}`,
      related_table: 'equipment'
    });
  }

  // Create notifications (ignore if they already exist for today)
  for (const notification of notifications) {
    // Check if similar notification exists today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', notification.user_id)
      .eq('type', 'maintenance')
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (!existing || existing.length === 0) {
      await createNotification(notification);
    }
  }
}

// --- Parts Inventory Management ---
export async function getPartsSuppliers() {
  const { data, error } = await supabase
    .from('parts_suppliers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPartsSupplier(supplier: any) {
  const { data, error } = await supabase
    .from('parts_suppliers')
    .insert([supplier])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updatePartsSupplier(id: string, supplier: any) {
  const { data, error } = await supabase
    .from('parts_suppliers')
    .update(supplier)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deletePartsSupplier(id: string) {
  const { error } = await supabase
    .from('parts_suppliers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getPartsInventory() {
  const { data, error } = await supabase
    .from('parts_inventory')
    .select(`
      *,
      parts_suppliers (
        name
      )
    `)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPart(part: any) {
  const { data, error } = await supabase
    .from('parts_inventory')
    .insert([part])
    .select();
  if (error) throw error;

  // Check for reorder alert
  if (data[0].current_stock <= data[0].min_stock) {
    await createReorderNotification(data[0]);
  }

  return data[0];
}

export async function updatePart(id: string, part: any) {
  const { data, error } = await supabase
    .from('parts_inventory')
    .update(part)
    .eq('id', id)
    .select();
  if (error) throw error;

  // Check for reorder alert
  if (data[0].current_stock <= data[0].min_stock) {
    await createReorderNotification(data[0]);
  }

  return data[0];
}

export async function deletePart(id: string) {
  const { error } = await supabase
    .from('parts_inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getEquipmentPartsMapping() {
  const { data, error } = await supabase
    .from('equipment_parts_mapping')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      ),
      parts_inventory (
        part_number,
        name
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEquipmentPartsMapping(mapping: any) {
  const { data, error } = await supabase
    .from('equipment_parts_mapping')
    .insert([mapping])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateEquipmentPartsMapping(id: string, mapping: any) {
  const { data, error } = await supabase
    .from('equipment_parts_mapping')
    .update(mapping)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteEquipmentPartsMapping(id: string) {
  const { error } = await supabase
    .from('equipment_parts_mapping')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Create reorder notification
async function createReorderNotification(part: any) {
  const admins = await getAdminProfiles();
  for (const admin of admins) {
    await createNotification({
      user_id: admin.id,
      type: 'inventory',
      title: 'Parts Reorder Alert',
      message: `Part ${part.name} (${part.part_number}) is below minimum stock level. Current: ${part.current_stock}, Minimum: ${part.min_stock}`,
      related_id: part.id,
      related_table: 'parts_inventory'
    });
  }
}

// --- Dashboard Configuration ---
export async function getDashboardConfig() {
  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
  return data;
}

export async function updateDashboardConfig(config: any) {
  const existing = await getDashboardConfig();

  if (existing) {
    const { data, error } = await supabase
      .from('dashboard_configs')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('dashboard_configs')
      .insert([{ config }])
      .select();
    if (error) throw error;
    return data[0];
  }
}

