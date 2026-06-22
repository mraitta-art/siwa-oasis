'use client';

import React from 'react';

export default function DiscountsPage() {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/approved/discounts')
      .then(r => r.json())
      .then(j => { if (j?.success) setItems(j.items || []); })
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🏷️ Special Discounts</h1>
        <p className="text-gray-400 mb-12">Save more with exclusive discounts from our partners</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#D4AF37] transition-colors">
              {item.hero_images?.[0] && (
                <img src={item.hero_images[0]} alt={item.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="text-sm text-[#D4AF37] font-semibold mb-2">{item.business_name}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{item.brief}</p>
                <p className="text-gray-300 text-sm mb-4">{item.description}</p>
                
                {item.images && item.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {item.images.slice(0, 3).map((u: string, i: number) => (
                      <img key={i} src={u} alt={`img-${i}`} className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}

                <button className="w-full px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No discounts available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
