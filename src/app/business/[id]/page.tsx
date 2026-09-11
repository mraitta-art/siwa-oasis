'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import MinisiteQRCode from '@/components/MinisiteQRCode';

const NOISE_KEYS = new Set([
  'lat','lng','latitude','longitude','source_place_id','source_provider','source_origin',
  'source_id','source_url','google_maps_url','verification_status','imported_at',
  'photos','section_news','feature_on_main','youtube_story','name','section_blog',
  'mini_blog','section_gallery','business_name','google_place_id','business_logo','logo',
  'address','phone','website','rating','category','contact_phone','official_website','whatsapp','email'
]);

function sectionKind(sectionId: string) {
  const id = sectionId.toLowerCase();
  if (/basic|identity|info|about|overview|business_info/.test(id))       return 'basic';
  if (/vibe|ambien|atmosphere|style|mood|feel/.test(id))                 return 'vibe';
  if (/facilit|ameniti|equipment/.test(id))                              return 'facilities';
  if (/gastro|food|dining|menu|cuisine|kitchen|drink|beverage/.test(id)) return 'gastronomy';
  if (/experi|activit|tour|safari|adventure|outdoor|excurs/.test(id))    return 'experience';
  if (/connect|contact|reach|social|phone|whatsapp/.test(id))            return 'contact';
  if (/testimon|review|rating|feedback/.test(id))                        return 'reviews';
  if (/location|map|where|address|direction/.test(id))                   return 'location';
  if (/gallery|photo|media|image/.test(id))                              return 'gallery';
  if (/offer|deal|package|discount|promo|bundle/.test(id))               return 'offers';
  return 'generic';
}

