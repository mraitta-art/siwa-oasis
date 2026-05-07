'use client';

import React from 'react';
import MasterCard from '@/components/MasterCard';

export default function CardDemoPage() {
  const handleCardClick = (id: string) => {
    alert(`Card ${id} clicked! Triggering main navigation...`);
  };

  const handleLinkClick = (action: string) => {
    alert(`Link Action: ${action} triggered! (Card click prevented)`);
  };

  return (
    <div style={{ padding: '4rem 2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>Cinematic Card System</h1>
          <p style={{ color: '#64748b' }}>Premium interactive cards with independent action propagation.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Card 1: Restaurant Example */}
          <MasterCard 
            title="Abdu Restaurant"
            description="The most famous charcoal-grilled lamb in the oasis, served under the ancient palms."
            image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200"
            tag="Dining"
            onCardClick={() => handleCardClick('Abdu')}
            links={[
              { label: 'View Menu', icon: 'fa-utensils', onClick: () => handleLinkClick('View Menu') },
              { label: 'Book Table', icon: 'fa-calendar-check', onClick: () => handleLinkClick('Book Table') }
            ]}
          />

          {/* Card 2: Adventure Example */}
          <MasterCard 
            title="Great Sand Sea Safari"
            description="Explore the endless dunes of the Sahara with expert local guides and 4x4 expeditions."
            image="https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=1200"
            tag="Adventure"
            onCardClick={() => handleCardClick('Safari')}
            links={[
              { label: 'Check Availability', icon: 'fa-clock', onClick: () => handleLinkClick('Check Availability') }
            ]}
          />

          {/* Card 3: Resort Example */}
          <MasterCard 
            title="Adrère Amellal"
            description="Experience true silence in this eco-lodge built entirely from salt and mud-brick."
            image="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=1200"
            tag="Luxury"
            onCardClick={() => handleCardClick('Resort')}
            links={[
              { label: 'Explore Rooms', icon: 'fa-bed', onClick: () => handleLinkClick('Explore Rooms') },
              { label: 'Contact', icon: 'fa-phone', onClick: () => handleLinkClick('Contact') }
            ]}
          />

        </div>

        {/* Detailed Layout: 2 Per Row */}
        <header style={{ margin: '5rem 0 3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b' }}>Detailed Experience Cards</h2>
          <p style={{ color: '#64748b' }}>Optimized for 2-per-row configurations with deep narrative details.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '3rem' }}>
          
          <MasterCard 
            variant="horizontal"
            title="Ancient Shali Heritage Walk"
            description="Journey through the 13th-century fortress of Shali. Our guides explain the unique 'kershef' architecture and the history of the Berber tribes that founded this unique mud-brick maze."
            image="https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&q=80&w=1200"
            tag="Cultural"
            onCardClick={() => handleCardClick('Shali')}
            links={[
              { label: 'Download Guide', icon: 'fa-file-pdf', onClick: () => handleLinkClick('Download Guide') },
              { label: 'Find a Guide', icon: 'fa-user-friends', onClick: () => handleLinkClick('Find a Guide') }
            ]}
          />

          <MasterCard 
            variant="horizontal"
            title="Salt Lake Therapy Session"
            description="Float in the crystal clear turquoise waters of the Siwa Salt Lakes. Known for their high salinity and healing properties, these lakes offer a weightless experience unlike anything else on earth."
            image="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=1200"
            tag="Wellness"
            onCardClick={() => handleCardClick('Salt Lakes')}
            links={[
              { label: 'Health Benefits', icon: 'fa-heartbeat', onClick: () => handleLinkClick('Health Benefits') },
              { label: 'Location Map', icon: 'fa-map-marked-alt', onClick: () => handleLinkClick('Location Map') }
            ]}
          />

        </div>
      </div>
    </div>
  );
}
