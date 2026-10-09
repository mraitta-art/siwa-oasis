export const MARKETPLACE_ITEM_TYPE_OPTIONS = [
  { value: 'package', label: 'Package' },
  { value: 'program', label: 'Program' },
  { value: 'tour', label: 'Tour' },
  { value: 'activity', label: 'Activity' },
  { value: 'discount_offer', label: 'Offer or discount' },
  { value: 'room_bundle', label: 'Room bundle' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'room', label: 'Room' },
  { value: 'transport_service', label: 'Transport service' },
  { value: 'menu_item', label: 'Menu item' },
  { value: 'product', label: 'Shop product' },
  { value: 'trade_product', label: 'Trade product' },
  { value: 'factory_visit', label: 'Factory visit' },
  { value: 'investment', label: 'Investment opportunity' },
] as const;

export const MARKETPLACE_ITEM_TYPE_IDS = MARKETPLACE_ITEM_TYPE_OPTIONS.map(option => option.value);
export const CATALOG_SPEC_ITEM_TYPE_OPTIONS = MARKETPLACE_ITEM_TYPE_OPTIONS.filter(option => option.value !== 'investment');
export const CATALOG_SPEC_ITEM_TYPE_IDS = CATALOG_SPEC_ITEM_TYPE_OPTIONS.map(option => option.value);
export const PUBLIC_CATALOG_ITEM_TYPE_IDS = ['product', 'trade_product', 'menu_item'] as const;
export type MarketplaceItemType = typeof MARKETPLACE_ITEM_TYPE_OPTIONS[number]['value'];
