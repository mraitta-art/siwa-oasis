'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Every market, live or dark — the admin view of the registry.
 *
 * `/api/markets` is the public feed and only returns live rows. That is right
 * for the website and wrong for admin: a market is created dark, filled with
 * listings, and published afterwards, so the admin surfaces must see it from
 * the moment it exists. `/api/jana/markets` returns all of them plus the
 * governorates a new one can be placed in, which is everything these screens
 * need — no hardcoded market list anywhere.
 */

export interface AdminMarket {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  active: boolean;
  host: string | null;
  currency: string;
  defaultLocale: 'ar' | 'en';
  locationPath: string | null;
  locationLabel: string | null;
  listings: number;
  compounds: number;
}

export interface GovOption {
  id: string;
  nameEn: string;
  nameAr: string;
  path: string;
}

export interface MarketsFeed {
  markets: AdminMarket[];
  governorates: GovOption[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useMarkets(): MarketsFeed {
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [governorates, setGovernorates] = useState<GovOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/markets', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Market list unavailable (${res.status})`);
      const data = await res.json();
      setMarkets(Array.isArray(data?.markets) ? data.markets : []);
      setGovernorates(Array.isArray(data?.governorates) ? data.governorates : []);
      setError(null);
    } catch (e: any) {
      setMarkets([]);
      setGovernorates([]);
      setError(e?.message || 'Market list unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { markets, governorates, loading, error, reload };
}
