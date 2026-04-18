import { supabase } from './supabase';

// --- Settings ---
export async function getSettings() {
  const defaultFeatures = {
    fuel_logs: true,
    parts: true,
    maintenance: true,
    repairs: true,
    incidents: true,
    tracking: true,
    driver_behavior: true,
    fuel_management: true,
    scheduling: true,
    compliance: true,
    utilization: true,
    reports: true,
    user_management: true,
    technicians: true,
    field_service_reports: true
  };

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      fuel_price_per_gallon: 3.50,
      preventive_maintenance_interval: 90,
      company_name: 'Fleet Management Inc.',
      currency: 'USD',
      features: defaultFeatures
    };
  }
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
  
  if (data) {
    return {
      ...data,
      features: data.features || defaultFeatures
    };
  }
  
  return { features: defaultFeatures };
}

export async function updateSettings(settings: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: 'mock-settings-id', ...settings, updated_at: new Date().toISOString() };
  }
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
      .insert([{ ...settings, updated_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data[0];
  }
}

export async function uploadLogo(file: File) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return URL.createObjectURL(file);
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('company-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// --- Categories ---
let mockCategoriesData = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Trucks' },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Excavators' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Light Vehicles' }
];

export async function getCategories() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockCategoriesData];
  }
  const { data, error } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createCategory(category: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...category };
  }
  const { data, error } = await supabase
    .from('equipment_categories')
    .insert([category])
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteCategory(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockCategoriesData = mockCategoriesData.filter(c => c.id !== id);
    return;
  }
  const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
  if (error) throw error;
}

// --- Equipment ---
let mockEquipmentData = [
  { id: '11111111-1111-1111-1111-111111111111', asset_tag: 'TRK-001', type: 'Dump Truck', status: 'Active', manufacturer: 'Volvo', model: 'FMX', year: 2022 },
  { id: '22222222-2222-2222-2222-222222222222', asset_tag: 'EXC-001', type: 'Excavator', status: 'Under Maintenance', manufacturer: 'CAT', model: '320', year: 2021 },
  { id: '33333333-3333-3333-3333-333333333333', asset_tag: 'LV-001', type: 'Light Vehicle', status: 'Active', manufacturer: 'Toyota', model: 'Hilux', year: 2023 }
];

export async function getEquipment() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockEquipmentData];
  }
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
  // Sanitize empty strings to null
  const sanitizedEquipment = { ...equipment };
  Object.keys(sanitizedEquipment).forEach(key => {
    if (sanitizedEquipment[key] === '') sanitizedEquipment[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...sanitizedEquipment };
  }
  const { data, error } = await supabase
    .from('equipment')
    .insert([sanitizedEquipment])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateEquipment(id: string, equipment: any) {
  // Sanitize empty strings to null
  const sanitizedEquipment = { ...equipment };
  Object.keys(sanitizedEquipment).forEach(key => {
    if (sanitizedEquipment[key] === '') sanitizedEquipment[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...sanitizedEquipment };
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockEquipmentData = mockEquipmentData.filter(e => e.id !== id);
    return;
  }
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Operators ---
let mockOperatorsData = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'John Doe', license_number: 'L123456', status: 'Active' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Jane Smith', license_number: 'L789012', status: 'Active' }
];

export async function getOperators() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockOperatorsData];
  }
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createOperator(operator: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...operator };
  }
  const { data, error } = await supabase
    .from('operators')
    .insert([operator])
    .select();
  if (error) {
    console.error('Supabase error creating operator:', error);
    throw error;
  }
  return data[0];
}

export async function updateOperator(id: string, operator: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...operator };
  }
  const { data, error } = await supabase
    .from('operators')
    .update(operator)
    .eq('id', id)
    .select();
  if (error) {
    console.error('Supabase error updating operator:', error);
    throw error;
  }
  return data[0];
}

export async function deleteOperator(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockOperatorsData = mockOperatorsData.filter(o => o.id !== id);
    return;
  }
  const { error } = await supabase
    .from('operators')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Fuel Logs ---
// In-memory storage for mock data when Supabase is not configured
let mockFuelLogs = [
  { id: 'f1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', date: new Date().toISOString(), quantity: 50, cost: 175, odometer_reading: 10500, equipment: { id: '11111111-1111-1111-1111-111111111111', asset_tag: 'TRK-001', type: 'Dump Truck' } },
  { id: 'f2222222-2222-2222-2222-222222222222', equipment_id: '33333333-3333-3333-3333-333333333333', date: new Date().toISOString(), quantity: 15, cost: 52.5, odometer_reading: 5300, equipment: { id: '33333333-3333-3333-3333-333333333333', asset_tag: 'LV-001', type: 'Light Vehicle' } }
];

