
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    // 1. Categories
    const { data: categories, error: catError } = await supabase
      .from('equipment_categories')
      .insert([
        { name: 'Forklift', description: 'Material handling equipment' },
        { name: 'Telehandler', description: 'Telescopic handler' }
      ])
      .select();
    if (catError) throw catError;
    const catForklift = categories.find(c => c.name === 'Forklift')?.id;
    const catTele = categories.find(c => c.name === 'Telehandler')?.id;

    // 2. Equipment
    const { data: equipment, error: eqError } = await supabase
      .from('equipment')
      .insert([
        {
          asset_tag: 'SM-FKL-03',
          type: 'Forklift',
          model: 'MANITOU',
          category_id: catForklift,
          status: 'Active',
          odometer: 3037
        },
        {
          asset_tag: 'SM-TH-006',
          type: 'Telehandler',
          model: 'MANITOU', // Assumption based on context or similar brand
          serial_number: '204JD ST3A87',
          category_id: catTele,
          status: 'Under Maintenance',
          odometer: 3734.9
        }
      ])
      .select();
    if (eqError) throw eqError;
    const eq1Id = equipment.find(e => e.asset_tag === 'SM-FKL-03')?.id;
    const eq2Id = equipment.find(e => e.asset_tag === 'SM-TH-006')?.id;

    // 3. Field Service Reports
    // Report 1
    const { data: report1, error: r1Error } = await supabase
      .from('field_service_reports')
      .insert([{
        report_date: '2026-04-14',
        technician_name: 'ELIE KITIMUNA',
        workplace: 'KAKULA',
        job_type: 'BD', // Breakdown
        status: 'completed',
        job_description: 'Breakdown, Repair and Safety check.',
        action_taken: 'Oil change, Greasing. Mechanical, Hydraulic, Body work and Tires repair performed.'
      }])
      .select()
      .single();
    if (r1Error) throw r1Error;

    await supabase.from('field_service_report_assets').insert([{
      report_id: report1.id,
      equipment_id: eq1Id,
      index_value: 3037,
      next_service_date: '2026-06-14' // Estimated date based on "3243 H" could be hours or date. Image says "3243 H" for next service date, implying hours-based scheduling. 
    }]);

    // Report 2
    const { data: report2, error: r2Error } = await supabase
      .from('field_service_reports')
      .insert([{
        report_date: '2026-04-15',
        technician_name: 'ELIE KITIMUNA',
        workplace: 'KAKULA workshop',
        job_type: 'BD',
        status: 'in_progress',
        job_description: 'Breakdown and Safety. Mechanical, Electrical and Body work required.',
        action_taken: 'Inspection performed. Parts replaced. Repairs in progress.',
        parts_replaced: 'Parts replaced as per service report'
      }])
      .select()
      .single();
    if (r2Error) throw r2Error;

    await supabase.from('field_service_report_assets').insert([{
      report_id: report2.id,
      equipment_id: eq2Id,
      index_value: 3734.9
    }]);

    console.log('Successfully seeded trial data');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();
