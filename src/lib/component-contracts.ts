export type ComponentProps = Record<string, unknown>;

type ComponentRule = {
  allowed: string[];
  defaults?: ComponentProps;
};

const COMMON_TEXT = ['title', 'subtitle'];

const COMPONENT_RULES: Record<string, ComponentRule> = {
  hero_carousel: {
    allowed: [...COMMON_TEXT, 'carousel_id', 'siteId', 'isDynamic', 'autoPlay', 'autoPlayInterval', 'showIndicators', 'showArrows', 'showProgress', 'includeBusinesses', 'includeJourneys', 'includeInvestment', 'includeRegistration', 'titleColor', 'titleSize', 'subtitleSize', 'contentAlign', 'primaryFont', 'height_mobile', 'height_desktop', 'padding_mobile', 'padding_desktop', 'content_max_width'],
    defaults: { autoPlay: true, showIndicators: true, showArrows: true, showProgress: true },
  },
  search_bar: { allowed: ['engine_id', 'engineId', ...COMMON_TEXT] },
  blog: { allowed: [...COMMON_TEXT, 'maxPosts'] },
  featured_vibe: { allowed: [...COMMON_TEXT] },
  investment_feed: { allowed: [...COMMON_TEXT] },
  discovery_gateway: { allowed: [...COMMON_TEXT] },
  services: { allowed: [...COMMON_TEXT, 'buttonText', 'buttonLink'] },
  service_directory: { allowed: [...COMMON_TEXT] },
  services_hub: { allowed: [...COMMON_TEXT] },
  category_showcase: { allowed: [...COMMON_TEXT] },
  experience_categories: { allowed: [...COMMON_TEXT] },
  journey_collection: { allowed: [...COMMON_TEXT] },
  smart_journey_planner: { allowed: [...COMMON_TEXT] },
  ecosystem_map: { allowed: [...COMMON_TEXT] },
  local_products: { allowed: [...COMMON_TEXT] },
  storytelling_section: { allowed: [...COMMON_TEXT] },
  partner_cta: { allowed: [...COMMON_TEXT] },
  cta_section: { allowed: [...COMMON_TEXT, 'description', 'link', 'link_text', 'padding_mobile', 'padding_desktop', 'content_max_width'] },
  text_section: { allowed: [...COMMON_TEXT, 'content', 'padding_mobile', 'padding_desktop', 'content_max_width'] },
  testimonials: { allowed: [...COMMON_TEXT, 'testimonials', 'padding_mobile', 'padding_desktop', 'content_max_width'] },
  faq: { allowed: [...COMMON_TEXT, 'faqs', 'padding_mobile', 'padding_desktop', 'content_max_width'] },
};

function isPlainObject(value: unknown): value is ComponentProps {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSafeValue(value: unknown): boolean {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isSafeList(value: unknown): boolean {
  return Array.isArray(value) && value.every(item => isPlainObject(item) && Object.values(item).every(isSafeValue));
}

/** Normalize editor data before it reaches a hardcoded renderer implementation. */
export function validateComponentProps(type: string, input: unknown): ComponentProps {
  const rule = COMPONENT_RULES[type];
  if (!rule) return {};

  const source = isPlainObject(input) ? input : {};
  const output: ComponentProps = { ...(rule.defaults || {}) };

  for (const key of rule.allowed) {
    const value = source[key];
    if (isSafeValue(value) || ((key === 'testimonials' || key === 'faqs') && isSafeList(value))) output[key] = value;
  }

  if (typeof output.autoPlayInterval === 'number') {
    output.autoPlayInterval = Math.min(120000, Math.max(1000, output.autoPlayInterval));
  }
  if (typeof output.titleSize === 'number') {
    output.titleSize = Math.min(120, Math.max(12, output.titleSize));
  }
  if (typeof output.subtitleSize === 'number') {
    output.subtitleSize = Math.min(72, Math.max(10, output.subtitleSize));
  }
  if (typeof output.height_mobile === 'number') {
    output.height_mobile = Math.min(900, Math.max(280, output.height_mobile));
  }
  if (typeof output.height_desktop === 'number') {
    output.height_desktop = Math.min(1200, Math.max(400, output.height_desktop));
  }
  for (const key of ['padding_mobile', 'padding_desktop', 'content_max_width']) {
    if (typeof output[key] === 'number') {
      output[key] = key === 'content_max_width'
        ? Math.min(1800, Math.max(320, output[key]))
        : Math.min(240, Math.max(0, output[key]));
    }
  }
  if (output.contentAlign !== 'left' && output.contentAlign !== 'center' && output.contentAlign !== 'right') {
    delete output.contentAlign;
  }

  return output;
}

export function isSupportedComponent(type: string): boolean {
  return Boolean(COMPONENT_RULES[type]);
}
