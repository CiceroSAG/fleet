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
  const { data, error } = await supabase
    .from('equipment')
    .update(equipment)
    .eq('id', id)
    .select();
  if (error) throw error;
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
  const [equipmentRes, incidentsRes, fuelRes, maintenanceRes, allMaintRes] = await Promise.all([
    supabase.from('equipment').select('id, asset_tag, status', { count: 'exact' }),
    supabase.from('incidents').select('*').order('date', { ascending: false }).limit(5),
    supabase.from('fuel_logs').select('quantity, cost, date'),
    supabase.from('maintenance_logs').select('cost, date'),
    supabase.from('maintenance_logs').select('equipment_id, date').order('date', { ascending: false })
  ]);

  if (equipmentRes.error) throw equipmentRes.error;
  
  const equipment = equipmentRes.data || [];
  const totalEquipment = equipment.length;
  const activeEquipment = equipment.filter(e => e.status === 'Active').length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'Under Maintenance').length;

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

  return {
    totalEquipment,
    activeEquipment,
    maintenanceEquipment,
    totalFuelQuantity,
    totalFuelCost,
    recentIncidents: incidentsRes.data || [],
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

