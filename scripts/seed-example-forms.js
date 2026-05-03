/**
 * Seed Example Forms for Business Types
 * This script creates complete form examples with Factory components and ACL permissions
 * 
 * Usage: node scripts/seed-example-forms.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', body = null, token = null) {
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

    if (token) {
      options.headers['Cookie'] = `siwa_session=${token}`;
    }

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

async function login(email, password) {
  const res = await makeRequest('/api/auth/login', 'POST', { email, password });
  if (res.status === 200 && res.data.token) {
    return res.data.token;
  }
  throw new Error('Login failed');
}

async function createFactoryComponent(token, field) {
  return await makeRequest('/api/admin/forms', 'POST', {
    business_type_id: 'FACTORY',
    section_id: 'factory_pool',
    ...field
  }, token);
}

async function createSection(token, section) {
  return await makeRequest('/api/admin/sections', 'POST', section, token);
}

async function createBusinessType(token, type) {
  return await makeRequest('/api/admin/types', 'POST', type, token);
}

async function addFieldToType(token, field) {
  return await makeRequest('/api/admin/forms', 'POST', field, token);
}

async function seedExampleForms() {
  console.log('🌱 Seeding Example Forms with Factory + ACL\n');
  console.log('='.repeat(70));

  try {
    // Login as admin
    console.log('\n📝 Step 1: Logging in as admin...');
    const token = await login('super@siwa.com', 'super123');
    console.log('✅ Logged in successfully');

    // Step 2: Create Factory Components
    console.log('\n📦 Step 2: Creating Factory Master Components...');
    
    const factoryComponents = [
      // Public Information Fields
      {
        name: 'business_name',
        label: 'Business Name',
        field_type: 'text',
        required: true,
        help_text: 'Official name of your business',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'salesman', 'public'],
          write: ['super_admin', 'content_admin', 'vendor', 'salesman']
        }
      },
      {
        name: 'description',
        label: 'Description',
        field_type: 'textarea',
        required: true,
        help_text: 'Describe your business in detail',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'phone',
        label: 'Phone Number',
        field_type: 'text',
        required: true,
        help_text: 'Contact phone number',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'email',
        label: 'Email Address',
        field_type: 'text',
        required: true,
        help_text: 'Business email address',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'website',
        label: 'Website URL',
        field_type: 'link',
        required: false,
        help_text: 'Your business website',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'address',
        label: 'Full Address',
        field_type: 'textarea',
        required: true,
        help_text: 'Complete address including city and postal code',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'photo_gallery',
        label: 'Photo Gallery',
        field_type: 'gallery',
        required: false,
        help_text: 'Upload photos of your business',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor', 'public'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      
      // Vendor Internal Fields
      {
        name: 'internal_notes',
        label: 'Internal Notes',
        field_type: 'textarea',
        required: false,
        help_text: 'Private notes for business management',
        acl: {
          read: ['super_admin', 'content_admin', 'vendor'],
          write: ['super_admin', 'content_admin', 'vendor']
        }
      },
      {
        name: 'avg_monthly_revenue',
        label: 'Average Monthly Revenue',
        field_type: 'number',
        required: false,
        help_text: 'Estimated monthly revenue (EGP)',
        acl: {
          read: ['super_admin', 'vendor'],
          write: ['super_admin', 'vendor']
        }
      },
      {
        name: 'employee_count',
        label: 'Number of Employees',
        field_type: 'number',
        required: false,
        help_text: 'Total full-time employees',
        acl: {
          read: ['super_admin', 'vendor'],
          write: ['super_admin', 'vendor']
        }
      },
      
      // Admin Only Fields
      {
        name: 'verification_status',
        label: 'Verification Status',
        field_type: 'select',
        required: true,
        options: ['pending', 'verified', 'rejected', 'suspended'],
        help_text: 'Administrative verification status',
        acl: {
          read: ['super_admin', 'content_admin'],
          write: ['super_admin']
        }
      },
      {
        name: 'admin_rating',
        label: 'Admin Quality Rating',
        field_type: 'number',
        required: false,
        help_text: 'Internal quality score (1-10)',
        acl: {
          read: ['super_admin', 'content_admin'],
          write: ['super_admin']
        }
      },
      {
        name: 'priority_listing',
        label: 'Priority Listing',
        field_type: 'checkbox',
        required: false,
        help_text: 'Show in featured listings',
        acl: {
          read: ['super_admin', 'content_admin'],
          write: ['super_admin']
        }
      },
      {
        name: 'admin_notes',
        label: 'Admin Notes',
        field_type: 'textarea',
        required: false,
        help_text: 'Internal administrative notes',
        acl: {
          read: ['super_admin'],
          write: ['super_admin']
        }
      }
    ];

    console.log(`Creating ${factoryComponents.length} factory components...`);
    let createdCount = 0;
    
    for (const component of factoryComponents) {
      try {
        const res = await createFactoryComponent(token, component);
        if (res.status === 201 || res.status === 200) {
          createdCount++;
          console.log(`  ✅ Created: ${component.label}`);
        } else {
          console.log(`  ⚠️  Skipped: ${component.label} (already exists)`);
        }
      } catch (e) {
        console.log(`  ⚠️  Error creating ${component.label}: ${e.message}`);
      }
    }
    
    console.log(`\n✅ Created ${createdCount}/${factoryComponents.length} factory components`);

    // Step 3: Create Sections
    console.log('\n📋 Step 3: Creating Sections...');
    
    const sections = [
      { id: 'basic_info', name: 'Basic Information', icon: 'fa-info-circle', required: true, vendor_editable: true, show_on_public: true },
      { id: 'contact', name: 'Contact Details', icon: 'fa-phone', required: true, vendor_editable: true, show_on_public: true },
      { id: 'media', name: 'Photos & Media', icon: 'fa-images', required: false, vendor_editable: true, show_on_public: true },
      { id: 'amenities', name: 'Amenities & Features', icon: 'fa-check-circle', required: false, vendor_editable: true, show_on_public: true },
      { id: 'business_metrics', name: 'Business Metrics', icon: 'fa-chart-line', required: false, vendor_editable: true, show_on_public: false },
      { id: 'admin_verification', name: 'Admin Verification', icon: 'fa-shield-alt', required: false, vendor_editable: false, show_on_public: false }
    ];

    for (const section of sections) {
      try {
        await createSection(token, section);
        console.log(`  ✅ Created section: ${section.name}`);
      } catch (e) {
        console.log(`  ⚠️  Section exists: ${section.name}`);
      }
    }

    // Step 4: Create Business Types
    console.log('\n🏨 Step 4: Creating Business Types...');
    
    const businessTypes = [
      {
        id: 'hotel',
        name: 'Hotel',
        icon: 'fa-hotel',
        icon_color: '#D4AF37',
        description: 'Hotels and accommodations',
        is_parent: false,
        parent_id: null,
        sections: ['basic_info', 'contact', 'media', 'amenities', 'business_metrics', 'admin_verification']
      },
      {
        id: 'restaurant',
        name: 'Restaurant',
        icon: 'fa-utensils',
        icon_color: '#c0392b',
        description: 'Restaurants and cafes',
        is_parent: false,
        parent_id: null,
        sections: ['basic_info', 'contact', 'media', 'amenities', 'business_metrics', 'admin_verification']
      },
      {
        id: 'tour',
        name: 'Tour Operator',
        icon: 'fa-umbrella-beach',
        icon_color: '#27ae60',
        description: 'Tour operators and guides',
        is_parent: false,
        parent_id: null,
        sections: ['basic_info', 'contact', 'media', 'amenities', 'business_metrics', 'admin_verification']
      }
    ];

    for (const type of businessTypes) {
      try {
        await createBusinessType(token, {
          ...type,
          sections: type.sections,
          own_sections: []
        });
        console.log(`  ✅ Created business type: ${type.name}`);
      } catch (e) {
        console.log(`  ⚠️  Type exists: ${type.name}`);
      }
    }

    // Step 5: Add Fields to Hotel Type (Example)
    console.log('\n🏨 Step 5: Adding Fields to Hotel Business Type...');
    
    const hotelFields = [
      // Basic Information Section
      { business_type_id: 'hotel', section_id: 'basic_info', name: 'hotel_name', label: 'Hotel Name', field_type: 'text', required: true, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'basic_info', name: 'star_rating', label: 'Star Rating', field_type: 'select', required: true, options: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'], acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'basic_info', name: 'description', label: 'Hotel Description', field_type: 'textarea', required: true, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      
      // Contact Section
      { business_type_id: 'hotel', section_id: 'contact', name: 'phone', label: 'Phone Number', field_type: 'text', required: true, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'contact', name: 'email', label: 'Email Address', field_type: 'text', required: true, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'contact', name: 'website', label: 'Website', field_type: 'link', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'contact', name: 'address', label: 'Full Address', field_type: 'textarea', required: true, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      
      // Media Section
      { business_type_id: 'hotel', section_id: 'media', name: 'photo_gallery', label: 'Photo Gallery', field_type: 'gallery', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      
      // Amenities Section
      { business_type_id: 'hotel', section_id: 'amenities', name: 'wifi_available', label: 'WiFi Available', field_type: 'checkbox', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'amenities', name: 'pool_available', label: 'Swimming Pool', field_type: 'checkbox', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'amenities', name: 'parking_available', label: 'Parking Available', field_type: 'checkbox', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'amenities', name: 'restaurant_count', label: 'Number of Restaurants', field_type: 'number', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'amenities', name: 'room_count', label: 'Total Rooms', field_type: 'number', required: false, acl: { read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'vendor'] }},
      
      // Business Metrics (Vendor Internal)
      { business_type_id: 'hotel', section_id: 'business_metrics', name: 'avg_monthly_revenue', label: 'Average Monthly Revenue', field_type: 'number', required: false, acl: { read: ['super_admin', 'vendor'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'business_metrics', name: 'employee_count', label: 'Number of Employees', field_type: 'number', required: false, acl: { read: ['super_admin', 'vendor'], write: ['super_admin', 'vendor'] }},
      { business_type_id: 'hotel', section_id: 'business_metrics', name: 'internal_notes', label: 'Internal Notes', field_type: 'textarea', required: false, acl: { read: ['super_admin', 'vendor'], write: ['super_admin', 'vendor'] }},
      
      // Admin Verification (Admin Only)
      { business_type_id: 'hotel', section_id: 'admin_verification', name: 'verification_status', label: 'Verification Status', field_type: 'select', required: true, options: ['pending', 'verified', 'rejected', 'suspended'], acl: { read: ['super_admin', 'content_admin'], write: ['super_admin'] }},
      { business_type_id: 'hotel', section_id: 'admin_verification', name: 'admin_rating', label: 'Quality Rating (1-10)', field_type: 'number', required: false, acl: { read: ['super_admin', 'content_admin'], write: ['super_admin'] }},
      { business_type_id: 'hotel', section_id: 'admin_verification', name: 'priority_listing', label: 'Priority Listing', field_type: 'checkbox', required: false, acl: { read: ['super_admin', 'content_admin'], write: ['super_admin'] }},
      { business_type_id: 'hotel', section_id: 'admin_verification', name: 'admin_notes', label: 'Admin Notes', field_type: 'textarea', required: false, acl: { read: ['super_admin'], write: ['super_admin'] }}
    ];

    console.log(`Adding ${hotelFields.length} fields to Hotel type...`);
    let hotelFieldsCount = 0;
    
    for (const field of hotelFields) {
      try {
        const res = await addFieldToType(token, field);
        if (res.status === 201 || res.status === 200) {
          hotelFieldsCount++;
        }
      } catch (e) {
        // Field might already exist
      }
    }
    
    console.log(`✅ Added ${hotelFieldsCount}/${hotelFields.length} fields to Hotel`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📊 What Was Created:');
    console.log(`  • ${createdCount} Factory master components`);
    console.log(`  • ${sections.length} Sections`);
    console.log(`  • ${businessTypes.length} Business types (Hotel, Restaurant, Tour)`);
    console.log(`  • ${hotelFieldsCount} Fields for Hotel type`);
    
    console.log('\n🔐 ACL Permission Levels:');
    console.log('  • PUBLIC: Business name, description, contact, photos');
    console.log('  • VENDOR INTERNAL: Revenue, employee count, internal notes');
    console.log('  • ADMIN ONLY: Verification status, admin rating, admin notes');
    
    console.log('\n🧪 Test It:');
    console.log('  1. Login as admin: super@siwa.com / super123');
    console.log('  2. Go to: http://localhost:3000/admin/governance');
    console.log('  3. View Factory components and Hotel fields');
    console.log('  4. Login as vendor: vendor@siwa.com / vendor123');
    console.log('  5. See only permitted fields (admin fields hidden)');
    
    console.log('\n📚 Documentation:');
    console.log('  • Full Guide: FACTORY_FORM_BUILDER_GUIDE.md');
    console.log('  • Quick Reference: QUICK_REFERENCE_ACL.md');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('  1. Server is running: npm run dev');
    console.log('  2. You have logged in at least once (to create demo accounts)');
    console.log('  3. Database is set up correctly');
  }
}

// Run the seed script
seedExampleForms();
