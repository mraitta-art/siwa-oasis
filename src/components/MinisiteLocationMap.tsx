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
              <i className="fas fa-location-crosshairs" /> Verified Oasis Coordinates
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
              {businessName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {address || 'Siwa Oasis, Matrouh Governorate, Egypt'}
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
              <span>{stationaryUnitCode ? `Unit: ${stationaryUnitCode}` : stationHubName}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-satellite" style={{ color: '#D4AF37' }} />
            <span>GPS Pin: <strong>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</strong></span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Direct GPS routing active • 1-click navigation links below
          </div>
        </div>
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