export async function getFuelLogs() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return mockFuelLogs;
  }
  const { data, error } = await supabase
    .from('fuel_logs')
    .select(`
      *,
      equipment (
        id,
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFuelLog(log: any) {
  console.log('Creating fuel log:', log);

  // Sanitize empty strings to null
  const sanitizedLog = { ...log };
  Object.keys(sanitizedLog).forEach(key => {
    if (sanitizedLog[key] === '') sanitizedLog[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    const newLog = { 
      id: 'f' + Math.random().toString(36).substring(2, 10), 
      ...sanitizedLog,
      equipment: sanitizedLog.equipment_id === '11111111-1111-1111-1111-111111111111' 
        ? { asset_tag: 'TRK-001', type: 'Dump Truck' }
        : { asset_tag: 'LV-001', type: 'Light Vehicle' }
    };
    mockFuelLogs = [newLog, ...mockFuelLogs];
    return newLog;
  }
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert([sanitizedLog])
    .select();
  
  if (error) {
    console.error('Supabase error creating fuel log:', error);
    throw error;
  }

  console.log('Fuel log created successfully:', data[0]);

  // Calculate fuel efficiency after creating log
  if (data && data[0]) {
    try {
      await calculateFuelEfficiencyFromFuelLog(data[0].id);
    } catch (metricError) {
      console.error('Error in post-creation metrics calculation:', metricError);
      // Don't fail the whole operation if metrics fail
    }
  }

  return data[0];
}

export async function updateFuelLog(id: string, log: any) {
  console.log('Updating fuel log:', id, log);
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    const index = mockFuelLogs.findIndex(l => l.id === id);
    if (index !== -1) {
      mockFuelLogs[index] = { ...mockFuelLogs[index], ...log };
      return mockFuelLogs[index];
    }
    return { id, ...log };
  }
  const { data, error } = await supabase
    .from('fuel_logs')
    .update(log)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Supabase error updating fuel log:', error);
    throw error;
  }

  console.log('Fuel log updated successfully:', data[0]);

  if (data && data[0]) {
    try {
      await calculateFuelEfficiencyFromFuelLog(data[0].id);
    } catch (metricError) {
      console.error('Error in post-update metrics calculation:', metricError);
    }
  }

  return data[0];
}

export async function deleteFuelLog(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockFuelLogs = mockFuelLogs.filter(l => l.id !== id);
    return;
  }
  const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Maintenance Logs ---
let mockMaintenanceLogs = [
  { id: 'm1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', date: new Date().toISOString(), service_type: 'routine', cost: 250, notes: 'Oil change', status: 'completed', approval_status: 'approved', equipment: { id: '11111111-1111-1111-1111-111111111111', asset_tag: 'TRK-001', type: 'Dump Truck' }, maintenance_technicians: [] },
  { id: 'm2222222-2222-2222-2222-222222222222', equipment_id: '22222222-2222-2222-2222-222222222222', date: new Date().toISOString(), service_type: 'repair', cost: 1200, notes: 'Hydraulic pump repair', status: 'in_progress', approval_status: 'pending', equipment: { id: '22222222-2222-2222-2222-222222222222', asset_tag: 'EXC-001', type: 'Excavator' }, maintenance_technicians: [] }
];

export async function getMaintenanceLogs() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockMaintenanceLogs];
  }
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      equipment (
        id,
        asset_tag,
        type
      ),
      maintenance_technicians (
        technician_id,
        technicians (
          id,
          name
        )
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createMaintenanceLog(log: any, technicianIds: string[] = [], scheduleId?: string) {
  console.log('Creating maintenance log:', log);
  
  // Sanitize empty strings to null to prevent database errors (e.g. for DATE fields)
  const sanitizedLog = { ...log };
  if (scheduleId && !scheduleId.startsWith('under-maintenance-')) {
    sanitizedLog.schedule_id = scheduleId;
  }
  Object.keys(sanitizedLog).forEach(key => {
    if (sanitizedLog[key] === '') {
      sanitizedLog[key] = null;
    }
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    const newLog = { id: Math.random().toString(36).substring(7), ...sanitizedLog, maintenance_technicians: technicianIds.map(id => ({ technician_id: id })) };
    mockMaintenanceLogs = [newLog, ...mockMaintenanceLogs];
    return newLog;
  }
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert([sanitizedLog])
    .select();
  
  if (error) {
    console.error('Supabase error creating maintenance log:', error);
    throw error;
  }

  const newLog = data[0];

  // Add technicians
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      maintenance_log_id: newLog.id,
      technician_id: techId
    }));
    await supabase.from('maintenance_technicians').insert(techLinks);
  }

  console.log('Maintenance log created successfully:', newLog);

  // Update maintenance schedule and equipment status after creating log
  if (newLog) {
    try {
      if (scheduleId && !scheduleId.startsWith('under-maintenance-')) {
        // Update specific schedule
        const { data: schedule } = await supabase
          .from('maintenance_schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();
          
        if (schedule) {
          const nextDue = new Date(newLog.date);
          if (schedule.interval_type === 'days') {
            nextDue.setDate(nextDue.getDate() + schedule.interval_value);
          } else if (schedule.interval_type === 'hours') {
            nextDue.setDate(nextDue.getDate() + Math.ceil(schedule.interval_value / 8));
          } else if (schedule.interval_type === 'miles') {
            nextDue.setDate(nextDue.getDate() + 30);
          }

          await updateMaintenanceSchedule(schedule.id, {
            last_performed: newLog.date,
            next_due: nextDue.toISOString(),
            status: newLog.status === 'completed' ? 'active' : newLog.status
          });
        }
      } else {
        await updateMaintenanceScheduleFromLog(newLog.id);
      }
      
      // Sync Equipment Status
      let newEquipmentStatus = 'Active';
      if (log.status === 'scheduled' || log.status === 'in_progress') {
        newEquipmentStatus = 'Under Maintenance';
      }
      
      await supabase
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', log.equipment_id);
        
    } catch (scheduleError) {
      console.error('Error updating maintenance schedule or equipment status from log:', scheduleError);
    }
  }

  return newLog;
}

export async function updateMaintenanceLog(id: string, log: any, technicianIds: string[] = []) {
  // Sanitize empty strings to null
  const sanitizedLog = { ...log };
  if (sanitizedLog.status === 'completed' && !sanitizedLog.date_completed) {
    sanitizedLog.date_completed = new Date().toISOString();
  }
  Object.keys(sanitizedLog).forEach(key => {
    if (sanitizedLog[key] === '') sanitizedLog[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockMaintenanceLogs = mockMaintenanceLogs.map(l => 
      l.id === id ? { ...l, ...sanitizedLog, maintenance_technicians: technicianIds.map(tid => ({ technician_id: tid })) } : l
    );
    return { id, ...sanitizedLog };
  }
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(sanitizedLog)
    .eq('id', id)
    .select();
  if (error) throw error;
  
  const updatedLog = data[0];

  // Update technicians
  // First remove existing
  await supabase.from('maintenance_technicians').delete().eq('maintenance_log_id', id);
  
  // Then add new ones
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      maintenance_log_id: id,
      technician_id: techId
    }));
    await supabase.from('maintenance_technicians').insert(techLinks);
  }

  // Sync Equipment Status
  if (updatedLog) {
    try {
      let newEquipmentStatus = 'Active';
      if (log.status === 'scheduled' || log.status === 'in_progress') {
        newEquipmentStatus = 'Under Maintenance';
      }
      
      await supabase
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', log.equipment_id || updatedLog.equipment_id);
    } catch (err) {
      console.error('Error updating equipment status from maintenance log:', err);
    }
  }
  
  return updatedLog;
}

export async function deleteMaintenanceLog(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockMaintenanceLogs = mockMaintenanceLogs.filter(log => log.id !== id);
    return;
  }
  const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function approveMaintenanceLog(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockMaintenanceLogs = mockMaintenanceLogs.map(log => 
      log.id === id ? { ...log, approval_status: 'approved' } : log
    );
    return { id, approval_status: 'approved' };
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('maintenance_logs')
    .update({ 
      approval_status: 'approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

// --- Technicians ---
let mockTechniciansData = [
  { id: '1', name: 'John Smith', specialty: 'Engine Specialist', contact_info: 'john@example.com', status: 'Active', user_id: 'mock-user-id' },
  { id: '2', name: 'Mike Johnson', specialty: 'Hydraulics', contact_info: 'mike@example.com', status: 'Active' }
];

export async function getTechnicians() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockTechniciansData];
  }
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTechnicianByUserId(userId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: '1', name: 'John Smith', specialty: 'Engine Specialist', contact_info: 'john@example.com', status: 'Active', user_id: userId };
  }
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTechnician(technician: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...technician };
  }
  const { data, error } = await supabase
    .from('technicians')
    .insert([technician])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateTechnician(id: string, technician: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...technician };
  }
  const { data, error } = await supabase
    .from('technicians')
    .update(technician)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteTechnician(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockTechniciansData = mockTechniciansData.filter(t => t.id !== id);
    return;
  }
  const { error } = await supabase.from('technicians').delete().eq('id', id);
  if (error) throw error;
}

// --- Repair Logs ---
let mockRepairLogsData = [
  { id: 'r1111111-1111-1111-1111-111111111111', equipment_id: '22222222-2222-2222-2222-222222222222', date_reported: new Date().toISOString(), description: 'Hydraulic leak', status: 'In Progress', equipment: { asset_tag: 'EXC-001', type: 'Excavator' } }
];

export async function getRepairLogs() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockRepairLogsData];
  }
  const { data, error } = await supabase
    .from('repair_logs')
    .select(`
      *,
      equipment (
        asset_tag,
        type
      ),
      repair_technicians (
        technicians (
          id,
          name
        )
      )
    `)
    .order('date_reported', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRepairLog(log: any, technicianIds: string[] = [], scheduleId?: string) {
  console.log('Creating repair log:', log);

  // Sanitize empty strings to null to prevent database errors (e.g. for DATE fields)
  const sanitizedLog = { ...log };
  if (scheduleId) {
    sanitizedLog.schedule_id = scheduleId;
  }
  Object.keys(sanitizedLog).forEach(key => {
    if (sanitizedLog[key] === '') {
      sanitizedLog[key] = null;
    }
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...sanitizedLog };
  }
  const { data, error } = await supabase
    .from('repair_logs')
    .insert([sanitizedLog])
    .select();
  
  if (error) {
    console.error('Supabase error creating repair log:', error);
    throw error;
  }

  const newLog = data[0];

  // Add technicians
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      repair_log_id: newLog.id,
      technician_id: techId
    }));
    await supabase.from('repair_technicians').insert(techLinks);
  }
  
  console.log('Repair log created successfully:', newLog);
  
  // Sync Equipment Status
  if (data && data[0]) {
    try {
      let newEquipmentStatus = 'Active';
      if (log.status === 'pending' || log.status === 'in_progress' || log.status === 'Pending' || log.status === 'In Progress') {
        newEquipmentStatus = 'Repair Required';
      }
      
      await supabase
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', log.equipment_id);
    } catch (err) {
      console.error('Error updating equipment status from repair log:', err);
    }

    // Update maintenance schedule if linked
    if (scheduleId) {
      try {
        await supabase
          .from('maintenance_schedules')
          .update({ 
            status: data[0].status === 'completed' ? 'completed' : data[0].status, 
            last_performed: data[0].status === 'completed' ? new Date().toISOString() : null 
          })
          .eq('id', scheduleId);
      } catch (err) {
        console.error('Error updating maintenance schedule from repair log:', err);
      }
    }
  }
  
  return data[0];
}

export async function updateRepairLog(id: string, log: any, technicianIds: string[] = []) {
  console.log('Updating repair log:', id, log);

  // Sanitize empty strings to null
  const sanitizedLog = { ...log };
  if ((sanitizedLog.status === 'Completed' || sanitizedLog.status === 'completed') && !sanitizedLog.date_completed) {
    sanitizedLog.date_completed = new Date().toISOString();
  }
  Object.keys(sanitizedLog).forEach(key => {
    if (sanitizedLog[key] === '') sanitizedLog[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...sanitizedLog };
  }
  const { data, error } = await supabase
    .from('repair_logs')
    .update(sanitizedLog)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Supabase error updating repair log:', error, 'ID:', id);
    throw error;
  }
  
  const updatedLog = data[0];

  // Update technicians
  // First remove existing
  await supabase.from('repair_technicians').delete().eq('repair_log_id', id);
  
  // Then add new ones
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      repair_log_id: id,
      technician_id: techId
    }));
    await supabase.from('repair_technicians').insert(techLinks);
  }
  
  console.log('Repair log updated successfully:', updatedLog);
  
  // Sync Equipment Status
  if (data && data[0]) {
    try {
      let newEquipmentStatus = 'Active';
      if (log.status === 'pending' || log.status === 'in_progress' || log.status === 'Pending' || log.status === 'In Progress') {
        newEquipmentStatus = 'Repair Required';
      }
      
      await supabase
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', log.equipment_id || data[0].equipment_id);
    } catch (err) {
      console.error('Error updating equipment status from repair log:', err);
    }
  }
  
  return data[0];
}

export async function deleteRepairLog(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockRepairLogsData = mockRepairLogsData.filter(r => r.id !== id);
    return;
  }
  const { error } = await supabase.from('repair_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Incidents ---
let mockIncidentsData = [
  { id: 'i1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', date: new Date().toISOString(), type: 'collision', severity: 'minor', description: 'Minor fender bender', equipment: { asset_tag: 'TRK-001', type: 'Dump Truck' } }
];

export async function getIncidents() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockIncidentsData];
  }
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      equipment (
        id,
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createIncident(incident: any) {
  console.log('Creating incident report:', incident);

  // Sanitize empty strings to null
  const sanitizedIncident = { ...incident };
  Object.keys(sanitizedIncident).forEach(key => {
    if (sanitizedIncident[key] === '') sanitizedIncident[key] = null;
  });

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...sanitizedIncident };
  }
  const { data, error } = await supabase
    .from('incidents')
    .insert([sanitizedIncident])
    .select();
  
  if (error) {
    console.error('Supabase error creating incident report:', error);
    throw error;
  }

  console.log('Incident report created successfully:', data[0]);

  // Create notification for admins about new incident
  try {
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
  } catch (notifError) {
    console.error('Error creating notifications for incident:', notifError);
  }

  return data[0];
}

export async function updateIncident(id: string, incident: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...incident };
  }
  const { data, error } = await supabase
    .from('incidents')
    .update(incident)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteIncident(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockIncidentsData = mockIncidentsData.filter(i => i.id !== id);
    return;
  }
  const { error } = await supabase.from('incidents').delete().eq('id', id);
  if (error) throw error;
}

// --- Advanced Fleet Management CRUD Operations ---

// Vehicle Locations (Real-Time Tracking)
let mockVehicleLocationsData = [
  { id: 'v1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', latitude: -1.2833, longitude: 36.8167, speed: 45, timestamp: new Date().toISOString(), equipment: { asset_tag: 'TRK-001', type: 'Dump Truck', assigned_operator_id: '00000000-0000-0000-0000-000000000001', operators: { name: 'John Doe' } } },
  { id: 'v2222222-2222-2222-2222-222222222222', equipment_id: '33333333-3333-3333-3333-333333333333', latitude: -1.2921, longitude: 36.8219, speed: 0, timestamp: new Date().toISOString(), equipment: { asset_tag: 'LV-001', type: 'Light Vehicle', assigned_operator_id: '00000000-0000-0000-0000-000000000002', operators: { name: 'Jane Smith' } } }
];

export async function getVehicleLocations(limit = 100) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockVehicleLocationsData];
  }
  const { data, error } = await supabase
    .from('vehicle_locations')
    .select(`
      *,
      equipment (
        id,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...location };
  }
  const { data, error } = await supabase
    .from('vehicle_locations')
    .insert([location])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateVehicleLocation(id: string, location: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...location };
  }
  const { data, error } = await supabase
    .from('vehicle_locations')
    .update(location)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteVehicleLocation(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockVehicleLocationsData = mockVehicleLocationsData.filter(v => v.id !== id);
    return;
  }
  const { error } = await supabase.from('vehicle_locations').delete().eq('id', id);
  if (error) throw error;
}

