'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(Boolean(isInStandaloneMode));

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chrome/Android install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // On iOS, if not standalone, we can prompt after 1.5s
    if (isIosDevice && !isInStandaloneMode) {
      const dismissed = sessionStorage.getItem('pwa_ios_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_ios_dismissed', 'true');
  }

  if (isStandalone || !showPrompt) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(15,23,42,0.95) 100%)',
      border: '1.5px solid #D4AF37',
      borderRadius: '20px',
      padding: '1.15rem 1.4rem',
      marginBottom: '1.5rem',
      boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      direction: 'rtl',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
        }}>
          📲
        </div>
        <div>
          <div style={{ fontWeight: 900, color: '#f8fafc', fontSize: '0.95rem' }}>
            تثبيت تطبيق SiWiFy على شاشة هاتفك
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginTop: '0.2rem' }}>
            {isIOS
              ? 'اضغط على زر المشاركة ⎋ ثم اختر "إضافة إلى الشاشة الرئيسية" ➕'
              : 'افتح التطبيق بسرعة بدون متصفح وتابع حجوزاتك وإشعاراتك فوراً'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {!isIOS && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '12px',
              background: '#25D366',
              color: '#070B12',
              fontWeight: 900,
              fontSize: '0.85rem',
              border: 0,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
            }}
          >
            تثبيت الآن ⚡
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 0,
            color: '#94a3b8',
            padding: '0.55rem 0.9rem',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}
