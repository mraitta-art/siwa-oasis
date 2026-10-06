import React from 'react';

export default function RootLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#0a0f1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @keyframes siwaPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.4));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 35px rgba(212, 175, 55, 0.75));
          }
        }
        @keyframes siwaSpinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Pulsing Siwify Logo Container */}
      <div style={{ position: 'relative', width: 96, height: 96, marginBottom: '1.5rem' }}>
        {/* Spinning Golden Orbit Ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#D4AF37',
            borderRightColor: '#F59E0B',
            animation: 'siwaSpinRing 1.2s linear infinite',
          }}
        />

        {/* Siwify Brand Crest */}
        <svg
          viewBox="0 0 512 512"
          width="96"
          height="96"
          style={{
            animation: 'siwaPulse 2s ease-in-out infinite',
            borderRadius: '24px',
          }}
        >
          <defs>
            <linearGradient id="loadBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="loadGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="40%" stopColor="#D4AF37" />
              <stop offset="80%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="loadSun" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FFFBEB" />
            </linearGradient>
          </defs>

          {/* Squircle Card */}
          <rect width="512" height="512" rx="128" fill="url(#loadBg)" />
          <rect width="500" height="500" x="6" y="6" rx="122" fill="none" stroke="url(#loadGold)" strokeWidth="10" opacity="0.7" />

          {/* Desert Sun */}
          <circle cx="340" cy="180" r="64" fill="url(#loadSun)" opacity="0.95" />

          {/* S Wave (Dunes) */}
          <path
            d="M 330 145 C 240 125 160 170 160 230 C 160 280 215 302 275 318 C 335 334 360 355 360 395 C 360 455 270 480 180 455"
            fill="none"
            stroke="url(#loadGold)"
            strokeWidth="54"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sparkle */}
          <polygon points="340,115 347,135 368,140 347,146 340,166 333,146 312,140 333,135" fill="#FFFBEB" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: 900,
            letterSpacing: '5px',
            color: '#D4AF37',
            marginBottom: '0.35rem',
          }}
        >
          SIWIFY<span style={{ color: '#fff' }}>.COM</span>
        </div>
        <div
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '2px',
            color: 'rgba(255, 255, 255, 0.45)',
            textTransform: 'uppercase',
          }}
        >
          Siwa Oasis · Digital Platform
        </div>
      </div>
    </div>
  );
}