// Driver Behavior Events
let mockDriverBehaviorEventsData = [
  { id: 'd1111111-1111-1111-1111-111111111111', operator_id: '00000000-0000-0000-0000-000000000001', event_type: 'harsh_braking', severity: 'medium', timestamp: new Date().toISOString(), equipment: { asset_tag: 'TRK-001' }, operators: { name: 'John Doe' } }
];

export async function getDriverBehaviorEvents(limit = 100) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockDriverBehaviorEventsData];
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...event };
  }
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .insert([event])
    .select();
  if (error) {
    console.error('Supabase error creating driver behavior event:', error);
    throw error;
  }
  return data[0];
}

export async function updateDriverBehaviorEvent(id: string, event: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...event };
  }
  const { data, error } = await supabase
    .from('driver_behavior_events')
    .update(event)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteDriverBehaviorEvent(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockDriverBehaviorEventsData = mockDriverBehaviorEventsData.filter(d => d.id !== id);
    return;
  }
  const { error } = await supabase.from('driver_behavior_events').delete().eq('id', id);
  if (error) throw error;
}

// Routes
let mockRoutesData = [
  { id: 'r1111111-1111-1111-1111-111111111111', name: 'Downtown Route', start_point: 'Warehouse A', end_point: 'Store 1', distance: 15.5, estimated_duration: 45, profiles: { email: 'admin@example.com' } }
];

export async function getRoutes() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockRoutesData];
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...route };
  }
  const { data, error } = await supabase
    .from('routes')
    .insert([route])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateRoute(id: string, route: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...route };
  }
  const { data, error } = await supabase
    .from('routes')
    .update(route)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteRoute(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockRoutesData = mockRoutesData.filter(r => r.id !== id);
    return;
  }
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error) throw error;
}

// Trips
let mockTripsData = [
  { id: 't1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', operator_id: '00000000-0000-0000-0000-000000000001', route_id: 'r1111111-1111-1111-1111-111111111111', start_time: new Date().toISOString(), status: 'In Progress', equipment: { asset_tag: 'TRK-001', type: 'Dump Truck' }, operators: { name: 'John Doe' }, routes: { name: 'Downtown Route' } }
];

export async function getTrips() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockTripsData];
  }
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      equipment (
        id,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...trip };
  }
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateTrip(id: string, trip: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...trip };
  }
  const { data, error } = await supabase
    .from('trips')
    .update(trip)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteTrip(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockTripsData = mockTripsData.filter(t => t.id !== id);
    return;
  }
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

// Hours of Service
let mockHoursOfServiceData = [
  { id: 'h1111111-1111-1111-1111-111111111111', operator_id: '00000000-0000-0000-0000-000000000001', date: new Date().toISOString().split('T')[0], on_duty_hours: 8, driving_hours: 6, off_duty_hours: 10, sleeper_berth_hours: 0, total_hours: 24, violations: [], operators: { name: 'John Doe' } }
];

export async function getHoursOfService(operatorId?: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockHoursOfServiceData];
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...hos };
  }
  const { data, error } = await supabase
    .from('hours_of_service')
    .insert([hos])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateHoursOfService(id: string, hos: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...hos };
  }
  const { data, error } = await supabase
    .from('hours_of_service')
    .update(hos)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteHoursOfService(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockHoursOfServiceData = mockHoursOfServiceData.filter(h => h.id !== id);
    return;
  }
  const { error } = await supabase.from('hours_of_service').delete().eq('id', id);
  if (error) throw error;
}

// DVIR Reports
let mockDVIRReportsData = [
  { id: 'd1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', operator_id: '00000000-0000-0000-0000-000000000001', report_date: new Date().toISOString(), report_type: 'pre_trip', vehicle_condition: 'satisfactory', defects_found: [], equipment: { asset_tag: 'TRK-001' }, operators: { name: 'John Doe' } }
];