function generateSectionSpecBlog(sectionId: string, sectionName: string, data: Record<string, unknown>, bizName: string): string {
  const kind = sectionKind(sectionId);
  const name = bizName || 'This establishment';

  if (kind === 'basic') {
    const desc = typeof data.description === 'string' ? data.description : `${name} is a verified eco-heritage establishment located in Siwa Oasis.`;
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Overview &amp; Establishment Specifications</h3>
      <p style="margin-bottom:1rem;">${desc}</p>
      <p>Combining traditional desert craftsmanship with modern hospitality standards, <strong>${name}</strong> serves as a comfortable base for exploring Siwa Oasis—from historic salt lakes and palm groves to the ancient Shali citadel.</p>
    `;
  }

  if (kind === 'vibe') {
    const vibe = typeof data.vibe === 'string' ? data.vibe : 'Authentic Siwan Eco';
    const arch = typeof data.architecture === 'string' ? data.architecture : 'Traditional Kershef &amp; Palm Wood';
    const atmos = typeof data.atmosphere === 'string' ? data.atmosphere : 'Serene Desert Oasis Setting';
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Vibe, Architecture &amp; Desert Aesthetics</h3>
      <p style="margin-bottom:1rem;">The ambience at <strong>${name}</strong> is defined by <em>${vibe}</em> design, crafted to blend harmoniously into the oasis landscape. Construction features <strong>${arch}</strong>—a centuries-old building technique using sun-dried salt rock, clay, and palm timbers that naturally insulates against desert temperature extremes.</p>
      <p>Guests enjoy a <em>${atmos}</em> featuring open-air relaxation courtyards, warm ambient lighting, and peaceful night acoustics.</p>
    `;
  }

  if (kind === 'facilities') {
    const wifi = data.wifi ? 'Complimentary WiFi' : 'Digital Detox Setting';
    const ac = data.air_conditioning ? 'Climate-Controlled Rooms' : 'Natural Kershef Passive Thermal Cooling';
    const pool = data.pool ? 'Natural Spring / Pool Access' : 'Proximity to Thermal Springs';
    const dining = data.restaurant_on_site ? 'On-Site Kitchen' : 'Local Dining Options';
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Amenities &amp; Facility Specifications</h3>
      <p style="margin-bottom:1rem;"><strong>${name}</strong> provides a range of amenities tailored for desert comfort:</p>
      <ul style="margin-left:1.5rem; margin-bottom:1rem; line-height:1.8;">
        <li><strong>Connectivity:</strong> ${wifi}</li>
        <li><strong>Climate Control:</strong> ${ac}</li>
        <li><strong>Water &amp; Relaxation:</strong> ${pool}</li>
        <li><strong>Gastronomy:</strong> ${dining}</li>
      </ul>
      <p>All facilities are operated in accordance with Siwa eco-preservation guidelines.</p>
    `;
  }

  if (kind === 'experience' || kind === 'gastronomy') {
    const type = typeof data.experience_type === 'string' ? data.experience_type : 'Desert Safaris &amp; Heritage Exploration';
    const dur = typeof data.duration === 'string' ? data.duration : 'Flexible Itineraries';
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Curated Experiences &amp; Guided Excursions</h3>
      <p style="margin-bottom:1rem;">Guests at <strong>${name}</strong> can arrange <em>${type}</em> across Siwa's landmark attractions. Excursions offer <strong>${dur}</strong> with experienced local Bedouin guides.</p>
      <p>Popular highlights include Great Sand Sea 4x4 safaris, sunset tea over Fatnas Island, therapeutic dips in natural salt lakes, and starlight desert fires.</p>
    `;
  }

  if (kind === 'location') {
    const addr = typeof data.address === 'string' ? data.address : 'Siwa Oasis, Matrouh Governorate, Egypt';
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Location &amp; Access Specifications</h3>
      <p style="margin-bottom:1rem;"><strong>${name}</strong> is situated at <em>${addr}</em>. Positioned among date palm groves and salt springs, the location offers direct access to key attractions:</p>
      <ul style="margin-left:1.5rem; margin-bottom:1rem; line-height:1.8;">
        <li><strong>Shali Fortress Ruins:</strong> ~10 minutes</li>
        <li><strong>Temple of the Oracle (Amun):</strong> ~12 minutes</li>
        <li><strong>Cleopatra Spring:</strong> ~15 minutes</li>
        <li><strong>Fatnas Island Sunset Viewpoint:</strong> Nearby</li>
      </ul>
    `;
  }

  if (kind === 'offers') {
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Seasonal Offers &amp; Group Package Specifications</h3>
      <p style="margin-bottom:1rem;"><strong>${name}</strong> features customizable stay packages, desert retreat bundles, and group excursion rates throughout the season.</p>
      <p>Enquire directly via WhatsApp or phone for current availability, group rates, and accommodation + safari bundles.</p>
    `;
  }

  if (kind === 'gallery') {
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Visual Archive &amp; Photographic Media</h3>
      <p style="margin-bottom:1rem;">Media archive highlighting the architectural details, surrounding palm gardens, and guest spaces of <strong>${name}</strong>.</p>
    `;
  }

  if (kind === 'reviews') {
    return `
      <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">Guest Impressions &amp; Service Standards</h3>
      <p style="margin-bottom:1rem;">Verified visitor impressions and guest reviews celebrating the authentic Bedouin hospitality at <strong>${name}</strong>.</p>
    `;
  }

  return `
    <h3 style="color:#1e293b; font-weight:800; margin-bottom:0.75rem;">${sectionName} Specifications</h3>
    <p>Specification overview and details for <strong>${name}</strong> (${sectionName}).</p>
  `;
}

function SectionBlogRenderer({ sectionId, sectionName, data, bizName }: { sectionId: string; sectionName: string; data: Record<string, unknown>; bizName: string }) {
  const customBlog = (data.section_blog || data.mini_blog || data.section_story) as string | undefined;
  const hasCustom = customBlog && typeof customBlog === 'string' && customBlog.trim().length > 20;

  if (hasCustom) {
    return (
      <div style={{ marginBottom: '2rem', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '1px' }}>
            ✍️ VENDOR PUBLISHED ARTICLE
          </span>
        </div>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: customBlog! }} style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.85 }} />
      </div>
    );
  }

  const autoBlog = generateSectionSpecBlog(sectionId, sectionName, data, bizName);
  return (
    <div style={{ marginBottom: '2rem', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#b8870a', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '1px' }}>
          ✨ AUTOMATED SECTION SPECIFICATIONS
        </span>
        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
          • Live auto-generated guide (vendor updates dynamically)
        </span>
      </div>
      <div className="rich-content" dangerouslySetInnerHTML={{ __html: autoBlog }} style={{ fontSize: '1.02rem', color: '#334155', lineHeight: 1.85 }} />
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: '#D4AF37', fontSize: '1.1rem', letterSpacing: 2 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, marginLeft: '0.4rem' }}>
        {value > 0 ? `${value}/5` : ''}
      </span>
    </span>
  );
}

function VibeChip({ label }: { label: string }) {
  return <span style={{ display:'inline-block', background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.4)', color:'#b8870a', padding:'0.4rem 1rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:800, marginRight:'0.5rem', marginBottom:'0.5rem' }}>{label}</span>;
}

function FacilityChip({ label, available }: { label: string; available: boolean }) {
  return <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:available?'#f0fdf4':'#f8fafc', border:`1px solid ${available?'#bbf7d0':'#e2e8f0'}`, borderRadius:'10px', padding:'0.65rem 1rem', fontSize:'0.8rem', fontWeight:700, color:available?'#166534':'#94a3b8' }}><span>{available?'✅':'❌'}</span>{label}</div>;
}

function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value || value === 'false' || value === 'null' || value === 'undefined') return null;
  return <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:'14px', padding:'1rem 1.25rem', display:'flex', gap:'0.75rem', alignItems:'flex-start' }}><span style={{ fontSize:'1.1rem' }}>{icon}</span><div><div style={{ fontSize:'0.58rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px', marginBottom:'0.2rem' }}>{label.replace(/_/g,' ').toUpperCase()}</div><div style={{ fontSize:'0.88rem', fontWeight:700, color:'#1e293b' }}>{value}</div></div></div>;
}

function BasicOverviewSection({ data, bizName }: { data: Record<string, unknown>; bizName: string }) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
          📍 Siwa Oasis Destination
        </span>
        <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
          🌿 Sustainable Heritage Unit
        </span>
        <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
          ⭐ SiWiFy.com Verified
        </span>
      </div>
    </div>
  );
}

function VibeSection({ data }: { data: Record<string, unknown> }) {
  const chips = ['vibe','atmosphere','architecture','style','mood','feel'].map(k=>data[k]).filter(v=>typeof v==='string'&&(v as string).trim()) as string[];
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
        {chips.map((c,i)=><VibeChip key={i} label={c}/>)}
        {chips.length===0 && <p style={{ color:'#94a3b8', fontStyle:'italic' }}>Ambience details coming soon.</p>}
      </div>
    </div>
  );
}

function FacilitiesSection({ data }: { data: Record<string, unknown> }) {
  const ICONS: Record<string,string> = { wifi:'📶', pool:'🏊', parking:'🅿️', air_conditioning:'❄️', restaurant_on_site:'🍽️', spa:'💆', gym:'🏋️', breakfast:'🍳' };
  const bools = Object.entries(data).filter(([k,v])=>!NOISE_KEYS.has(k)&&k!=='description'&&typeof v==='boolean');
  const texts = Object.entries(data).filter(([k,v])=>!NOISE_KEYS.has(k)&&k!=='description'&&typeof v==='string'&&(v as string).trim());
  return (
    <div>
      {bools.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {bools.map(([k,v])=><FacilityChip key={k} label={(ICONS[k]?ICONS[k]+' ':'')+k.replace(/_/g,' ')} available={Boolean(v)}/>)}
        </div>
      )}
      {texts.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          {texts.map(([k,v])=><InfoPill key={k} icon="✔️" label={k} value={String(v)}/>)}
        </div>
      )}
      {bools.length===0 && texts.length===0 && <p style={{ color:'#94a3b8', fontStyle:'italic' }}>Facilities checklist updated by vendor.</p>}
    </div>
  );
}

function ExperienceSection({ data, sectionName }: { data: Record<string, unknown>; sectionName: string }) {
  const tags   = ['experience_type','duration','suitable_for','difficulty'].map(k=>data[k]).filter(v=>typeof v==='string'&&(v as string).trim()) as string[];
  const extras = Object.entries(data).filter(([k,v])=>!NOISE_KEYS.has(k)&&!['experience_type','duration','suitable_for','difficulty','description'].includes(k)&&typeof v==='string'&&(v as string).trim());
  return (
    <div>
      {tags.length>0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.6rem', marginBottom:'1.5rem' }}>
          {tags.map((t,i)=><span key={i} style={{ background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', padding:'0.4rem 0.9rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:700 }}>{t}</span>)}
        </div>
      )}
      {extras.length>0 && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>{extras.map(([k,v])=><InfoPill key={k} icon="🎯" label={k} value={String(v)}/>)}</div>}
    </div>
  );
}

function ContactSection({ data, bizName }: { data: Record<string, unknown>; bizName: string }) {
  const phone   = (data.contact_phone||data.phone) as string|undefined;
  const whatsapp= (data.whatsapp||data.contact_phone||data.phone) as string|undefined;
  const website = (data.official_website||data.website) as string|undefined;
  const email   = data.email as string|undefined;
  const base: React.CSSProperties = { display:'flex', alignItems:'center', gap:'0.75rem', borderRadius:'14px', padding:'1.1rem 1.25rem', textDecoration:'none', fontWeight:700, fontSize:'0.88rem' };
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
        {phone    && <a href={`tel:${phone}`} style={{ ...base, background:'#fff', border:'1px solid #e2e8f0', color:'#1e293b' }}><span style={{ fontSize:'1.4rem' }}>📞</span><div><div style={{ fontSize:'0.6rem', color:'#94a3b8', fontWeight:900, letterSpacing:'1px', marginBottom:'0.1rem' }}>CALL</div>{phone}</div></a>}
        {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ ...base, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534' }}><span style={{ fontSize:'1.4rem' }}>💬</span><div><div style={{ fontSize:'0.6rem', color:'#22c55e', fontWeight:900, letterSpacing:'1px', marginBottom:'0.1rem' }}>WHATSAPP</div>{whatsapp}</div></a>}
        {website  && <a href={website.startsWith('http')?website:`https://${website}`} target="_blank" rel="noopener noreferrer" style={{ ...base, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8', wordBreak:'break-all' }}><span style={{ fontSize:'1.4rem' }}>🌐</span><div><div style={{ fontSize:'0.6rem', color:'#3b82f6', fontWeight:900, letterSpacing:'1px', marginBottom:'0.1rem' }}>WEBSITE</div>{website}</div></a>}
        {email    && <a href={`mailto:${email}`} style={{ ...base, background:'#fff', border:'1px solid #e2e8f0', color:'#1e293b' }}><span style={{ fontSize:'1.4rem' }}>✉️</span><div><div style={{ fontSize:'0.6rem', color:'#94a3b8', fontWeight:900, letterSpacing:'1px', marginBottom:'0.1rem' }}>EMAIL</div>{email}</div></a>}
      </div>
    </div>
  );
}

