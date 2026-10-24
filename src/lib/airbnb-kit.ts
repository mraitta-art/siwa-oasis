/**
 * Airbnb listing content pack.
 *
 * Airbnb has no public content API and its listing rules forbid external links
 * and off-platform contact in the text, so we cannot publish for the host. What
 * we can do is remove every reason to write a bad listing: exact title length,
 * structured description, amenity labels, and a sanitiser that removes phone
 * numbers, emails and URLs before they get someone's listing penalised.
 */

export interface AirbnbKit {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  amenities: string[];
  photoGuidance: string[];
  checklist: Array<{ label: string; done: boolean }>;
  warnings: string[];
}

const TITLE_LIMIT = 50;

/** Amenity flags we recognise in custom_data, mapped to Airbnb's wording. */
const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wifi',
  internet: 'Wifi',
  air_conditioning: 'Air conditioning',
  ac: 'Air conditioning',
  heating: 'Heating',
  hot_water: 'Hot water',
  kitchen: 'Kitchen',
  kitchenette: 'Kitchenette',
  breakfast: 'Breakfast',
  pool: 'Pool',
  private_pool: 'Private pool',
  parking: 'Free parking on premises',
  free_parking: 'Free parking on premises',
  private_bathroom: 'Private bathroom',
  towels: 'Towels provided',
  linens: 'Bed linens provided',
  washing_machine: 'Washer',
  tv: 'TV',
  workspace: 'Dedicated workspace',
  bbq: 'BBQ grill',
  fireplace: 'Indoor fireplace',
  garden: 'Garden',
  terrace: 'Terrace',
  pets_allowed: 'Pets allowed',
  wheelchair_accessible: 'Step-free entrance',
  family_friendly: 'Family friendly',
  self_check_in: 'Self check-in',
};

const BANNED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /https?:\/\/\S+/gi, label: 'link' },
  { pattern: /www\.\S+/gi, label: 'link' },
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/gi, label: 'email' },
  { pattern: /\b(wa\.me|whatsapp|instagram|facebook|tiktok|siwify)\b/gi, label: 'platform name' },
  { pattern: /@[A-Za-z0-9._]{3,}/g, label: 'handle' },
];

/** Dates and times are listing content, so they must survive the phone rule. */
const DATE_SHAPE = /\b\d{1,4}[./-]\d{1,2}[./-]\d{2,4}\b/;
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{7,}\d/g;