export async function getDVIRReports() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockDVIRReportsData];
  }
  const { data, error } = await supabase
    .from('dvir_reports')
    .select(`
      *,
      equipment (
        id,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...report };
  }
  const { data, error } = await supabase
    .from('dvir_reports')
    .insert([report])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateDVIRReport(id: string, report: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...report };
  }
  const { data, error } = await supabase
    .from('dvir_reports')
    .update(report)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteDVIRReport(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockDVIRReportsData = mockDVIRReportsData.filter(d => d.id !== id);
    return;
  }
  const { error } = await supabase.from('dvir_reports').delete().eq('id', id);
  if (error) throw error;
}

// Maintenance Schedules
let mockMaintenanceSchedulesData = [
  { id: 's1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', service_type: 'Oil Change', maintenance_type: 'preventive', description: 'Regular oil change', frequency_days: 90, last_completed: new Date().toISOString(), next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled', assigned_to: 'mock-user-id', equipment: { asset_tag: 'TRK-001', type: 'Dump Truck' }, profiles: { email: 'admin@example.com' } }
];

export async function getAssignedMaintenanceSchedules(userId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return mockMaintenanceSchedulesData.filter(s => s.assigned_to === userId);
  }
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      equipment (
        asset_tag,
        type,
        model,
        serial_number
      ),
      profiles:assigned_to (
        email
      )
    `)
    .eq('assigned_to', userId)
    .eq('status', 'active')
    .order('next_due', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMaintenanceSchedules() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockMaintenanceSchedulesData];
  }
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
      ),
      maintenance_logs (id, date, status),
      repair_logs (id, date_reported, status),
      field_service_reports (id, report_date, status)
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...schedule };
  }
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert([schedule])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateMaintenanceSchedule(id: string, schedule: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...schedule };
  }
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .update(schedule)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteMaintenanceSchedule(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockMaintenanceSchedulesData = mockMaintenanceSchedulesData.filter(s => s.id !== id);
    return;
  }
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id);
  if (error) throw error;
}

// Fuel Efficiency Metrics
let mockFuelEfficiencyMetricsData = [
  { id: 'e1111111-1111-1111-1111-111111111111', equipment_id: '11111111-1111-1111-1111-111111111111', date: new Date().toISOString(), fuel_consumption: 50, distance_traveled: 400, efficiency_mpg: 8, cost_per_mile: 0.44, equipment: { asset_tag: 'TRK-001', type: 'Dump Truck' } },
  { id: 'e2222222-2222-2222-2222-222222222222', equipment_id: '33333333-3333-3333-3333-333333333333', date: new Date().toISOString(), fuel_consumption: 15, distance_traveled: 375, efficiency_mpg: 25, cost_per_mile: 0.14, equipment: { asset_tag: 'LV-001', type: 'Light Vehicle' } }
];

export async function getFuelEfficiencyMetrics(limit = 100) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockFuelEfficiencyMetricsData];
  }
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .select(`
      *,
      equipment (
        id,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...metric };
  }
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .insert([metric])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateFuelEfficiencyMetric(id: string, metric: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...metric };
  }
  const { data, error } = await supabase
    .from('fuel_efficiency_metrics')
    .update(metric)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteFuelEfficiencyMetric(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockFuelEfficiencyMetricsData = mockFuelEfficiencyMetricsData.filter(m => m.id !== id);
    return;
  }
  const { error } = await supabase.from('fuel_efficiency_metrics').delete().eq('id', id);
  if (error) throw error;
}

// Utilization Metrics
let mockUtilizationMetricsData = [
  { id: '1', equipment_id: '1', date: new Date().toISOString(), total_available_hours: 24, operating_hours: 18, idle_hours: 4, maintenance_hours: 2, utilization_percentage: 75, revenue_generated: 1500, operating_cost: 800, equipment: { id: '1', asset_tag: 'TRK-001', type: 'Dump Truck' } },
  { id: '2', equipment_id: '2', date: new Date().toISOString(), total_available_hours: 24, operating_hours: 12, idle_hours: 6, maintenance_hours: 6, utilization_percentage: 50, revenue_generated: 2000, operating_cost: 1200, equipment: { id: '2', asset_tag: 'EXC-001', type: 'Excavator' } }
];

export async function getUtilizationMetrics(limit = 100) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockUtilizationMetricsData];
  }
  const { data, error } = await supabase
    .from('utilization_metrics')
    .select(`
      *,
      equipment (
        id,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...metric };
  }
  const { data, error } = await supabase
    .from('utilization_metrics')
    .insert([metric])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateUtilizationMetric(id: string, metric: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...metric };
  }
  const { data, error } = await supabase
    .from('utilization_metrics')
    .update(metric)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteUtilizationMetric(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockUtilizationMetricsData = mockUtilizationMetricsData.filter(m => m.id !== id);
    return;
  }
  const { error } = await supabase.from('utilization_metrics').delete().eq('id', id);
  if (error) throw error;
}

// --- Integration Functions ---

// Auto-calculate fuel efficiency when fuel log is created/updated
export async function calculateFuelEfficiencyFromFuelLog(fuelLogId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return;
  }
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

    // Get the previous fuel log to calculate distance
    const { data: previousLogs } = await supabase
      .from('fuel_logs')
      .select('odometer_reading')
      .eq('equipment_id', fuelLog.equipment_id)
      .lt('date', fuelLog.date)
      .order('date', { ascending: false })
      .limit(1);

    const previousOdometer = previousLogs?.[0]?.odometer_reading || fuelLog.odometer_reading;
    const distance = Math.max(0, (fuelLog.odometer_reading || 0) - (previousOdometer || 0));
    const quantity = fuelLog.quantity || 0;
    const cost = fuelLog.cost || 0;

    // Calculate MPG
    const baseMPG = fuelLog.equipment.type === 'Light Vehicle' ? 25 :
                   fuelLog.equipment.type === 'Dump Truck' ? 8 :
                   fuelLog.equipment.type === 'Excavator' ? 12 : 15;

    const mpg = distance > 0 && quantity > 0 ? distance / quantity : baseMPG;
    const costPerMile = distance > 0 ? cost / distance : 0;

    // Create or update fuel efficiency metric
    // Mapping to core-features-schema.sql column names
    const metricData = {
      equipment_id: fuelLog.equipment_id,
      date: fuelLog.date.split('T')[0], // Use date part only for metrics
      fuel_consumption: quantity,
      distance_traveled: distance,
      efficiency_mpg: mpg,
      cost_per_mile: costPerMile,
    };

    // Check if metric already exists for this equipment and date
    const { data: existing, error: existingError } = await supabase
      .from('fuel_efficiency_metrics')
      .select('id')
      .eq('equipment_id', fuelLog.equipment_id)
      .eq('date', metricData.date)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      await updateFuelEfficiencyMetric(existing.id, metricData);
    } else {
      await createFuelEfficiencyMetric(metricData);
    }

    return metricData;
  } catch (error) {
    console.error('Error calculating fuel efficiency:', error);
    // Don't rethrow here so the main operation (creating/updating the log) 
    // can still succeed even if metrics calculation fails
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return;
  }
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
    let query = supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('equipment_id', maintenanceLog.equipment_id)
      .eq('status', 'active')
      .order('next_due', { ascending: true })
      .limit(1);
      
    // Try to match by type if possible, but fall back to any active schedule for this equipment
    const typeToMatch = maintenanceLog.service_type || maintenanceLog.maintenance_type;
    if (typeToMatch && ['preventive', 'predictive', 'corrective'].includes(typeToMatch)) {
      query = query.eq('maintenance_type', typeToMatch);
    }

    const { data: schedules, error: scheduleError } = await query;

    const schedule = schedules?.[0];

    if (scheduleError || !schedule) {
      // No active schedule found, create one if this was preventive maintenance
      if (maintenanceLog.service_type === 'preventive' || maintenanceLog.maintenance_type === 'preventive' || (!maintenanceLog.service_type && !maintenanceLog.maintenance_type)) {
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
          last_performed: maintenanceLog.date,
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
      last_performed: maintenanceLog.date,
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      equipment: { id, asset_tag: 'MOCK-001', status: 'Active', type: 'Truck' },
      fuel: [],
      maintenance: [],
      repairs: [],
      incidents: []
    };
  }
  const [equipment, fuel, maintenance, repairs, incidents, fsrAssets] = await Promise.all([
    supabase.from('equipment').select('*, operators(name)').eq('id', id).single(),
    supabase.from('fuel_logs').select('*').eq('equipment_id', id).order('date', { ascending: false }),
    supabase.from('maintenance_logs').select('*').eq('equipment_id', id).order('date', { ascending: false }),
    supabase.from('repair_logs').select('*').eq('equipment_id', id).order('date_reported', { ascending: false }),
    supabase.from('incidents').select('*').eq('equipment_id', id).order('date', { ascending: false }),
    supabase.from('field_service_report_assets').select('*, field_service_reports(*)').eq('equipment_id', id),
  ]);

  if (equipment.error) throw equipment.error;

  return {
    equipment: equipment.data,
    fuel: fuel.data || [],
    maintenance: maintenance.data || [],
    repairs: repairs.data || [],
    incidents: incidents.data || [],
    fsr: fsrAssets.data?.map((asset: any) => asset.field_service_reports).filter(Boolean) || []
  };
}

