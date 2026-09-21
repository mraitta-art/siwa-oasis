import { Suspense } from 'react';
import ServicesContent from './ServicesContent';

export const dynamic = 'force-dynamic';

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-[#D4AF37] text-sm font-bold tracking-widest animate-pulse">LOADING SERVICES…</div>
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}