function ReviewsSection({ data }: { data: Record<string, unknown> }) {
  const rating = Number(data.rating)||0;
  const count  = Number(data.reviews_count)||0;
  const highlight = data.highlight as string|undefined;
  return (
    <div>
      {rating>0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', padding:'1.5rem', background:'#fff', borderRadius:'16px', border:'1px solid #f1f5f9' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem', fontWeight:900, color:'#1e293b', lineHeight:1 }}>{rating.toFixed(1)}</div>
            <StarRating value={rating}/>
            {count>0 && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:'0.35rem' }}>{count} review{count!==1?'s':''}</div>}
          </div>
          {highlight && <div style={{ flex:1, borderLeft:'3px solid #D4AF37', paddingLeft:'1.5rem' }}><p style={{ fontSize:'1rem', color:'#475569', margin:0, fontStyle:'italic', lineHeight:1.6 }}>{highlight}</p></div>}
        </div>
      ) : null}
    </div>
  );
}

function LocationSection({ data, bizName }: { data: Record<string, unknown>; bizName: string }) {
  const lat  = Number(data.lat)||Number(data.latitude)||0;
  const lng  = Number(data.lng)||Number(data.longitude)||0;
  const addr = data.address as string|undefined;
  const embed = lat&&lng?`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`:null;
  const maps  = lat&&lng?`https://www.google.com/maps?q=${lat},${lng}`:null;
  return (
    <div>
      {addr && <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem' }}><span>📍</span><span style={{ fontSize:'0.95rem', color:'#475569', fontWeight:600 }}>{addr}</span></div>}
      {embed && <div style={{ borderRadius:'16px', overflow:'hidden', border:'1px solid #e2e8f0', marginBottom:'1rem' }}><iframe src={embed} width="100%" height="320" style={{ border:0, display:'block' }} title={`Map of ${bizName}`} loading="lazy"/></div>}
      {maps  && <a href={maps} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#fff', border:'1px solid #D4AF37', color:'#D4AF37', padding:'0.6rem 1.25rem', borderRadius:'10px', fontSize:'0.8rem', fontWeight:800, textDecoration:'none' }}>🗺️ Open in Google Maps</a>}
    </div>
  );
}

function GallerySection({ data, bizName, removeWatermark }: { data: Record<string, unknown>; bizName: string; removeWatermark?: boolean }) {
  const gal = data.section_gallery;
  const hasPhotos = Array.isArray(gal) && gal.length > 0;
  return (
    <div>
      {hasPhotos ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1.25rem' }}>
          {(gal as any[]).map((item,i)=>{
            const imgUrl  = typeof item==='object'?item.url:item;
            const caption = typeof item==='object'?item.caption:'';
            return (
              <div key={i} style={{ borderRadius:'16px', overflow:'hidden', border:'1px solid #f1f5f9', background:'#fff', boxShadow:'0 4px 6px rgba(0,0,0,0.03)', position:'relative' }}>
                <div style={{ height:'160px', overflow:'hidden' }}>
                  <img src={imgUrl} alt={caption||`${bizName} photo ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  {!removeWatermark && (
                    <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(15,23,42,0.6)', color:'rgba(255,255,255,0.9)', padding:'2px 6px', borderRadius:'4px', fontSize:'0.45rem', fontWeight:900, letterSpacing:'1px' }}>
                      SiWiFy.com
                    </div>
                  )}
                </div>
                {caption && <div style={{ padding:'0.75rem 1rem', fontSize:'0.78rem', color:'#475569', fontWeight:600 }}>{caption}</div>}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function OffersSection({ data, bizName, phone }: { data: Record<string, unknown>; bizName: string; phone?: string }) {
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#fff8e6,#fff)', border: '1px solid #fde68a', borderRadius: '20px', padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'inline-block', background: '#d97706', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '0.25rem 0.65rem', borderRadius: '6px', letterSpacing: '1px', marginBottom: '0.5rem' }}>
            SEASONAL PACKAGES
          </div>
          <h4 style={{ margin: '0 0 0.35rem', color: '#1e293b', fontSize: '1.15rem', fontWeight: 900 }}>
            Exclusive Stays &amp; Safari Bundles
          </h4>
          <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>
            Contact {bizName} for room rates, desert excursion packages, and special group offers.
          </p>
        </div>
        {phone ? (
          <a href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            style={{ background: '#D4AF37', color: '#1e293b', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 900, textDecoration: 'none', fontSize: '0.85rem' }}>
            💬 Enquire for Deals
          </a>
        ) : null}
      </div>
    </div>
  );
}

function GenericSection({ data, sectionName }: { data: Record<string, unknown>; sectionName: string }) {
  const extras = Object.entries(data).filter(([k,v])=>!NOISE_KEYS.has(k)&&k!=='description'&&v!==null&&v!==undefined&&String(v).trim()!==''&&typeof v!=='object');
  const ICONS: Record<string,string> = { cuisine:'🍽️', vibe:'✨', architecture:'🏛️', atmosphere:'🌿', duration:'⏱️', suitable_for:'👥', experience_type:'🎯', highlight:'🏆' };
  return (
    <div>
      {extras.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.75rem' }}>
          {extras.map(([k,v])=><InfoPill key={k} icon={ICONS[k]||'ℹ️'} label={k} value={Array.isArray(v)?(v as any[]).join(', '):String(v)}/>)}
        </div>
      )}
    </div>
  );
}

function SectionContent({ sectionId, sectionName, data, bizName, removeWatermark, phone }: { sectionId:string; sectionName:string; data:Record<string,unknown>; bizName:string; removeWatermark?:boolean; phone?:string }) {
  const kind = sectionKind(sectionId);
  return (
    <div>
      {/* AUTOMATED / VENDOR SECTION BLOG */}
      <SectionBlogRenderer sectionId={sectionId} sectionName={sectionName} data={data} bizName={bizName} />

      {/* SECTION SPECIFIC UI CONTROL WIDGETS */}
      {kind==='basic'      && <BasicOverviewSection data={data} bizName={bizName} />}
      {kind==='vibe'       && <VibeSection data={data}/>}
      {kind==='facilities' && <FacilitiesSection data={data}/>}
      {(kind==='gastronomy'||kind==='experience') && <ExperienceSection data={data} sectionName={sectionName}/>}
      {kind==='contact'    && <ContactSection data={data} bizName={bizName}/>}
      {kind==='reviews'    && <ReviewsSection data={data}/>}
      {kind==='location'   && <LocationSection data={data} bizName={bizName}/>}
      {kind==='gallery'    && <GallerySection data={data} bizName={bizName} removeWatermark={removeWatermark} />}
      {kind==='offers'     && <OffersSection data={data} bizName={bizName} phone={phone} />}
      {kind==='generic'    && <GenericSection data={data} sectionName={sectionName}/>}
    </div>
  );
}

export default function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }                              = React.use(params);
  const [biz, setBiz]                       = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [activeSections, setActiveSections] = useState<any[]>([]);
  const [activeTab, setActiveTab]           = useState<string|null>(null);
  const [siteSettings, setSiteSettings]     = useState<any>(null);

  useEffect(() => { if (activeSections.length>0&&!activeTab) setActiveTab(activeSections[0].id); }, [activeSections, activeTab]);

  useEffect(() => {
    async function loadData() {
      try {
        const [bizData, mainSiteData] = await Promise.all([
          fetch(`/api/businesses/${id}`).then(r=>r.json()),
          fetch('/api/jana/website?id=website_main').then(r=>r.ok?r.json():null).catch(()=>null)
        ]);
        setBiz(bizData);
        const mainCfg = Array.isArray(mainSiteData) ? mainSiteData[0] : mainSiteData;
        if (mainCfg?.site_settings) setSiteSettings(mainCfg.site_settings);

        let sections: any[] = await fetch(`/api/jana/sections?type=${bizData.type_id}`).then(r=>r.json());
        const selectedIds: string[]|undefined = bizData.custom_data?.active_minisite_sections;
        if (Array.isArray(selectedIds)&&selectedIds.length>0) sections = sections.filter((s:any)=>selectedIds.includes(s.id));
        
        setActiveSections(sections);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) return <div style={{ background:'#0f172a', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#fff' }}><i className="fas fa-circle-notch fa-spin fa-3x" style={{ color:'#D4AF37', marginBottom:'1.5rem' }}></i><span style={{ fontSize:'0.8rem', letterSpacing:'2px', fontWeight:700, opacity:0.5 }}>GENERATING MINISITE...</span></div>;
  if (!biz) return <div style={{ textAlign:'center', padding:'5rem' }}><h3>Business not found</h3><Link href="/">Back home</Link></div>;

  const data     = biz.custom_data||{};
  const curation = biz.curation_data?(typeof biz.curation_data==='string'?JSON.parse(biz.curation_data):biz.curation_data):{};
  const vals     = Object.values(data) as any[];
  const dynPhone   = data.contact?.phone  ||vals.find((s:any)=>s?.phone)?.phone  ||vals.find((s:any)=>s?.contact_phone)?.contact_phone||'';
  const dynEmail   = data.contact?.email  ||vals.find((s:any)=>s?.email)?.email  ||'';
  const dynAddress = data.location?.address||vals.find((s:any)=>s?.address)?.address||'Siwa Oasis, Matrouh, Egypt';
  const dynWebsite = data.contact?.website||vals.find((s:any)=>s?.website)?.website||vals.find((s:any)=>s?.official_website)?.official_website||'';
  const dynRating  = data.google_contribution?.rating||vals.find((s:any)=>typeof s?.rating==='number'&&s.rating>0)?.rating||0;
  const dynLogo    = data.business_logo||data.logo||vals.find((s:any)=>s?.business_logo)?.business_logo||vals.find((s:any)=>s?.logo)?.logo||undefined;
  const activeSection = activeSections.find(s=>s.id===activeTab);
  const activeSecData = activeTab?(data[activeTab]||{}):{};

  const platformName = siteSettings?.site_name || 'SiWiFy.com';
  const platformLogo = siteSettings?.logo_url;

  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh', paddingBottom:'5rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org','@type':'LocalBusiness', name:biz.name, description:(data.basic?.description||biz.name+' in Siwa Oasis'), telephone:dynPhone, url:dynWebsite||`https://siwify.com/business/${id}`, address:{'@type':'PostalAddress',streetAddress:dynAddress,addressLocality:'Siwa Oasis',addressRegion:'Matrouh',addressCountry:'EG'}, ...(dynRating>0?{aggregateRating:{'@type':'AggregateRating',ratingValue:dynRating,bestRating:5}}:{}) }) }} />

      {/* HERO */}
      <AutomatedMinisiteHero businessName={biz.name} businessLogo={biz.tier_features?.allow_custom_logo?dynLogo:undefined} activeSections={activeSections} customData={data} curationData={curation} tierFeatures={{ hero_automation:true, remove_watermark:biz.tier_features?.remove_watermark, allow_youtube_story:biz.tier_features?.allow_youtube_story }} settings={siteSettings || {}}/>

      {/* QUICK INFO STRIP */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f1f5f9', padding:'0.85rem 0' }}>
        <div className="container" style={{ display:'flex', flexWrap:'wrap', gap:'1.25rem', alignItems:'center', justifyContent:'center' }}>
          {dynAddress&&<div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'#475569' }}><span>📍</span><span>{dynAddress}</span></div>}
          {dynPhone&&<a href={`tel:${dynPhone}`} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'#1d4ed8', textDecoration:'none', fontWeight:700 }}><span>📞</span><span>{dynPhone}</span></a>}
          {dynWebsite&&<a href={dynWebsite.startsWith('http')?dynWebsite:`https://${dynWebsite}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'#1d4ed8', textDecoration:'none', fontWeight:700 }}><span>🌐</span><span>Website</span></a>}
          {dynRating>0&&<StarRating value={dynRating}/>}
        </div>
      </div>

      {/* STICKY SECTION NAV */}
      {activeSections.length>0&&(
        <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', padding:'0 1rem' }}>
          <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:900, fontSize:'0.85rem', color:'#1e293b', letterSpacing:'1px', padding:'1rem 0', flexShrink:0 }}>{(biz?.name||'').toUpperCase()}</div>
            <div style={{ display:'flex', overflowX:'auto', flexShrink:1 }}>
              {activeSections.map(s=>(
                <button key={s.id} onClick={()=>setActiveTab(s.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'1rem 0.9rem', color:activeTab===s.id?'#D4AF37':'#64748b', fontSize:'0.68rem', fontWeight:900, letterSpacing:'0.8px', borderBottom:activeTab===s.id?'2px solid #D4AF37':'2px solid transparent', transition:'all 0.2s', whiteSpace:'nowrap' }}>
                  {s.icon&&<i className={`fas ${s.icon}`} style={{ marginRight:'0.35rem' }}/>}
                  {(s?.name||'').toUpperCase()}
                </button>
              ))}
            </div>
            <Link href="/" style={{ whiteSpace:'nowrap', fontSize:'0.65rem', padding:'0.4rem 0.75rem', border:'1px solid #D4AF37', color:'#D4AF37', borderRadius:'6px', textDecoration:'none', fontWeight:800, flexShrink:0 }}>
              {platformLogo ? <img src={platformLogo} alt={platformName} style={{ height:'14px', objectFit:'contain' }} /> : platformName}
            </Link>
          </div>
        </nav>
      )}

      {/* CONTENT */}
      <div className="container" style={{ maxWidth:'1200px', padding:'3rem 1.5rem' }}>
        {biz.components&&Array.isArray(biz.components)?(
          <div style={{ display:'flex', flexDirection:'column', gap:'4rem' }}>
            {biz.components.map((c:any)=>{
              if (['hero_carousel','hero','cinematic_carousel'].includes(c.type)) return <div key={c.id}><AdvancedHeroCarousel carouselName={c.props?.carouselName||`biz_${id}_${c.id}`} height={c.props?.height||'60vh'} autoPlay/></div>;
              return <div key={c.id}>Component: {c.type}</div>;
            })}
          </div>
        ):(
          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'3rem', alignItems:'start' }}>
            <main>
              {activeSection?(
                <section className="animate-in fade-in duration-500">
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'2rem', paddingBottom:'1.25rem', borderBottom:'2px solid #f1f5f9' }}>
                    <div style={{ width:'48px', height:'48px', background:'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)' }}><i className={`fas ${activeSection.icon||'fa-layer-group'}`}/></div>
                    <div><h2 style={{ margin:0, fontSize:'1.4rem', fontWeight:900, color:'#1e293b' }}>{activeSection.name}</h2><div style={{ height:'3px', width:'36px', background:'linear-gradient(90deg,#D4AF37,#F5D87A)', borderRadius:'999px', marginTop:'0.5rem' }}/></div>
                  </div>
                  <SectionContent sectionId={activeSection.id} sectionName={activeSection.name} data={activeSecData} bizName={biz.name} removeWatermark={biz.tier_features?.remove_watermark} phone={dynPhone} />
                </section>
              ):(
                <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#94a3b8' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🏜️</div>
                  <h3 style={{ fontWeight:800, color:'#64748b' }}>Profile being prepared</h3>
                  <p>Detailed information about {biz.name} is coming soon.</p>
                </div>
              )}
            </main>

            <aside style={{ position:'sticky', top:'80px' }}>
              <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', padding:'2rem', borderRadius:'20px', color:'#fff', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.3)', marginBottom:'1.5rem' }}>
                <h3 style={{ margin:'0 0 0.25rem', fontSize:'1.1rem', fontWeight:900 }}>Contact</h3>
                <p style={{ fontSize:'0.78rem', opacity:0.5, margin:'0 0 1.5rem' }}>{biz.name}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.75rem' }}>
                  {dynPhone   && <a href={`tel:${dynPhone}`} style={{ display:'flex', gap:'0.75rem', alignItems:'center', textDecoration:'none', color:'#fff' }}><span style={{ color:'#D4AF37', width:'20px', textAlign:'center' }}>📞</span><span style={{ fontSize:'0.85rem', fontWeight:700 }}>{dynPhone}</span></a>}
                  {dynEmail   && <a href={`mailto:${dynEmail}`} style={{ display:'flex', gap:'0.75rem', alignItems:'center', textDecoration:'none', color:'#fff' }}><span style={{ color:'#D4AF37', width:'20px', textAlign:'center' }}>✉️</span><span style={{ fontSize:'0.85rem', fontWeight:700 }}>{dynEmail}</span></a>}
                  {dynAddress && <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}><span style={{ color:'#D4AF37', width:'20px', textAlign:'center', marginTop:'0.1rem' }}>📍</span><span style={{ fontSize:'0.8rem', opacity:0.8, lineHeight:1.5 }}>{dynAddress}</span></div>}
                </div>
                {dynPhone?<a href={`https://wa.me/${dynPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display:'block', textAlign:'center', padding:'0.9rem', borderRadius:'12px', fontWeight:900, background:'#D4AF37', color:'#1e293b', textDecoration:'none', fontSize:'0.85rem' }}>💬 WhatsApp</a>:<button style={{ width:'100%', padding:'0.9rem', borderRadius:'12px', fontWeight:900, background:'#D4AF37', color:'#1e293b', border:'none', cursor:'pointer' }}>Enquire Now</button>}
              </div>

              {data.location?.lat&&data.location?.lng&&(
                <div style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', border:'1px solid #e2e8f0', marginBottom:'1.5rem' }}>
                  <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(data.location.lng)-0.008},${Number(data.location.lat)-0.008},${Number(data.location.lng)+0.008},${Number(data.location.lat)+0.008}&layer=mapnik&marker=${data.location.lat},${data.location.lng}`} width="100%" height="170" style={{ border:0, display:'block' }} title="Location" loading="lazy"/>
                  <div style={{ padding:'0.65rem 1rem' }}><a href={`https://www.google.com/maps?q=${data.location.lat},${data.location.lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.72rem', fontWeight:800, color:'#D4AF37', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.35rem' }}>🗺️ Open in Google Maps</a></div>
                </div>
              )}

              {dynRating>0&&<div style={{ background:'#fff', padding:'1.25rem', borderRadius:'16px', border:'1px solid #f1f5f9', marginBottom:'1.5rem', textAlign:'center' }}><div style={{ fontSize:'0.6rem', fontWeight:900, color:'#94a3b8', letterSpacing:'1px', marginBottom:'0.5rem' }}>SOURCE RATING</div><StarRating value={dynRating}/></div>}

              {biz.tier_features?.show_verified_badge&&<div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1.25rem', background:'#f0fdf4', borderRadius:'16px', border:'1px solid #bbf7d0', marginBottom:'1.5rem' }}><div style={{ color:'#22c55e', fontSize:'1.5rem' }}>✅</div><div><div style={{ fontWeight:900, fontSize:'0.72rem', color:'#166534' }}>SIWA TRUST VERIFIED</div><div style={{ fontSize:'0.62rem', color:'#4ade80' }}>Inspected and certified heritage unit.</div></div></div>}
            </aside>
          </div>
        )}
      </div>

      <footer style={{ background:'#0f172a', padding:'5rem 0', color:'#fff', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'3rem' }}><MinisiteQRCode businessName={biz.name||`${platformName} Minisite`} businessId={biz.id} targetUrl={typeof window!=='undefined'?`${window.location.origin}/${biz.slug||`business/${id}`}`:undefined} compact/></div>
        <div style={{ fontWeight:900, letterSpacing:'4px', fontSize:'1.5rem', marginBottom:'1rem' }}>
          {platformLogo ? <img src={platformLogo} alt={platformName} style={{ height:'40px', objectFit:'contain', margin:'0 auto' }} /> : platformName}
        </div>
        <p style={{ opacity:0.4, fontSize:'0.75rem' }}>Automated Cinematic Minisite Engine v5.0</p>
      </footer>
    </div>
  );
}