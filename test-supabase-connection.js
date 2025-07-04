// Test script to verify Supabase connection
// Run this with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please update your .env.local file with actual Supabase values');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    const { data, error } = await supabase.from('legal_qa_categories').select('count');
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check if tables exist (Updated after database cleanup)
    console.log('\n2. Checking if tables exist...');
    const tables = [
      'profiles',
      'legal_categories',
      'legal_qa_categories',
      'payment_transactions'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Table '${table}' not found or accessible`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 3: Check if legal categories are populated
    console.log('\n3. Checking legal categories data...');
    const { data: categories, error: catError } = await supabase
      .from('legal_qa_categories')
      .select('*');
    
    if (catError) {
      console.error('❌ Error fetching categories:', catError.message);
    } else if (categories && categories.length > 0) {
      console.log(`✅ Found ${categories.length} legal categories:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name}`);
      });
    } else {
      console.log('⚠️  No legal categories found - you may need to run the schema again');
    }

    // Test 4: Check storage buckets
    console.log('\n4. Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error checking storage buckets:', bucketError.message);
    } else {
      const expectedBuckets = ['legal-documents', 'profile-images'];
      expectedBuckets.forEach(bucketName => {
        const bucket = buckets.find(b => b.name === bucketName);
        if (bucket) {
          console.log(`✅ Storage bucket '${bucketName}' exists`);
        } else {
          console.log(`❌ Storage bucket '${bucketName}' not found`);
        }
      });
    }

    console.log('\n🎉 Supabase setup verification complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
