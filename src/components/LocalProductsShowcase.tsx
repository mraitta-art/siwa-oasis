'use client';

import React from 'react';
import MasterCard from './MasterCard';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  imageUrl: string;
  origin: string;
  story?: string;
  link?: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'date-1',
    name: 'Siwan Organic Siwi Dates',
    category: 'Organic Gastronomy',
    price: '180 EGP / kg',
    description: 'Hand-picked organic honey dates, naturally sundried in traditional palm baskets in the heart of ancient orchards.',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=600',
    origin: 'Aghurmi Date Groves',
    story: 'Harvested under solar-aligned calendars utilizing ancestral water irrigation paths first mapped during the Roman era.',
    link: '/search/vibe?q=date-1',
  },
  {
    id: 'oil-1',
    name: 'Cold-Pressed Extra Virgin Olive Oil',
    category: 'Organic Gastronomy',
    price: '320 EGP / 500ml',
    description: 'Premium liquid gold extracted using local stone presses. Unfiltered, rich in anti-oxidants, and packed with desert minerals.',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600',
    origin: 'Cleopatra Orchard cooperative',
    story: 'Pressed within 4 hours of dawn harvesting to maintain a perfect 0.2% acidity index.',
    link: '/search/vibe?q=oil-1',
  },
  {
    id: 'salt-1',
    name: 'Therapeutic Crystalline Salt Lamp',
    category: 'Artisan Crafts',
    price: '450 EGP',
    description: 'Carved by hand from pure rock salt blocks extracted from the high-mineral therapeutic depths of the Salt Lakes.',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600',
    origin: 'Salt Cave Craft Guild',
    story: 'Known to emit healthy negative ions when warmed, purifying the air and encouraging deep meditative breathing.',
    link: '/search/vibe?q=salt-1',
  },
];

interface Props {
  products?: ProductItem[];
  title?: string;
  subtitle?: string;
}

export default function LocalProductsShowcase({ products, title, subtitle }: Props) {
  const [items, setItems] = React.useState<ProductItem[]>(products || []);
  const [loading, setLoading] = React.useState(!products);

  React.useEffect(() => {
    if (products && products.length > 0) return;
    
    async function fetchProducts() {
      try {
        const [poolResponse, productResponse, tradeResponse] = await Promise.all([
          fetch('/api/jana/homepage/pools?type=products'),
          fetch('/api/discovery/catalog?kind=product&limit=50'),
          fetch('/api/discovery/catalog?kind=trade_product&limit=50'),
        ]);
        const catalogItems = await Promise.all([productResponse, tradeResponse].map(async response => {
          if (!response.ok) return [];
          const data = await response.json().catch(() => []);
          return Array.isArray(data?.items) ? data.items : [];
        }));
        const catalogProducts: ProductItem[] = catalogItems.flat().map((item: any) => {
          const media = Array.isArray(item.media) ? item.media : [];
          return {
            id: String(item.id),
            name: item.title || 'Siwan Product',
            category: item.category_id || item.business_type_name || 'Local product',
            price: `${item.currency || 'EGP'} ${Number(item.price_amount || 0).toLocaleString()}`,
            description: item.description || 'Authentic product from a Siwa business.',
            imageUrl: media.find((entry: any) => entry?.url)?.url || '/images/siwa-default.jpg',
            origin: item.business_name || 'Siwify marketplace',
            story: item.category_specs?.values?.['sec_9_marketplace_catalog:product_story'] || '',
            link: item.business_slug ? `/p/${item.business_slug}` : '/search/vibe?category=crafts',
          };
        });

        if (poolResponse.ok) {
          const data = await poolResponse.json();
          const list: ProductItem[] = [];
          data.forEach((biz: any) => {
            const market = biz.custom_data?.sec_9_marketplace_catalog || {};
            const rawList = market.product_list || [];
            
            let parsedList: any[] = [];
            try {
              parsedList = typeof rawList === 'string' ? JSON.parse(rawList) : rawList;
            } catch (e) {
              if (typeof rawList === 'string' && rawList.trim().length > 10) {
                parsedList = [{
                  name: `Custom products at ${biz.name}`,
                  description: rawList,
                  price: 'Contact Vendor',
                  image: biz.custom_data?.sec_1_identity?.hero_image || ''
                }];
              }
            }

            if (Array.isArray(parsedList)) {
              parsedList.forEach((prod: any, idx: number) => {
                list.push({
                  id: `${biz.id}-prod-${idx}`,
                  name: prod.name || prod.product_name || 'Siwan Product',
                  category: prod.category || biz.type_name || 'Artisan Crafts',
                  price: prod.price || 'Contact for price',
                  description: prod.description || prod.product_desc || 'Authentic Siwa product.',
                  imageUrl: prod.image || prod.imageUrl || prod.url || biz.custom_data?.sec_1_identity?.hero_image || '/images/siwa-default.jpg',
                  origin: prod.origin || biz.name,
                  story: prod.story || prod.product_story || '',
                  link: `/p/${biz.slug}`
                });
              });
            }
          });

          const combined = [...catalogProducts, ...list];
          setItems(combined.length > 0 ? combined : DEFAULT_PRODUCTS);
        } else {
          setItems(catalogProducts.length > 0 ? catalogProducts : DEFAULT_PRODUCTS);
        }
      } catch (e) {
        console.warn("Failed to load dynamic products, using fallback", e);
        setItems(DEFAULT_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [products]);

  return (
    <div style={{ padding: '6rem 0', background: 'var(--bg)', borderTop: '1px solid var(--border-light)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--gold)', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
              {subtitle || 'LOCAL MARKETPLACE'}
            </span>
            <h2 style={{ color: 'var(--text)', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 900, margin: 0 }}>
              {title || 'Featured Local Products'}
            </h2>
          </div>
          <button
            onClick={() => window.location.href = '/search/vibe?category=crafts'}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '1px' }}
          >
            BROWSE MARKETPLACE <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {items.map(p => (
            <MasterCard
              key={p.id}
              title={p.name}
              description={p.description}
              image={p.imageUrl}
              tag={`${String(p.category || 'Product').toUpperCase()} • ${String(p.origin || 'Siwa').toUpperCase()}`}
              onCardClick={() => window.location.href = p.link || `/search/vibe?q=${p.id}`}
              links={[
                {
                  label: `Acquire: ${p.price}`,
                  icon: 'fa-shopping-bag',
                  onClick: () => window.location.href = p.link || `/search/vibe?q=${p.id}`,
                },
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
