export type ServiceState = 'active' | 'pending' | 'upgrade' | 'suspended';

export interface VendorServiceDefinition {
  key: string;
  label: string;
  description: string;
  category: 'minisite' | 'growth' | 'marketplace' | 'leads';
  featureKeys: string[];
}

export const VENDOR_SERVICE_CATALOG: VendorServiceDefinition[] = [
  { key: 'minisite', label: 'Public minisite', description: 'Your business profile and public vanity URL.', category: 'minisite', featureKeys: ['canPublishMinisite'] },
  { key: 'qr', label: 'Minisite QR code', description: 'A printable QR code that opens your minisite.', category: 'minisite', featureKeys: ['qr_enabled'] },
  { key: 'branding', label: 'Custom branding', description: 'Logo, colors, and premium presentation options.', category: 'minisite', featureKeys: ['allow_custom_logo', 'canCustomizeTemplate'] },
  { key: 'media', label: 'Media capacity', description: 'Images, carousel slides, and storage quota.', category: 'growth', featureKeys: ['maxImages', 'maxSlides', 'maxStorageMB'] },
  { key: 'captions', label: 'Image captions', description: 'Add editorial captions to section gallery images.', category: 'growth', featureKeys: ['section_captions', 'captions'] },
  { key: 'section-blog', label: 'Section stories', description: 'Publish a short story or blog entry inside a section.', category: 'growth', featureKeys: ['section_blog', 'allow_section_blog'] },
  { key: 'minisite-carousel', label: 'Minisite carousel', description: 'Request approved section content for the business minisite carousel.', category: 'minisite', featureKeys: ['minisite_carousel', 'allow_minisite_carousel'] },
  { key: 'main-carousel', label: 'Main carousel promotion', description: 'Request editorial placement in the main website carousel.', category: 'growth', featureKeys: ['main_carousel', 'allow_main_carousel'] },
  { key: 'contact', label: 'Direct contact', description: 'Publish approved phone, email, and contact channels.', category: 'growth', featureKeys: ['allow_direct_contact'] },
  { key: 'marketplace', label: 'Marketplace tools', description: 'Publish offers, packages, discounts, and opportunities.', category: 'marketplace', featureKeys: ['journey_marketplace_access'] },
  { key: 'journeys', label: 'Journey leads', description: 'Receive and respond to relevant journey requests.', category: 'leads', featureKeys: ['journey_view_requests', 'journey_submit_offer'] },
  { key: 'analytics', label: 'Performance analytics', description: 'Review minisite, discovery, and lead performance.', category: 'growth', featureKeys: ['analytics_access'] },
];

export function featureIsEnabled(features: Record<string, any> | null | undefined, keys: string[]) {
  if (!features) return false;
  return keys.some(key => {
    const value = features[key];
    return value === true || (typeof value === 'number' && value > 0) || (Array.isArray(value) && value.length > 0);
  });
}
