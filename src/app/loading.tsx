import React from 'react';
import BrandLoader from '@/components/BrandLoader';

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
      <BrandLoader size={104} label="SiWiFy.com" sublabel="Siwa Oasis · Digital Platform" />
    </div>
  );
}