// --- Dashboard ---
export async function getDashboardStats() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      totalEquipment: 10,
      activeEquipment: 8,
      totalOperators: 5,
      activeTrips: 2,
      avgFuelEfficiency: 15.5,
      maintenanceDue: 1,
      hosViolations: 0,
      recentLocations: [],
      recentIncidents: [],
      totalFuelQuantity: 500,
      totalFuelCost: 1750,
      fuelLogs: [],
      maintenanceLogs: [],
      equipmentStatusData: [
        { name: 'Active', value: 8 },
        { name: 'Under Maintenance', value: 1 },
        { name: 'Out of Service', value: 1 },
        { name: 'Damaged', value: 0 }
      ],
      overdueEquipment: []
    };
  }
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
  const totalFuelQuantity = fuelLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0);

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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  const { data, error } = await supabase
    .from('equipment')
    .select('id, asset_tag, type, manufacturer, model, current_location, status')
    .in('status', ['Under Maintenance', 'Repair Required'])
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
    maintenance_type: equipment.status === 'Repair Required' ? 'corrective' : 'preventive',
    description: equipment.status === 'Repair Required' ? 'Pending Repair' : 'Currently Under Maintenance',
    interval_type: 'manual',
    interval_value: 0,
    last_performed: null,
    next_due: new Date().toISOString(), // Due now
    priority: equipment.status === 'Repair Required' ? 'high' : 'medium',
    status: 'in_progress',
    assigned_to: null,
    estimated_cost: 0,
    notes: equipment.status === 'Repair Required' ? 'Equipment requires repair' : 'Equipment is currently under maintenance',
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
let mockNotificationsData = [
  { id: '1', title: 'Maintenance Due', message: 'TRK-001 is due for oil change', type: 'maintenance', read: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Low Stock', message: 'Brake Pads stock is low', type: 'inventory', read: true, created_at: new Date().toISOString() }
];

export async function getNotifications() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockNotificationsData];
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createNotification(notification: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...notification };
  }
  const { data, error } = await supabase
    .from('notifications')
    .insert([notification])
    .select();
  if (error) throw error;
  return data[0];
}

export async function markNotificationAsRead(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, read: true };
  }
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteNotification(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockNotificationsData = mockNotificationsData.filter(n => n.id !== id);
    return;
  }
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Get admin and manager profiles for notifications
export async function getAdminProfiles() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [{ id: 'mock-admin-id', email: 'admin@example.com' }];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .in('role', ['Admin', 'Manager']);
  if (error) throw error;
  return data;
}

export async function getProfiles() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [
      { id: '1', email: 'admin@example.com', role: 'Admin', created_at: new Date().toISOString() },
      { id: '2', email: 'manager@example.com', role: 'Manager', created_at: new Date().toISOString() },
      { id: '3', email: 'operator@example.com', role: 'Operator', created_at: new Date().toISOString() }
    ];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateProfileRole(id: string, role: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, role };
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

// Create maintenance overdue notifications
export async function createMaintenanceOverdueNotifications(overdueEquipment: string[]) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return;
  }
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
let mockPartsSuppliersData = [
  { id: 's1111111-1111-1111-1111-111111111111', name: 'Global Parts Corp', contact_name: 'Mike Wilson', email: 'mike@globalparts.com', phone: '555-0101' },
  { id: 's2222222-2222-2222-2222-222222222222', name: 'Fleet Supply Co', contact_name: 'Sarah Jones', email: 'sarah@fleetsupply.com', phone: '555-0102' }
];

export async function getPartsSuppliers() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockPartsSuppliersData];
  }
  const { data, error } = await supabase
    .from('parts_suppliers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPartsSupplier(supplier: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...supplier };
  }
  const { data, error } = await supabase
    .from('parts_suppliers')
    .insert([supplier])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updatePartsSupplier(id: string, supplier: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...supplier };
  }
  const { data, error } = await supabase
    .from('parts_suppliers')
    .update(supplier)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deletePartsSupplier(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockPartsSuppliersData = mockPartsSuppliersData.filter(s => s.id !== id);
    return;
  }
  const { error } = await supabase
    .from('parts_suppliers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

let mockPartsInventoryData = [
  { id: 'p1111111-1111-1111-1111-111111111111', name: 'Oil Filter', part_number: 'OF-100', current_stock: 25, min_stock: 10, unit_price: 15.50, parts_suppliers: { name: 'Global Parts Corp' } },
  { id: 'p2222222-2222-2222-2222-222222222222', name: 'Brake Pads', part_number: 'BP-200', current_stock: 5, min_stock: 8, unit_price: 85.00, parts_suppliers: { name: 'Fleet Supply Co' } }
];

export async function getPartsInventory() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [...mockPartsInventoryData];
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...part };
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...part };
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    mockPartsInventoryData = mockPartsInventoryData.filter(p => p.id !== id);
    return;
  }
  const { error } = await supabase
    .from('parts_inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getEquipmentPartsMapping() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: Math.random().toString(36).substring(7), ...mapping };
  }
  const { data, error } = await supabase
    .from('equipment_parts_mapping')
    .insert([mapping])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateEquipmentPartsMapping(id: string, mapping: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...mapping };
  }
  const { data, error } = await supabase
    .from('equipment_parts_mapping')
    .update(mapping)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteEquipmentPartsMapping(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return;
  }
  const { error } = await supabase
    .from('equipment_parts_mapping')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Create reorder notification
export async function createReorderNotification(part: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return;
  }
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
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { config: {} };
  }
  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
  return data;
}

export async function updateDashboardConfig(config: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: 'mock-dashboard-config-id', config, updated_at: new Date().toISOString() };
  }
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

// --- Incident Investigation Workflow ---
export async function createIncidentInvestigation(incidentId: string, investigation: any) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: incidentId, investigation_data: investigation, investigation_status: 'in_progress' };
  }
  // First, get the incident details
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (incidentError) throw incidentError;

  // Create investigation record (we'll add this to incidents table or create a new table)
  // For now, we'll update the incidents table with investigation data
  const { data, error } = await supabase
    .from('incidents')
    .update({
      investigation_data: investigation,
      investigation_status: 'in_progress',
      investigated_at: new Date().toISOString(),
      investigated_by: investigation.investigator_id
    })
    .eq('id', incidentId)
    .select();

  if (error) throw error;

  return data[0];
}

export async function getIncidentPatterns(timeframe: string = '30') {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      byType: {},
      byEquipment: {},
      bySeverity: {},
      byMonth: {},
      trends: []
    };
  }
  const days = parseInt(timeframe);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select(`
      *,
      equipment:equipment_id (
        asset_tag,
        type
      )
    `)
    .gte('date', startDate.toISOString())
    .order('date', { ascending: false });
  if (error) throw error;

  // Analyze patterns
  const patterns = {
    byType: {} as Record<string, number>,
    byEquipment: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    byMonth: {} as Record<string, number>,
    trends: [] as any[]
  };

  incidents.forEach((incident: any) => {
    // By type
    patterns.byType[incident.type_of_damage] = (patterns.byType[incident.type_of_damage] || 0) + 1;

    // By equipment
    const equipmentKey = `${incident.equipment.asset_tag} (${incident.equipment.type})`;
    patterns.byEquipment[equipmentKey] = (patterns.byEquipment[equipmentKey] || 0) + 1;

    // By severity
    patterns.bySeverity[incident.severity] = (patterns.bySeverity[incident.severity] || 0) + 1;

    // By month
    const monthKey = new Date(incident.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    patterns.byMonth[monthKey] = (patterns.byMonth[monthKey] || 0) + 1;
  });

  // Calculate trends (compare current month with previous)
  const months = Object.keys(patterns.byMonth).sort();
  if (months.length >= 2) {
    const currentMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];
    const currentCount = patterns.byMonth[currentMonth];
    const previousCount = patterns.byMonth[previousMonth];
    const change = ((currentCount - previousCount) / previousCount) * 100;

    patterns.trends = [{
      period: currentMonth,
      incidents: currentCount,
      change: change.toFixed(1),
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
    }];
  }

  return patterns;
}

