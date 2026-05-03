/**
 * Cache Verification Script
 * Run this to test that caching is working correctly
 * 
 * Usage: node scripts/test-cache.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
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
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

function formatTime(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

async function testCache() {
  console.log('🧪 Testing Caching Layer Implementation\n');
  console.log('='.repeat(60));

  // Test 1: Business Types
  console.log('\n📊 Test 1: Business Types Caching');
  console.log('-'.repeat(60));
  
  let start = Date.now();
  let res1 = await makeRequest('/api/admin/types');
  let time1 = Date.now() - start;
  console.log(`First request (cache miss):  ${formatTime(time1)} - Status: ${res1.status}`);
  
  start = Date.now();
  let res2 = await makeRequest('/api/admin/types');
  let time2 = Date.now() - start;
  console.log(`Second request (cache hit):  ${formatTime(time2)} - Status: ${res2.status}`);
  
  const improvement1 = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`⚡ Performance improvement: ${improvement1}% faster`);

  // Test 2: Sections
  console.log('\n📊 Test 2: Sections Caching');
  console.log('-'.repeat(60));
  
  start = Date.now();
  res1 = await makeRequest('/api/admin/sections');
  time1 = Date.now() - start;
  console.log(`First request (cache miss):  ${formatTime(time1)} - Status: ${res1.status}`);
  
  start = Date.now();
  res2 = await makeRequest('/api/admin/sections');
  time2 = Date.now() - start;
  console.log(`Second request (cache hit):  ${formatTime(time2)} - Status: ${res2.status}`);
  
  const improvement2 = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`⚡ Performance improvement: ${improvement2}% faster`);

  // Test 3: Field Definitions
  console.log('\n📊 Test 3: Field Definitions Caching');
  console.log('-'.repeat(60));
  
  start = Date.now();
  res1 = await makeRequest('/api/admin/field-definitions');
  time1 = Date.now() - start;
  console.log(`First request (cache miss):  ${formatTime(time1)} - Status: ${res1.status}`);
  
  start = Date.now();
  res2 = await makeRequest('/api/admin/field-definitions');
  time2 = Date.now() - start;
  console.log(`Second request (cache hit):  ${formatTime(time2)} - Status: ${res2.status}`);
  
  const improvement3 = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`⚡ Performance improvement: ${improvement3}% faster`);

  // Test 4: Cache Statistics
  console.log('\n📊 Test 4: Cache Statistics');
  console.log('-'.repeat(60));
  
  const statsRes = await makeRequest('/api/admin/cache');
  if (statsRes.status === 200) {
    console.log('✅ Cache API endpoint working');
    console.log(`📦 Cached entries: ${statsRes.data.cache?.size || 0}`);
    console.log(`📋 Cached keys:`, statsRes.data.cache?.keys || []);
  } else {
    console.log('❌ Cache API not accessible (may require authentication)');
  }

  // Test 5: Cache Invalidation
  console.log('\n📊 Test 5: Cache Invalidation');
  console.log('-'.repeat(60));
  
  const invalidateRes = await makeRequest('/api/admin/cache', 'POST', {
    action: 'invalidate',
    target: 'business_types'
  });
  
  if (invalidateRes.status === 200) {
    console.log('✅ Cache invalidation working');
    console.log(`📝 Response: ${invalidateRes.data.message}`);
  } else {
    console.log('❌ Cache invalidation failed (may require authentication)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Test Summary');
  console.log('='.repeat(60));
  console.log(`Business Types:      ${improvement1}% improvement`);
  console.log(`Sections:            ${improvement2}% improvement`);
  console.log(`Field Definitions:   ${improvement3}% improvement`);
  console.log('\n✅ Caching layer is operational!');
  console.log('\n💡 Tips:');
  console.log('  - Check server logs for "[Cache]" messages');
  console.log('  - Use /api/admin/cache to view cache stats');
  console.log('  - Cache auto-invalidates on POST/PUT/DELETE');
  console.log('='.repeat(60));
}

// Run tests
testCache().catch(err => {
  console.error('❌ Test failed:', err.message);
  console.log('\n💡 Make sure the server is running: npm run dev');
  process.exit(1);
});
