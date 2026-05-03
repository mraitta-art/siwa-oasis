/**
 * Direct API Test - Check what the frontend is actually receiving
 * Run this while the server is running
 * 
 * Usage: node scripts/test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
    };

    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data.substring(0, 500),
          });
        }
      });
    }).on('error', reject);
  });
}

async function testAPIs() {
  console.log('🔍 Testing API Endpoints...\n');
  console.log('='.repeat(80));

  // Test 1: Types API
  console.log('\n1️⃣  GET /api/admin/types');
  console.log('-'.repeat(80));
  try {
    const types = await makeRequest('/api/admin/types');
    console.log(`Status: ${types.status}`);
    if (types.status === 200 && Array.isArray(types.data)) {
      console.log(`✅ Found ${types.data.length} business types\n`);
      types.data.forEach(t => {
        const parent = t.parent_id ? `→ child of "${t.parent_id}"` : '★ PARENT';
        console.log(`   • ${t.name.padEnd(30)} (${t.id.padEnd(20)}) ${parent}`);
      });
    } else {
      console.log('❌ Error or unexpected response:');
      console.log(JSON.stringify(types.data, null, 2));
    }
  } catch (e) {
    console.log('❌ Request failed:', e.message);
  }

  // Test 2: Sections API
  console.log('\n\n2️⃣  GET /api/admin/sections');
  console.log('-'.repeat(80));
  try {
    const sections = await makeRequest('/api/admin/sections');
    console.log(`Status: ${sections.status}`);
    if (sections.status === 200 && Array.isArray(sections.data)) {
      console.log(`✅ Found ${sections.data.length} sections\n`);
      sections.data.forEach(s => {
        console.log(`   • ${s.name.padEnd(35)} (${s.id})`);
      });
    } else {
      console.log('❌ Error or unexpected response:');
      console.log(JSON.stringify(sections.data, null, 2).substring(0, 300));
    }
  } catch (e) {
    console.log('❌ Request failed:', e.message);
  }

  // Test 3: Factory Fields
  console.log('\n\n3️⃣  GET /api/admin/forms?type=FACTORY');
  console.log('-'.repeat(80));
  try {
    const factory = await makeRequest('/api/admin/forms?type=FACTORY');
    console.log(`Status: ${factory.status}`);
    if (factory.status === 200 && Array.isArray(factory.data)) {
      console.log(`✅ Found ${factory.data.length} factory components\n`);
      factory.data.forEach(f => {
        console.log(`   • ${f.label.padEnd(30)} (${f.field_type.padEnd(15)}) [${f.section_id}]`);
      });
    } else {
      console.log('❌ Error or unexpected response:');
      console.log(JSON.stringify(factory.data, null, 2).substring(0, 300));
    }
  } catch (e) {
    console.log('❌ Request failed:', e.message);
  }

  // Test 4: Hotel Fields
  console.log('\n\n4️⃣  GET /api/admin/forms?type=hotel');
  console.log('-'.repeat(80));
  try {
    const hotel = await makeRequest('/api/admin/forms?type=hotel');
    console.log(`Status: ${hotel.status}`);
    if (hotel.status === 200 && Array.isArray(hotel.data)) {
      console.log(`✅ Found ${hotel.data.length} fields for Hotel\n`);
      hotel.data.forEach(f => {
        const inherited = f.is_inherited ? '[INHERITED]' : '[DIRECT]';
        console.log(`   • ${f.label.padEnd(30)} (${f.field_type.padEnd(15)}) ${inherited}`);
      });
    } else {
      console.log('❌ Error or unexpected response:');
      console.log(JSON.stringify(hotel.data, null, 2).substring(0, 300));
    }
  } catch (e) {
    console.log('❌ Request failed:', e.message);
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('\nIf you see ✅ marks above, the data IS in the database and APIs are working.');
  console.log('\nIf the UI is not showing it, the issue is:');
  console.log('  1. Browser cache (Press Ctrl+Shift+R)');
  console.log('  2. JavaScript error in browser (Check F12 Console)');
  console.log('  3. Not logged in (Login at /login)');
  console.log('  4. Wrong page (Go to /admin/governance)');
  console.log('\n' + '='.repeat(80));
}

testAPIs().catch(e => {
  console.error('\n❌ Test failed:', e.message);
  console.log('\n💡 Make sure the server is running: npm run dev');
});