export async function getCorrectiveActions(incidentId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      incident: { id: incidentId, type_of_damage: 'Unknown' },
      recommendations: [],
      relatedIncidents: [],
      preventiveMeasures: []
    };
  }
  // Get incident and related data
  const { data: incident, error } = await supabase
    .from('incidents')
    .select(`
      *,
      equipment:equipment_id (
        asset_tag,
        type
      ),
      repair_logs (
        id,
        issue_description,
        status,
        cost
      )
    `)
    .eq('id', incidentId)
    .single();
  if (error) throw error;

  // Generate corrective action recommendations based on incident type
  const recommendations = [];

  switch (incident.type_of_damage.toLowerCase()) {
    case 'engine failure':
      recommendations.push(
        { action: 'Schedule engine diagnostic', priority: 'high', department: 'Maintenance' },
        { action: 'Review fuel quality and filtration', priority: 'medium', department: 'Operations' },
        { action: 'Update preventive maintenance schedule', priority: 'medium', department: 'Maintenance' }
      );
      break;
    case 'brake failure':
      recommendations.push(
        { action: 'Inspect all brake systems fleet-wide', priority: 'critical', department: 'Safety' },
        { action: 'Review brake maintenance procedures', priority: 'high', department: 'Maintenance' },
        { action: 'Implement brake performance monitoring', priority: 'medium', department: 'Operations' }
      );
      break;
    case 'tire damage':
      recommendations.push(
        { action: 'Check tire pressure monitoring systems', priority: 'high', department: 'Maintenance' },
        { action: 'Review tire rotation and replacement schedule', priority: 'medium', department: 'Operations' },
        { action: 'Assess road conditions and driving routes', priority: 'low', department: 'Operations' }
      );
      break;
    default:
      recommendations.push(
        { action: 'Conduct equipment inspection', priority: 'high', department: 'Maintenance' },
        { action: 'Review operator training records', priority: 'medium', department: 'HR' },
        { action: 'Update equipment usage guidelines', priority: 'medium', department: 'Operations' }
      );
  }

  return {
    incident,
    recommendations,
    relatedIncidents: [], // Could implement similar incident detection
    preventiveMeasures: recommendations.filter(r => r.priority !== 'critical')
  };
}
export async function getMaintenanceWorkload() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  // Get all profiles with role assignments
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['Admin', 'Manager', 'Technician']);
  if (profilesError) throw profilesError;

  // Get maintenance schedules assigned to each person
  const { data: schedules, error: schedulesError } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      equipment:equipment_id (
        asset_tag,
        type
      ),
      profiles:assigned_to (
        email
      )
    `)
    .eq('status', 'active');

  if (schedulesError) throw schedulesError;

  // Calculate workload for each maintainer
  const workload = new Map();

  profiles.forEach((profile: any) => {
    workload.set(profile.id, {
      profile,
      assignedTasks: 0,
      highPriorityTasks: 0,
      totalEstimatedHours: 0,
      tasks: []
    });
  });

  schedules.forEach((schedule: any) => {
    if (schedule.assigned_to) {
      const maintainer = workload.get(schedule.assigned_to);
      if (maintainer) {
        maintainer.assignedTasks++;
        if (schedule.priority === 'high' || schedule.priority === 'critical') {
          maintainer.highPriorityTasks++;
        }
        maintainer.totalEstimatedHours += schedule.estimated_cost || 0; // Using cost as proxy for hours
        maintainer.tasks.push(schedule);
      }
    }
  });

  return Array.from(workload.values()).sort((a, b) => a.assignedTasks - b.assignedTasks);
}

export async function autoAssignMaintenance(scheduleId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { assignedTo: { id: 'mock-id', email: 'mock@example.com' }, schedule: { id: scheduleId, assigned_to: 'mock-id' } };
  }
  const workload = await getMaintenanceWorkload();

  if (workload.length === 0) {
    throw new Error('No maintenance personnel available');
  }

  // Find the maintainer with the least workload
  const bestAssignee = workload.reduce((best, current) => {
    if (current.assignedTasks < best.assignedTasks) {
      return current;
    }
    return best;
  });

  // Update the maintenance schedule
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .update({
      assigned_to: bestAssignee.profile.id,
      status: 'active'
    })
    .eq('id', scheduleId)
    .select();

  if (error) throw error;

  return {
    assignedTo: bestAssignee.profile,
    schedule: data[0]
  };
}

export async function checkPartsAvailability(scheduleId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      schedule: { id: scheduleId },
      partsAvailability: [],
      canProceed: true,
      status: 'ready',
      recommendations: []
    };
  }
  // Get the maintenance schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      equipment:equipment_id (
        asset_tag,
        type
      )
    `)
    .eq('id', scheduleId)
    .single();
  if (scheduleError) throw scheduleError;

  // Get required parts for this equipment
  const { data: requiredParts, error: partsError } = await supabase
    .from('equipment_parts_mapping')
    .select(`
      *,
      parts_inventory (
        part_number,
        name,
        current_stock,
        min_stock
      )
    `)
    .eq('equipment_id', schedule.equipment_id);

  if (partsError) throw partsError;

  // Check availability
  const availability = requiredParts.map((mapping: any) => ({
    part: mapping.parts_inventory,
    required: mapping.quantity_needed,
    available: mapping.parts_inventory.current_stock,
    sufficient: mapping.parts_inventory.current_stock >= mapping.quantity_needed,
    status: mapping.parts_inventory.current_stock >= mapping.quantity_needed ? 'available' :
            mapping.parts_inventory.current_stock > 0 ? 'partial' : 'out_of_stock'
  }));

  const allAvailable = availability.every(item => item.sufficient);
  const partiallyAvailable = availability.some(item => item.available > 0 && !item.sufficient);

  return {
    schedule,
    partsAvailability: availability,
    canProceed: allAvailable,
    status: allAvailable ? 'ready' : partiallyAvailable ? 'partial' : 'blocked',
    recommendations: allAvailable ? [] : [
      'Order missing parts before scheduling',
      'Consider alternative parts if available',
      'Delay maintenance until parts arrive'
    ]
  };
}

export async function getMaintenanceOptimization() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  // Get all active maintenance schedules
  const { data: schedules, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      equipment:equipment_id (
        asset_tag,
        type
      ),
      profiles:assigned_to (
        email
      )
    `)
    .eq('status', 'active')
    .order('next_due', { ascending: true });
  if (error) throw error;

  const recommendations = [];
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Check for overdue maintenance
  const overdue = schedules.filter(s => new Date(s.next_due) < now);
  if (overdue.length > 0) {
    recommendations.push({
      type: 'overdue_maintenance',
      priority: 'critical',
      count: overdue.length,
      items: overdue.map(s => s.equipment.asset_tag),
      action: 'Schedule immediate maintenance'
    });
  }

  // Check for maintenance due within 3 days
  const dueSoon = schedules.filter(s =>
    new Date(s.next_due) >= now && new Date(s.next_due) <= threeDaysFromNow
  );
  if (dueSoon.length > 0) {
    recommendations.push({
      type: 'maintenance_due_soon',
      priority: 'high',
      count: dueSoon.length,
      items: dueSoon.map(s => s.equipment.asset_tag),
      action: 'Prepare for upcoming maintenance'
    });
  }

  // Check for unassigned maintenance
  const unassigned = schedules.filter(s => !s.assigned_to);
  if (unassigned.length > 0) {
    recommendations.push({
      type: 'unassigned_maintenance',
      priority: 'medium',
      count: unassigned.length,
      items: unassigned.map(s => s.equipment.asset_tag),
      action: 'Assign maintenance tasks to technicians'
    });
  }

  return recommendations;
}
export async function detectFuelAnomalies(equipmentId?: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  // Get fuel logs for analysis
  const { data: fuelLogs, error } = await supabase
    .from('fuel_logs')
    .select(`
      *,
      equipment:equipment_id (
        id,
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false })
    .limit(100);
  if (error) throw error;

  const anomalies = [];

  // Group by equipment
  const equipmentLogs = new Map();
  fuelLogs.forEach((log: any) => {
    if (!equipmentLogs.has(log.equipment_id)) {
      equipmentLogs.set(log.equipment_id, []);
    }
    equipmentLogs.get(log.equipment_id).push(log);
  });

  // Analyze each equipment's fuel patterns
  for (const [eqId, logs] of equipmentLogs) {
    if (logs.length < 3) continue; // Need minimum data

    const sortedLogs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate average fuel consumption
    const avgConsumption = sortedLogs.reduce((sum, log) => sum + log.quantity, 0) / sortedLogs.length;

    // Check for unusual consumption patterns
    sortedLogs.forEach((log, index) => {
      if (index < 2) return; // Skip first two for baseline

      const recentAvg = sortedLogs.slice(index - 2, index + 1).reduce((sum, l) => sum + l.quantity, 0) / 3;
      const deviation = Math.abs(log.quantity - recentAvg) / recentAvg;

      if (deviation > 0.5) { // 50% deviation
        anomalies.push({
          type: log.quantity > recentAvg ? 'excessive_consumption' : 'unusual_low_consumption',
          equipment: log.equipment,
          date: log.date,
          quantity: log.quantity,
          expected: recentAvg.toFixed(1),
          deviation: (deviation * 100).toFixed(1) + '%',
          severity: deviation > 1.0 ? 'high' : 'medium'
        });
      }
    });

    // Check for potential theft (very low fuel with no corresponding trip)
    const recentLogs = sortedLogs.slice(-5);
    recentLogs.forEach((log) => {
      if (log.quantity < avgConsumption * 0.3) { // Less than 30% of average
        anomalies.push({
          type: 'potential_theft',
          equipment: log.equipment,
          date: log.date,
          quantity: log.quantity,
          average: avgConsumption.toFixed(1),
          severity: 'high'
        });
      }
    });
  }

  return anomalies;
}

