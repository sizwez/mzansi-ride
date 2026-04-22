// scripts/test_auth.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Fetch existing admin profile
  const adminId = '3e057e45-b6ff-4044-87ed-a3eb78b9d066';
  console.log('Fetching admin profile:', adminId);
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', adminId);

  if (adminProfileError) {
    console.error('Fetch admin profile error:', adminProfileError);
  } else {
    console.log('Fetched admin profile:', adminProfile);
  }
}

main();