function looksLikePhone(candidate: string): boolean {
  if (DATE_SHAPE.test(candidate)) return false;
  const digits = candidate.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

/** Removes the connective debris left behind once a link or number is cut out. */
function tidyText(value: string): string {
  let text = value.replace(/[ \t]{2,}/g, ' ');
  for (let pass = 0; pass < 2; pass += 1) {
    text = text.replace(/\b(at|on|via|or|and|with|email|call|contact|follow us on|book direct at)\b\s*([.,;:!?])/gi, '$2');
    text = text.replace(/ +([.,;:!?])/g, '$1');
  }
  return text
    .replace(/([,;:])\s*\./g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\b(at|on|via|or|and|email|call|contact)\s*$/i, '')
    .replace(/[,;:]\s*$/g, '.')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface SanitizeResult {
  text: string;
  removed: string[];
}

/** Removes everything Airbnb treats as disintermediation. */
export function sanitizeForAirbnb(input: unknown): SanitizeResult {
  let text = typeof input === 'string' ? input : '';
  const removed: string[] = [];

  const note = (label: string) => {
    if (!removed.includes(label)) removed.push(label);
  };

  for (const { pattern, label } of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      note(label);
      text = text.replace(pattern, ' ');
    }
    pattern.lastIndex = 0;
  }

  text = text.replace(PHONE_CANDIDATE, candidate => {
    if (!looksLikePhone(candidate)) return candidate;
    note('phone number');
    return ' ';
  });

  const tidied = tidyText(text);
  // Stripping a sentence down to punctuation alone means it carried nothing
  // but contact details — drop it rather than publish a stray full stop.
  return { text: /[\p{L}\p{N}]/u.test(tidied) ? tidied : '', removed };
}

function clip(value: unknown, max: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function collectAmenities(customData: Record<string, any>): string[] {
  const found = new Set<string>();

  if (Array.isArray(customData.amenities)) {
    for (const entry of customData.amenities) {
      const key = String(entry || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (AMENITY_LABELS[key]) found.add(AMENITY_LABELS[key]);
    }
  }

  const walk = (node: unknown, depth: number) => {
    if (!node || typeof node !== 'object' || depth > 4) return;
    for (const [rawKey, value] of Object.entries(node as Record<string, unknown>)) {
      const key = rawKey.toLowerCase();
      if (AMENITY_LABELS[key] && (value === true || value === 'true' || value === 1 || value === 'yes')) {
        found.add(AMENITY_LABELS[key]);
      } else if (value && typeof value === 'object') {
        walk(value, depth + 1);
      }
    }
  };
  walk(customData, 0);

  return [...found].slice(0, 20);
}

function readString(source: any, keys: string[]): string {
  for (const key of keys) {
    const value = typeof source?.[key] === 'string' ? source[key].trim() : '';
    if (value) return value;
  }
  return '';
}

export function buildAirbnbKit(input: {
  name: string;
  description?: string | null;
  customData?: Record<string, any> | null;
  photoCount?: number;
}): AirbnbKit {
  const customData = input.customData || {};
  const identity = {
    ...(customData.business_info || {}),
    ...(customData.sec_1_identity || {}),
    ...(customData.basic || {}),
    ...(customData.identity || {}),
  };

  const rawName = String(input.name || 'Your business').trim();
  const titleBase = `${rawName} · Siwa Oasis`;
  const title = clip(titleBase, TITLE_LIMIT);

  const rawDescription = String(input.description || identity.description || customData.description || '').trim();
  const description = sanitizeForAirbnb(rawDescription);
  const summary = clip(description.text.split(/\n{2,}/)[0] || description.text, 160);

  const address = sanitizeForAirbnb(readString(identity, ['address'])).text;
  const checkIn = readString(identity, ['check_in', 'checkin', 'check_in_time']);
  const checkOut = readString(identity, ['check_out', 'checkout', 'check_out_time']);

  const sections: Array<{ heading: string; body: string }> = [];
  if (description.text) {
    sections.push({ heading: 'The space', body: clip(description.text, 900) });
  }
  sections.push({
    heading: 'Where you will be',
    body: address
      ? `${address}. Siwa Oasis, Matrouh, Egypt — shared on booking confirmation.`
      : 'Siwa Oasis, Matrouh, Egypt — shared on booking confirmation.',
  });
  if (checkIn || checkOut) {
    sections.push({
      heading: 'Other things to note',
      body: [checkIn ? `Check-in after ${checkIn}.` : '', checkOut ? `Check-out before ${checkOut}.` : '']
        .filter(Boolean)
        .join(' '),
    });
  }

  const amenities = collectAmenities(customData);
  const photoCount = Number(input.photoCount) || 0;

  const checklist = [
    { label: 'Listing title under 50 characters', done: title.length <= TITLE_LIMIT },
    { label: 'Description with no link, phone or email', done: Boolean(description.text) },
    { label: 'At least 5 photos', done: photoCount >= 5 },
    { label: 'Amenities selected', done: amenities.length > 0 },
    { label: 'Street address confirmed in SiWiFy', done: Boolean(address) },
    { label: 'Check-in and check-out times set', done: Boolean(checkIn && checkOut) },
  ];

  const warnings = [
    'Do not paste a SiWiFy, Instagram or WhatsApp link into your Airbnb listing — Airbnb treats it as taking bookings off-platform and can suspend the listing.',
    'Airbnb guests who found you there must complete that booking on Airbnb. Your minisite is for guests who find you on Google, social media or in person.',
  ];
  if (description.removed.length > 0) {
    warnings.push(`Removed from this text: ${description.removed.join(', ')}.`);
  }

  return {
    title,
    summary,
    sections,
    amenities,
    photoGuidance: [
      'Minimum 1024 × 683 px, landscape 3:2. The app crops square in search results, so keep the subject centred.',
      photoCount > 0
        ? `You have ${photoCount} photo${photoCount === 1 ? '' : 's'} in SiWiFy — re-download the originals rather than copying compressed previews.`
        : 'Upload photos in SiWiFy first, then reuse the same originals here.',
      'First photo decides your click-through rate: show the space, not the logo.',
      'Avoid text, watermarks and phone numbers burned into the image.',
    ],
    checklist,
    warnings,
  };
}
