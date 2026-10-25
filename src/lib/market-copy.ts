import type { Market, MarketRevenueModel } from '@/lib/markets';
import type { SiteLocale } from '@/lib/site-locale';

/**
 * One line that explains what a market is for, chosen by how it earns.
 *
 * Shared by the market door and the homepage so a market never describes
 * itself two different ways. Adding a revenue model means adding a row here.
 */
const MARKET_COPY: Record<MarketRevenueModel, { ar: string; en: string }> = {
  tourism_whatsapp: {
    ar: 'إقامة، رحلات، مطاعم وحرف — تواصل مباشر مع أصحابها على واتساب.',
    en: 'Stays, trips, food and crafts — talk to the owners directly on WhatsApp.',
  },
  realestate_lead: {
    ar: 'مشروعات ومنتجعات ومكاتب بيع — أسعار، خطط سداد وطلبات معاينة.',
    en: 'Developments, resorts and brokers — prices, payment plans and viewing requests.',
  },
  directory_lead: {
    ar: 'دليل الأنشطة والخدمات في المنطقة، مع بيانات تواصل موثقة.',
    en: 'A directory of local businesses and services, with verified contact details.',
  },
};

export function marketCopy(market: Market, locale: SiteLocale): string {
  const copy = MARKET_COPY[market.revenueModel] ?? MARKET_COPY.tourism_whatsapp;
  return locale === 'ar' ? copy.ar : copy.en;
}
