'use client';

import React, { useState } from 'react';

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
}

// Key Siwa Oasis Landmarks for proximity reference
const SIWA_LANDMARKS = [
  { name: 'Shali Fortress (Old Town)', lat: 29.2038, lng: 25.5196, icon: '🏛️' },
  { name: 'Cleopatra Spring', lat: 29.1912, lng: 25.5492, icon: '🌊' },
  { name: 'Siwa Salt Lakes', lat: 29.2230, lng: 25.4670, icon: '🧂' },
  { name: 'Great Sand Sea (Safari Gate)', lat: 29.1750, lng: 25.4850, icon: '🏜️' },
  { name: 'Temple of the Oracle (Amon)', lat: 29.2045, lng: 25.5532, icon: '👑' },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
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
}: LocationMapProps) {
  const [mapMode, setMapMode] = useState<'roadmap' | 'satellite'>('roadmap');

  const lat = Number(latitude) || 29.2032;
  const lng = Number(longitude) || 25.5195;
  const hasCoordinates = Boolean(latitude && longitude);

  // Navigation Links
  const mapsSearchQuery = hasCoordinates 
    ? `${lat},${lng}` 
    : encodeURIComponent(`${businessName} Siwa Oasis Egypt`);

  const directGoogleMapsLink = googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;
  const directWazeLink = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const directAppleMapsLink = `https://maps.apple.com/?q=${mapsSearchQuery}&ll=${lat},${lng}`;

  // Map Embed URL
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapMode === 'satellite' ? 'k' : 'm'}&z=14&ie=UTF8&iwloc=&output=embed`;

  // Determine nearby landmarks
  const nearbyLandmarks = SIWA_LANDMARKS.map(lm => ({
    ...lm,
    distKm: calculateDistanceKm(lat, lng, lm.lat, lm.lng),
  })).sort((a, b) => a.distKm - b.distKm);

  const isTransport = String(businessType).toLowerCase().includes('transport') || 
                      String(businessType).toLowerCase().includes('safari') || 
                      String(businessType).toLowerCase().includes('car') ||
                      String(businessType).toLowerCase().includes('transfer');

  return (
    <div style={{
      background: '#fff',
      borderRadius: '24px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: '2.5rem',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
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
              {isTransport ? 'Base Station & Pickup Route' : 'Stationary Location & Access'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              {address || 'Siwa Oasis, Matrouh Governorate, Egypt'}
            </div>
          </div>
        </div>

        {/* MAP VIEW SWITCHER */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f8fafc', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setMapMode('roadmap')}
            style={{
              border: 0,
              padding: '5px 12px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: mapMode === 'roadmap' ? '#0f172a' : 'transparent',
              color: mapMode === 'roadmap' ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            🗺️ Road
          </button>
          <button
            type="button"
            onClick={() => setMapMode('satellite')}
            style={{
              border: 0,
              padding: '5px 12px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: mapMode === 'satellite' ? '#0f172a' : 'transparent',
              color: mapMode === 'satellite' ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            🛰️ Satellite
          </button>
        </div>
      </div>

      {/* EMBEDDED MAP CONTAINER */}
      <div style={{ position: 'relative', width: '100%', height: '320px', background: '#e2e8f0' }}>
        <iframe
          title={`Location of ${businessName}`}
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 0 }}
          loading="lazy"
          allowFullScreen
        />

        {/* STATIONARY UNIT / STATION BADGE */}
        {(stationaryUnitCode || stationHubName) && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: '50px',
            border: `1px solid ${primaryColor}`,
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
          }}>
            <span style={{ color: primaryColor }}>📍</span>
            <span>{stationaryUnitCode ? `Unit: ${stationaryUnitCode}` : stationHubName}</span>
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
            Google Maps Navigate
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
            Waze
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
            Apple Maps
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

        {/* PROXIMITY TO KEY LANDMARKS */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.75rem' }}>
            PROXIMITY TO SIWA OASIS HIGHLIGHTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {nearbyLandmarks.slice(0, 4).map((landmark, i) => (
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
                  {landmark.icon} {landmark.name}
                </span>
                <span style={{ fontWeight: 900, color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                  {landmark.distKm} km
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
