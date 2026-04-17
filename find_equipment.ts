
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('id, asset_tag')
    .in('asset_tag', ['SM-FKL-03', 'SM-TH-006']);
    
  if (error) {
    console.error('Error finding equipment:', error);
    return;
  }
  
  console.log('Equipment found:', JSON.stringify(data));
}

findEquipment();
