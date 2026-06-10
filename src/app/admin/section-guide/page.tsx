'use client';

export default function SectionSystemGuidePage() {
  const S = {
    container: {
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      padding: '3rem 2rem'
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '1rem',
      textAlign: 'center' as const
    },
    subtitle: {
      fontSize: '1.3rem',
      color: '#aaa',
      textAlign: 'center' as const,
      marginBottom: '3rem',
      maxWidth: '800px',
      margin: '0 auto 3rem'
    },
    section: {
      background: '#2a2a2a',
      border: '1px solid #556B2F',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    workflowSteps: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    step: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '8px',
      padding: '1.5rem',
      textAlign: 'center' as const
    },
    stepNumber: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '0.5rem'
    },
    stepTitle: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '0.75rem'
    },
    stepDesc: {
      color: '#aaa',
      fontSize: '0.9rem',
      lineHeight: '1.5'
    },
    linkSection: {
      background: '#556B2F',
      border: '1px solid #D4AF37',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem'
    },
    linkGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem'
    },
    linkCard: {
      background: '#1a1a1a',
      border: '1px solid #D4AF37',
      borderRadius: '8px',
      padding: '1.5rem',
      textDecoration: 'none',
      color: '#fff',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    linkCardTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '0.75rem'
    },
    linkCardDesc: {
      color: '#aaa',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    },
    linkCardButton: {
      display: 'inline-block',
      background: '#D4AF37',
      color: '#1a1a1a',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      fontWeight: 'bold',
      textDecoration: 'none',
      marginTop: '0.5rem'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    feature: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F'
    },
    featureTitle: {
      color: '#D4AF37',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    featureDesc: {
      color: '#aaa',
      fontSize: '0.85rem'
    },
    code: {
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      padding: '1rem',
      fontFamily: 'monospace',
      color: '#D4AF37',
      overflowX: 'auto' as const,
      marginTop: '1rem',
      fontSize: '0.9rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '1rem'
    },
    tableHeader: {
      background: '#1a1a1a',
      borderBottom: '2px solid #D4AF37',
      padding: '1rem',
      textAlign: 'left' as const,
      fontWeight: 'bold',
      color: '#D4AF37'
    },
    tableCell: {
      padding: '1rem',
      borderBottom: '1px solid #556B2F'
    }
  };

  return (
    <div style={S.container}>
      <div style={S.maxWidth}>
        <div style={S.header}>📋 Section Management System Guide</div>
        <div style={S.subtitle}>
          Complete workflow for admins to create sections with components, and vendors to fill in content
        </div>

        {/* Overview */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🎯 System Overview</div>
          <p style={{ color: '#ddd', lineHeight: '1.8', marginBottom: '1rem' }}>
            This system allows admins to create business sections with pre-configured components (Location, Hours, Team, etc.), 
            and vendors to fill in their business details directly through an intuitive interface. The content automatically 
            builds the mini site sections.
          </p>
          <div style={S.features}>
            <div style={S.feature}>
              <div style={S.featureTitle}>✅ Auto-Features</div>
              <div style={S.featureDesc}>Mini blog + Gallery + Image curation</div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🔧 Customizable</div>
              <div style={S.featureDesc}>8+ component templates to choose from</div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🎨 Flexible</div>
              <div style={S.featureDesc}>Repeatable components, custom fields</div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🛡️ Controlled</div>
              <div style={S.featureDesc}>Admin approval policies + permissions</div>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🔄 Complete Workflow</div>
          
          <div style={S.workflowSteps}>
            <div style={S.step}>
              <div style={S.stepNumber}>1️⃣</div>
              <div style={S.stepTitle}>Admin Creates Section</div>
              <div style={S.stepDesc}>Define section name, icon, features (blog, gallery), and approval policy</div>
            </div>

            <div style={S.step}>
              <div style={S.stepNumber}>2️⃣</div>
              <div style={S.stepTitle}>Admin Adds Components</div>
              <div style={S.stepDesc}>Select from Location, Hours, Team, Testimonials, FAQ, Features, Pricing, Gallery</div>
            </div>

            <div style={S.step}>
              <div style={S.stepNumber}>3️⃣</div>
              <div style={S.stepTitle}>Vendor Fills Components</div>
              <div style={S.stepDesc}>Vendors complete component data (address, hours, team members, etc.)</div>
            </div>

            <div style={S.step}>
              <div style={S.stepNumber}>4️⃣</div>
              <div style={S.stepTitle}>Admin Curates Images</div>
              <div style={S.stepDesc}>Approve vendor images and set which ones appear in hero carousel</div>
            </div>

            <div style={S.step}>
              <div style={S.stepNumber}>5️⃣</div>
              <div style={S.stepTitle}>Vendor Writes Blogs</div>
              <div style={S.stepDesc}>Create blog posts for the section (auto-publish or approval pending)</div>
            </div>

            <div style={S.step}>
              <div style={S.stepNumber}>6️⃣</div>
              <div style={S.stepTitle}>Section Goes Live</div>
              <div style={S.stepDesc}>Minisite displays all components, images, and blog posts automatically</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={S.linkSection}>
          <div style={S.sectionTitle}>🚀 Quick Access Links</div>
          
          <div style={S.linkGrid}>
            {/* Admin Links */}
            <a href="/admin/sections/create" style={S.linkCard}>
              <div style={S.linkCardTitle}>👨‍💼 Admin: Create Section</div>
              <div style={S.linkCardDesc}>
                Start here to create a new business section with features and settings
              </div>
              <div style={S.linkCardButton}>→ Create Section</div>
            </a>

            <a href="/admin/image-curation" style={S.linkCard}>
              <div style={S.linkCardTitle}>🖼️ Admin: Curate Images</div>
              <div style={S.linkCardDesc}>
                Approve/reject vendor images and select which ones appear in hero carousel
              </div>
              <div style={S.linkCardButton}>→ View Gallery</div>
            </a>

            <a href="/admin/blog-approval" style={S.linkCard}>
              <div style={S.linkCardTitle}>📝 Admin: Approve Blogs</div>
              <div style={S.linkCardDesc}>
                Review and approve vendor blog posts before they go live
              </div>
              <div style={S.linkCardButton}>→ Review Blogs</div>
            </a>

            {/* Vendor Links */}
            <a href="/vendor/components-editor" style={S.linkCard}>
              <div style={S.linkCardTitle}>📋 Vendor: Fill Components</div>
              <div style={S.linkCardDesc}>
                Fill in location, hours, team, testimonials and other section components
              </div>
              <div style={S.linkCardButton}>→ Edit Components</div>
            </a>

            <a href="/vendor/media" style={S.linkCard}>
              <div style={S.linkCardTitle}>📸 Vendor: Upload Images</div>
              <div style={S.linkCardDesc}>
                Upload photos directly from mobile camera or select from files
              </div>
              <div style={S.linkCardButton}>→ Upload Media</div>
            </a>

            <a href="/vendor/content-manager" style={S.linkCard}>
              <div style={S.linkCardTitle}>✍️ Vendor: Write Blogs</div>
              <div style={S.linkCardDesc}>
                Create and publish blog posts for each section of your minisite
              </div>
              <div style={S.linkCardButton}>→ Write Blog</div>
            </a>
          </div>
        </div>

        {/* Component Templates */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🔧 Available Component Templates</div>
          
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.tableHeader}>Component Type</th>
                <th style={S.tableHeader}>Use Case</th>
                <th style={S.tableHeader}>Repeatable</th>
                <th style={S.tableHeader}>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.tableCell}><strong>📍 Location</strong></td>
                <td style={S.tableCell}>Business address with map coordinates</td>
                <td style={S.tableCell}>No</td>
                <td style={S.tableCell}>Dubai Marina Office</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>🕐 Hours</strong></td>
                <td style={S.tableCell}>Operating hours by day</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>Mon 9AM-9PM, Sat 10AM-6PM</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>👥 Team Member</strong></td>
                <td style={S.tableCell}>Staff profile with photo and bio</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>Ahmed - Manager</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>⭐ Testimonial</strong></td>
                <td style={S.tableCell}>Customer reviews and feedback</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>5-star reviews</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>❓ FAQ</strong></td>
                <td style={S.tableCell}>Frequently asked questions</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>Q: Hours? A: 9-9 Daily</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>✨ Feature</strong></td>
                <td style={S.tableCell}>Product/service highlights</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>24/7 Support</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>💰 Pricing</strong></td>
                <td style={S.tableCell}>Service tiers and costs</td>
                <td style={S.tableCell}>Yes</td>
                <td style={S.tableCell}>Gold Package - 599 AED</td>
              </tr>
              <tr>
                <td style={S.tableCell}><strong>🎨 Gallery</strong></td>
                <td style={S.tableCell}>Curated image showcases</td>
                <td style={S.tableCell}>No</td>
                <td style={S.tableCell}>Project portfolio</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Admin Workflow Details */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👨‍💼 Admin Workflow (Step by Step)</div>
          
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 1: Create Section</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Go to: <strong>/admin/sections/create</strong></p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>✍️ Enter section name (e.g., "Gallery", "Services", "Team")</li>
              <li>🔧 Choose icon and description</li>
              <li>✅ Enable: Mini Blog? Image Gallery?</li>
              <li>🛡️ Set approval policy: Auto-Approve / Manual Review / Admin Only</li>
              <li>👥 Configure vendor permissions</li>
              <li>📝 Add content guidelines for vendors</li>
              <li>💾 Click "Create Section with Features"</li>
            </ul>
          </div>

          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 2: Select Components</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Auto-redirected after creating section</p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>🔍 Browse available component templates</li>
              <li>☑️ Click to select which components vendors should fill</li>
              <li>⚙️ For each selected component:</li>
              <li style={{ marginLeft: '1rem' }}>• Mark as Required (vendor must fill)</li>
              <li style={{ marginLeft: '1rem' }}>• Allow Multiple? (repeatable components)</li>
              <li style={{ marginLeft: '1rem' }}>• Set max items if repeatable</li>
              <li>✅ Click "Add X Components"</li>
            </ul>
          </div>

          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 3: Curate & Approve</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Go to: <strong>/admin/image-curation</strong> and <strong>/admin/blog-approval</strong></p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>🖼️ Review vendor-uploaded images</li>
              <li>✅ Approve images to show in hero carousel</li>
              <li>⭐ Mark approved images as "Hero" to feature on minisite</li>
              <li>📝 Review blog posts submitted by vendors</li>
              <li>✅ Approve or reject blogs with optional feedback</li>
            </ul>
          </div>
        </div>

        {/* Vendor Workflow Details */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👨‍💼 Vendor Workflow (Step by Step)</div>
          
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 1: Fill in Components</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Go to: <strong>/vendor/components-editor</strong></p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>📋 Select a section from sidebar</li>
              <li>📝 Fill in each component's data (Location, Hours, Team, etc.)</li>
              <li>🔄 For repeatable components: Click "Add Another [Component]"</li>
              <li>💾 Click "Save All Components"</li>
              <li>✅ Components appear on your minisite automatically</li>
            </ul>
          </div>

          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 2: Upload Images</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Go to: <strong>/vendor/media</strong></p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>📸 Direct mobile camera capture (click camera icon)</li>
              <li>🖱️ Drag and drop images or select files</li>
              <li>📋 Select which section each image belongs to</li>
              <li>⭐ Mark important images as "Hero" (for hero carousel)</li>
              <li>⏳ Wait for admin approval (status shows: Pending/Approved/Rejected)</li>
              <li>✅ Approved images appear on minisite</li>
            </ul>
          </div>

          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Step 3: Write Blogs</h3>
            <p style={{ color: '#ddd', marginBottom: '0.75rem' }}>Go to: <strong>/vendor/content-manager</strong></p>
            <ul style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>📋 Select a section</li>
              <li>✍️ Click "Write Blog" tab</li>
              <li>📝 Enter title, excerpt, and content</li>
              <li>✅ Click "Publish Blog"</li>
              <li>⏳ Auto-published OR awaits admin approval (depends on policy)</li>
              <li>🎉 Blog appears on minisite section</li>
            </ul>
          </div>
        </div>

        {/* Features Summary */}
        <div style={S.section}>
          <div style={S.sectionTitle}>✨ Key Features</div>
          
          <div style={S.features}>
            <div style={S.feature}>
              <div style={S.featureTitle}>🎯 Auto-Setup</div>
              <div style={S.featureDesc}>
                When admin creates a section, mini blog + gallery features auto-included
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>📋 Components</div>
              <div style={S.featureDesc}>
                8+ pre-built templates (Location, Hours, Team, Testimonials, FAQ, Features, Pricing, Gallery)
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🔄 Repeatable</div>
              <div style={S.featureDesc}>
                Vendors can add multiple team members, hours entries, testimonials, etc.
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>📱 Mobile First</div>
              <div style={S.featureDesc}>
                Direct camera upload from mobile devices for easy image capture
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🛡️ Approval Policy</div>
              <div style={S.featureDesc}>
                Auto-approve, manual review, or admin-only content submission
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🎨 Hero Curation</div>
              <div style={S.featureDesc}>
                Admin selects which images appear in hero carousel on minisite
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>📝 Blogs</div>
              <div style={S.featureDesc}>
                Vendors write section-specific blog posts with approval workflow
              </div>
            </div>
            <div style={S.feature}>
              <div style={S.featureTitle}>🚀 Auto-Display</div>
              <div style={S.featureDesc}>
                All components, images, and blogs automatically build the minisite
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div style={{ ...S.section, textAlign: 'center' as const }}>
          <div style={S.sectionTitle}>❓ Need Help?</div>
          <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
            This system provides a complete workflow from section creation to live minisite display.
            <br />
            Start with the admin links above to create your first section.
          </p>
          <a href="/admin/sections/create" style={{
            display: 'inline-block',
            background: '#D4AF37',
            color: '#1a1a1a',
            padding: '1rem 2rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: '1.1rem'
          }}>
            🚀 Create Your First Section
          </a>
        </div>
      </div>
    </div>
  );
}
