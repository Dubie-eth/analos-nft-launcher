// Simple test to check database connection and table structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('saved_collections')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Database connection successful');
      console.log('📊 Sample data:', data);
    }
    
    // Test table structure
    console.log('\n🔍 Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('saved_collections')
      .select('*')
      .limit(0);
    
    if (structureError) {
      console.error('❌ Table structure error:', structureError);
    } else {
      console.log('✅ Table structure is accessible');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testDatabase();