export async function getFuelEfficiencyOptimization() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  // Get fuel efficiency metrics
  const { data: metrics, error } = await supabase
    .from('fuel_efficiency_metrics')
    .select(`
      *,
      equipment:equipment_id (
        id,
        asset_tag,
        type
      )
    `)
    .order('date', { ascending: false });
  if (error) throw error;

  const recommendations = [];

  // Group by equipment
  const equipmentMetrics = new Map();
  metrics.forEach((metric: any) => {
    if (!equipmentMetrics.has(metric.equipment_id)) {
      equipmentMetrics.set(metric.equipment_id, []);
    }
    equipmentMetrics.get(metric.equipment_id).push(metric);
  });

  // Analyze each equipment
  for (const [eqId, eqMetrics] of equipmentMetrics) {
    if (eqMetrics.length < 7) continue; // Need at least a week of data

    const sortedMetrics = eqMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sortedMetrics[sortedMetrics.length - 1];
    const avgMpg = sortedMetrics.reduce((sum, m) => sum + (m.efficiency_mpg || 0), 0) / sortedMetrics.length;
    const avgIdle = sortedMetrics.reduce((sum, m) => sum + (m.idle_time_hours || 0), 0) / sortedMetrics.length;

    // MPG recommendations
    if (latest.efficiency_mpg < avgMpg * 0.8) {
      recommendations.push({
        type: 'low_efficiency',
        equipment: latest.equipment,
        currentMpg: latest.efficiency_mpg,
        averageMpg: avgMpg.toFixed(1),
        improvement: ((avgMpg - latest.efficiency_mpg) / latest.efficiency_mpg * 100).toFixed(1) + '%',
        suggestions: [
          'Check tire pressure',
          'Reduce idling time',
          'Maintain steady speeds',
          'Schedule maintenance check'
        ]
      });
    }

    // Idling recommendations
    if (latest.idle_time_hours > avgIdle * 1.5) {
      recommendations.push({
        type: 'excessive_idling',
        equipment: latest.equipment,
        idleHours: latest.idle_time_hours,
        averageIdle: avgIdle.toFixed(1),
        costImpact: ((latest.idle_fuel_wasted || 0) * (latest.unit_cost || 0)).toFixed(2),
        suggestions: [
          'Turn off engine when not in use',
          'Use auxiliary power units',
          'Implement idling policies',
          'Install automatic engine shutdown'
        ]
      });
    }
  }

  return recommendations;
}

export async function getFuelStationOptimization() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      recommendations: [
        { name: 'Mock Station A', price: 3.45, lat: 40.7128, lng: -74.0060 },
        { name: 'Mock Station B', price: 3.52, lat: 40.7589, lng: -73.9851 },
        { name: 'Mock Station C', price: 3.38, lat: 40.7505, lng: -73.9934 },
      ],
      savings: 15.0,
      message: 'Mock data: Based on current fuel prices and usage patterns'
    };
  }
  // Get recent fuel logs with location data (assuming GPS integration)
  const { data: fuelLogs, error } = await supabase
    .from('fuel_logs')
    .select(`
      *,
      equipment:equipment_id (
        id,
        asset_tag
      )
    `)
    .order('date', { ascending: false })
    .limit(50);
  if (error) throw error;

  // Mock fuel station data (in real implementation, this would come from external API)
  const fuelStations = [
    { name: 'Station A', price: 3.45, lat: 40.7128, lng: -74.0060 },
    { name: 'Station B', price: 3.52, lat: 40.7589, lng: -73.9851 },
    { name: 'Station C', price: 3.38, lat: 40.7505, lng: -73.9934 },
  ];

  // For now, return mock optimization data
  return {
    recommendations: fuelStations.sort((a, b) => a.price - b.price),
    savings: fuelLogs.length * 0.15, // Mock savings calculation
    message: 'Based on current fuel prices and usage patterns'
  };
}
export async function getDriverSafetyScores() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  // Get all operators with their behavior events from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: events, error } = await supabase
    .from('driver_behavior_events')
    .select(`
      *,
      operators:operator_id (
        id,
        name
      )
    `)
    .gte('timestamp', thirtyDaysAgo.toISOString());
  if (error) throw error;

  // Calculate safety scores for each operator
  const operatorScores = new Map();

  events.forEach((event: any) => {
    const operatorId = event.operator_id;
    if (!operatorScores.has(operatorId)) {
      operatorScores.set(operatorId, {
        operator: event.operators,
        events: [],
        score: 100 // Start with perfect score
      });
    }

    const operatorData = operatorScores.get(operatorId);
    operatorData.events.push(event);

    // Deduct points based on severity and event type
    let deduction = 0;
    if (event.severity === 'high') {
      deduction = event.event_type === 'speeding' ? 10 : 8;
    } else if (event.severity === 'medium') {
      deduction = event.event_type === 'speeding' ? 5 : 4;
    } else {
      deduction = event.event_type === 'speeding' ? 2 : 1;
    }

    operatorData.score = Math.max(0, operatorData.score - deduction);
  });

  return Array.from(operatorScores.values()).sort((a, b) => b.score - a.score);
}

export async function getDriverBehaviorTrends(operatorId?: string, days: number = 30) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  let query = supabase
    .from('driver_behavior_events')
    .select('*')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });
  if (operatorId) {
    query = query.eq('operator_id', operatorId);
  }
  const { data: events, error } = await query;
  if (error) throw error;

  // Group events by date
  const dailyEvents = new Map();

  events.forEach((event: any) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    if (!dailyEvents.has(date)) {
      dailyEvents.set(date, {
        date,
        totalEvents: 0,
        speeding: 0,
        harshBraking: 0,
        rapidAcceleration: 0,
        idling: 0,
        harshCornering: 0,
        score: 100
      });
    }

    const day = dailyEvents.get(date);
    day.totalEvents++;
    day[event.event_type] = (day[event.event_type] || 0) + 1;

    // Calculate daily score deduction
    let deduction = 0;
    if (event.severity === 'high') {
      deduction = event.event_type === 'speeding' ? 10 : 8;
    } else if (event.severity === 'medium') {
      deduction = event.event_type === 'speeding' ? 5 : 4;
    } else {
      deduction = event.event_type === 'speeding' ? 2 : 1;
    }
    day.score = Math.max(0, day.score - deduction);
  });

  return Array.from(dailyEvents.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPeerComparison(operatorId: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return {
      operator: { operator: { id: operatorId, name: 'Mock Operator' }, score: 85 },
      percentile: 75,
      average: 80,
      median: 82,
      rank: 2,
      totalOperators: 10,
      betterThan: 7,
      worseThan: 2
    };
  }
  const scores = await getDriverSafetyScores();
  const targetOperator = scores.find(s => s.operator.id === operatorId);

  if (!targetOperator) return null;

  const sortedScores = scores.map(s => s.score).sort((a, b) => b - a);
  const targetScore = targetOperator.score;

  // Calculate percentile
  const betterThan = sortedScores.filter(score => score > targetScore).length;
  const percentile = Math.round((betterThan / sortedScores.length) * 100);

  // Get average and median
  const average = sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length;
  const median = sortedScores[Math.floor(sortedScores.length / 2)];

  return {
    operator: targetOperator,
    percentile,
    average: Math.round(average),
    median,
    rank: betterThan + 1,
    totalOperators: sortedScores.length,
    betterThan,
    worseThan: sortedScores.length - betterThan - 1
  };
}

