'use client';

import React, { useEffect, useState } from 'react';

export interface LocationMapProps {
  businessName: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  googleMapsUrl?: string;
  businessType?: string; // 'accommodation' | 'transportation' | 'experience' | 'dining' | string
  accessibilityNotes?: string;
  stationHubName?: string;
  stationaryUnitCode?: string; // e.g. "Bungalow #4", "Tent #12"
  primaryColor?: string;
  ar?: boolean; // Arabic-primary mode (minisite locale toggle)
  businessId?: string; // used to fetch dynamic nearby landmarks
}

interface NearbyLandmark {
  name: string;
  distKm: number;
  primaryType?: string;
}

// Choose an icon from the returned Google primary type, falling back to a pin.
function landmarkIcon(primaryType?: string): string {
  const type = String(primaryType || '');
  if (type.includes('museum')) return '🏛️';
  if (type.includes('park')) return '🌳';
  if (type.includes('natural') || type.includes('beach')) return '🏜️';
  if (type.includes('tourist_attraction')) return '✨';
  if (type.includes('place_of_worship')) return '🕌';
  return '📍';
}

export default function MinisiteLocationMap({
  businessName,
  address,
  latitude,
  longitude,
  googleMapsUrl,
  businessType = 'accommodation',
  accessibilityNotes,
  stationHubName,
  stationaryUnitCode,
  primaryColor = '#D4AF37',
  ar = false,
  businessId,
}: LocationMapProps) {
  const L = ar
    ? {
        access: 'الموقع وطرق الوصول',
        transport: 'محطة الانطلاق ومسار الالتقاط',
        badge: 'إحداثيات موثّقة',
        gps: 'إحداثيات GPS',
        routingActive: 'توجيه GPS مباشر • روابط الملاحة بنقرة واحدة بالأسفل',
        navGoogle: 'الاتجاهات عبر خرائط Google',
        navWaze: 'Waze',
        navApple: 'خرائط Apple',
        proximity: 'أبرز المعالم القريبة',
        km: 'كم',
        unit: 'الوحدة',
        addressNotSet: 'لم يتم تحديد العنوان بعد',
      }
    : {
        access: 'Stationary Location & Access',
        transport: 'Base Station & Pickup Route',
        badge: 'Verified Coordinates',
        gps: 'GPS Pin',
        routingActive: 'Direct GPS routing active • 1-click navigation links below',
        navGoogle: 'Google Maps Navigate',
        navWaze: 'Waze',
        navApple: 'Apple Maps',
        proximity: 'Nearby highlights',
        km: 'km',
        unit: 'Unit',
        addressNotSet: 'Address not set yet',
      };

  // Coordinates come only from the business record — no Siwa fallback. When they
  // are absent we render an address-based map instead of a fake pin.
  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const lat = Number.isFinite(parsedLat) ? parsedLat : null;
  const lng = Number.isFinite(parsedLng) ? parsedLng : null;
  const hasCoordinates =
    lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const trimmedAddress = String(address || '').trim();
  const displayAddress = trimmedAddress || L.addressNotSet;

  // Navigation links: pin by coordinates when present, otherwise search by name
  // and address (never a hardcoded place name).
  const mapsSearchQuery = hasCoordinates
    ? `${lat},${lng}`
    : encodeURIComponent(trimmedAddress ? `${businessName} ${trimmedAddress}` : `${businessName}, Egypt`);

  const directGoogleMapsLink = googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;
  const directWazeLink = hasCoordinates
    ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://waze.com/ul?q=${mapsSearchQuery}&navigate=yes`;
  const directAppleMapsLink = hasCoordinates
    ? `https://maps.apple.com/?ll=${lat},${lng}&q=${mapsSearchQuery}`
    : `https://maps.apple.com/?q=${mapsSearchQuery}`;

  const isTransport = String(businessType).toLowerCase().includes('transport') ||
                      String(businessType).toLowerCase().includes('safari') ||
                      String(businessType).toLowerCase().includes('car') ||
                      String(businessType).toLowerCase().includes('transfer');

  // Dynamic neighbourhood highlights, fetched once per business and cached
  // server-side. Language switching just picks the matching set from state.
  const [nearby, setNearby] = useState<{ ar: NearbyLandmark[]; en: NearbyLandmark[] } | null>(null);
  useEffect(() => {
    if (!businessId) return;
    let active = true;
    fetch(`/api/minisite/nearby?id=${encodeURIComponent(businessId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json) return;
        setNearby({ ar: Array.isArray(json.ar) ? json.ar : [], en: Array.isArray(json.en) ? json.en : [] });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [businessId]);

  const nearbyLandmarks = (nearby ? (ar ? nearby.ar : nearby.en) : []).slice(0, 4);

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: '2.5rem',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER */}
      <div style={{
        padding: '1.5rem 1.75rem',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(212, 175, 55, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: primaryColor,
            fontSize: '1.2rem'
          }}>
            <i className={isTransport ? 'fas fa-route' : 'fas fa-map-marked-alt'}></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              {isTransport ? L.transport : L.access}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              {displayAddress}
            </div>
          </div>
        </div>

      </div>

      {/* DIRECT GPS & ROUTE CARD (NO BLOCKED IFRAME) */}
      <div
        style={{
          position: 'relative',
          padding: '2rem 1.75rem',
          background: 'linear-gradient(135deg, #090e17 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '4px 10px', borderRadius: '50px', background: 'rgba(212,175,55,0.15)', border: `1px solid rgba(212,175,55,0.3)`, color: '#D4AF37', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              <i className="fas fa-location-crosshairs" /> {L.badge}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
              {businessName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {displayAddress}
            </div>
          </div>

          {(stationaryUnitCode || stationHubName) && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                padding: '6px 14px',
                borderRadius: '50px',
                border: `1px solid ${primaryColor}`,
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#fff',
              }}
            >
              <span style={{ color: primaryColor }}>📍</span>
              <span>{stationaryUnitCode ? `${L.unit}: ${stationaryUnitCode}` : stationHubName}</span>
            </div>
          )}
        </div>

        {hasCoordinates && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-satellite" style={{ color: '#D4AF37' }} />
              <span>{L.gps}: <strong>{lat!.toFixed(4)}, {lng!.toFixed(4)}</strong></span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {L.routingActive}
            </div>
          </div>
        )}
      </div>

      {/* ACTION & DETAILS BAR */}
      <div style={{ padding: '1.5rem 1.75rem', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
        {/* NAVIGATION BUTTONS */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <a
            href={directGoogleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              minWidth: '150px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
              transition: 'transform 0.2s'
            }}
          >
            <i className="fab fa-google" style={{ color: '#4285F4' }}></i>
            {L.navGoogle}
          </a>

          <a
            href={directWazeLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.75rem 1.1rem',
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fab fa-waze" style={{ color: '#33ccff' }}></i>
            {L.navWaze}
          </a>

          <a
            href={directAppleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.75rem 1.1rem',
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fab fa-apple"></i>
            {L.navApple}
          </a>
        </div>

        {/* ACCESSIBILITY & ROUTE SPEC */}
        {accessibilityNotes && (
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: '#78350f',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-info-circle" style={{ color: primaryColor }}></i>
            <span>{accessibilityNotes}</span>
          </div>
        )}

        {/* PROXIMITY TO NEARBY HIGHLIGHTS (dynamic, hidden when empty) */}
        {nearbyLandmarks.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.75rem' }}>
              {L.proximity}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {nearbyLandmarks.map((landmark, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    background: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#334155' }}>
                    {landmarkIcon(landmark.primaryType)} {landmark.name}
                  </span>
                  <span style={{ fontWeight: 900, color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                    {landmark.distKm} {L.km}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