// --- Field Service Reports ---
export async function createFieldServiceReport(report: any, assets: any[], parts: any[], scheduleId?: string, technicianIds: string[] = []) {
  // Sanitize empty strings to null
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === '') newObj[key] = null;
    });
    return newObj;
  };

  const sanitizedReport = sanitize(report);
  if (scheduleId) {
    sanitizedReport.schedule_id = scheduleId;
  }
  const sanitizedAssets = assets.map(sanitize);
  const sanitizedParts = parts.map(sanitize);

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id: 'mock-report-id', ...sanitizedReport };
  }

  const { data: reportData, error: reportError } = await supabase
    .from('field_service_reports')
    .insert([sanitizedReport])
    .select()
    .single();

  if (reportError) throw reportError;

  const reportId = reportData.id;

  // Add technicians
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      report_id: reportId,
      technician_id: techId
    }));
    await supabase.from('field_service_report_technicians').insert(techLinks);
  }

  // Insert assets
  if (sanitizedAssets.length > 0) {
    const assetsToInsert = sanitizedAssets.map(asset => ({
      ...asset,
      report_id: reportId
    }));
    const { error: assetsError } = await supabase
      .from('field_service_report_assets')
      .insert(assetsToInsert);
    if (assetsError) throw assetsError;

    // Create maintenance/repair logs and incidents for each asset
    for (const asset of sanitizedAssets) {
      // 1. Handle Maintenance (Automatic creation if any maintenance check is selected)
      const hasMaintenance = sanitizedReport.maintenance_details && 
        Object.values(sanitizedReport.maintenance_details).some(v => v === true);
      
      if (sanitizedReport.job_type === 'PM' || hasMaintenance) {
        await createMaintenanceLog({
          equipment_id: asset.equipment_id,
          service_type: 'routine',
          date: new Date(sanitizedReport.report_date).toISOString(),
          cost: 0,
          notes: sanitizedReport.job_description,
          workplace: sanitizedReport.workplace,
          index_value: asset.index_value,
          next_service_date: asset.next_service_date,
          parts_replaced: sanitizedReport.parts_replaced,
          parts_ordered: sanitizedReport.parts_ordered,
          status: sanitizedReport.status === 'completed' ? 'completed' : 
                  sanitizedReport.status === 'in_progress' ? 'in_progress' : 'scheduled'
        }, technicianIds, scheduleId);
      } 
      
      // 2. Handle Repair (Automatic creation if any repair type is selected)
      const hasRepair = sanitizedReport.repair_details && 
        Object.values(sanitizedReport.repair_details).some(v => v === true);

      if (sanitizedReport.job_type === 'RP' || sanitizedReport.job_type === 'BD' || hasRepair) {
        await createRepairLog({
          equipment_id: asset.equipment_id,
          issue_description: sanitizedReport.job_description,
          action_taken: sanitizedReport.action_taken,
          parts_replaced: sanitizedReport.parts_replaced,
          parts_ordered: sanitizedReport.parts_ordered,
          workplace: sanitizedReport.workplace,
          index_value: asset.index_value,
          date_reported: new Date(sanitizedReport.report_date).toISOString(),
          status: sanitizedReport.status === 'completed' ? 'completed' : 
                  sanitizedReport.status === 'in_progress' ? 'in_progress' : 'pending',
          cost: 0
        }, technicianIds, scheduleId);
      }

      // 3. Handle Incident (Automatic creation if any safety type is selected)
      const hasIncident = sanitizedReport.safety_details && 
        sanitizedReport.safety_details.incident_type && 
        sanitizedReport.safety_details.incident_type !== 'none';
        
      if (sanitizedReport.job_type === 'SAF' || hasIncident) {
        await createIncident({
          equipment_id: asset.equipment_id,
          type_of_damage: sanitizedReport.safety_details?.incident_type || 'General Safety Issue',
          severity: sanitizedReport.safety_details?.severity || 'Low',
          date: new Date(sanitizedReport.report_date).toISOString(),
          reported_by: sanitizedReport.technician_name,
          notes: sanitizedReport.job_description
        });
      }
      
      // Update equipment odometer/hours
      if (asset.index_value > 0) {
        await supabase
          .from('equipment')
          .update({ odometer: asset.index_value })
          .eq('id', asset.equipment_id);
      }
    }
  }

  // Insert parts
  if (sanitizedParts.length > 0) {
    const partsToInsert = sanitizedParts.map(part => ({
      ...part,
      report_id: reportId
    }));
    const { error: partsError } = await supabase
      .from('field_service_report_parts')
      .insert(partsToInsert);
    if (partsError) throw partsError;
  }

  return reportData;
}

export async function updateFieldServiceReport(id: string, report: any, assets: any[], parts: any[], technicianIds: string[] = []) {
  // Sanitize empty strings to null
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === '') newObj[key] = null;
    });
    return newObj;
  };

  const sanitizedReport = sanitize(report);
  const sanitizedAssets = assets.map(sanitize);
  const sanitizedParts = parts.map(sanitize);

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return { id, ...sanitizedReport };
  }

  // Update report
  const { data: reportData, error: reportError } = await supabase
    .from('field_service_reports')
    .update(sanitizedReport)
    .eq('id', id)
    .select()
    .single();

  if (reportError) throw reportError;

  // Update technicians
  await supabase.from('field_service_report_technicians').delete().eq('report_id', id);
  if (technicianIds.length > 0) {
    const techLinks = technicianIds.map(techId => ({
      report_id: id,
      technician_id: techId
    }));
    await supabase.from('field_service_report_technicians').insert(techLinks);
  }

  // Delete existing assets and parts
  await supabase.from('field_service_report_assets').delete().eq('report_id', id);
  await supabase.from('field_service_report_parts').delete().eq('report_id', id);

  // Insert new assets
  if (sanitizedAssets.length > 0) {
    const assetsToInsert = sanitizedAssets.map(asset => ({
      ...asset,
      report_id: id
    }));
    const { error: assetsError } = await supabase
      .from('field_service_report_assets')
      .insert(assetsToInsert);
    if (assetsError) throw assetsError;
  }

  // Insert new parts
  if (sanitizedParts.length > 0) {
    const partsToInsert = sanitizedParts.map(part => ({
      ...part,
      report_id: id
    }));
    const { error: partsError } = await supabase
      .from('field_service_report_parts')
      .insert(partsToInsert);
    if (partsError) throw partsError;
  }

  // Sync status with linked schedule and logs
  if (sanitizedReport.status && reportData.schedule_id) {
    const logStatus = sanitizedReport.status === 'completed' ? 'completed' : 
                     sanitizedReport.status === 'in_progress' ? 'in_progress' : 
                     (sanitizedReport.job_type === 'PM' ? 'scheduled' : 'pending');

    await Promise.all([
      supabase.from('maintenance_logs').update({ 
        status: logStatus,
        parts_replaced: sanitizedReport.parts_replaced,
        parts_ordered: sanitizedReport.parts_ordered
      }).eq('schedule_id', reportData.schedule_id),
      supabase.from('repair_logs').update({ 
        status: logStatus,
        parts_replaced: sanitizedReport.parts_replaced,
        parts_ordered: sanitizedReport.parts_ordered
      }).eq('schedule_id', reportData.schedule_id),
      supabase.from('maintenance_schedules').update({ 
        status: sanitizedReport.status === 'completed' ? 'completed' : 
                sanitizedReport.status === 'in_progress' ? 'in_progress' : 'active',
        parts_replaced: sanitizedReport.parts_replaced,
        parts_ordered: sanitizedReport.parts_ordered
      }).eq('id', reportData.schedule_id)
    ]);
  }

  return reportData;
}

export async function deleteFieldServiceReport(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return true;
  }

  const { error } = await supabase
    .from('field_service_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getFieldServiceReports() {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return [];
  }
  const { data, error } = await supabase
    .from('field_service_reports')
    .select(`
      *,
      field_service_report_assets (
        *,
        equipment (asset_tag, model)
      ),
      field_service_report_parts (*),
      field_service_report_technicians (
        technicians (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFieldServiceReport(id: string) {
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '') {
    return null;
  }
  const { data, error } = await supabase
    .from('field_service_reports')
    .select(`
      *,
      field_service_report_assets (
        *,
        equipment (*)
      ),
      field_service_report_parts (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

