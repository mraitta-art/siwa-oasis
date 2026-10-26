/**
 * Market-aware marketing content generation.
 *
 * This is the single brain behind the per-business marketing pack. Two things
 * matter here:
 *
 *  1. It is MARKET-aware. The old AI helper fell back to Siwa's "golden dunes
 *     and salt springs" copy for everything, which would have handed an El
 *     Alamein seaside compound desert language. Every string now derives from
 *     the market's own character.
 *  2. It works WITHOUT an API key. Gemini is used when `GEMINI_API_KEY` is set,
 *     but the offline fallback is a real, market/typology-aware template — so
 *     the pack is usable the moment it is deployed, and only gets richer once a
 *     key is added.
 *
 * Nothing here writes to the database; the routes own persistence. That keeps
 * generation pure and cheap to unit-think about.
 */

export interface MarketProfile {
  slug: string;
  nameEn: string;
  nameAr: string;
  /** A phrase that sets the voice for the whole market. */
  tone: string;
  toneAr: string;
  currency: string;
  /** Evocative noun phrases the fallback weaves in, so copy never feels generic. */
  hooks: string[];
  hooksAr: string[];
  isRealEstate: boolean;
}

export interface SectionCopy {
  title: string;
  title_ar: string;
  story: string;
  story_ar: string;
  metaDescription: string;
}

export interface MarketingPack {
  business_name: string;
  market: string;
  hero: { title_en: string; title_ar: string; story_en: string; story_ar: string };
  meta_description: string;
  social_captions: Array<{ en: string; ar: string; hashtags_en: string; hashtags_ar: string }>;
  reel_script: {
    hook_en: string; body_en: string; cta_en: string;
    hook_ar: string; body_ar: string; cta_ar: string;
  };
  weekly_ideas: Array<{ en: string; ar: string }>;
  cta: { en: string; ar: string };
  /** Which engine produced this — 'gemini' or 'fallback'. Surfaced so the UI can be honest. */
  generated_by: 'gemini' | 'fallback';
}

const SIWA: MarketProfile = {
  slug: 'siwa',
  nameEn: 'Siwa Oasis',
  nameAr: 'واحة سيوة',
  tone: 'eco-luxury, authentic Berber heritage, desert and salt-spring calm, unhurried and warm',
  toneAr: 'فخامة بيئية وتراث أمازيغي أصيل، سكون الصحراء وملحها، دفء وهدوء',
  currency: 'EGP',
  hooks: [
    'the palm groves and healing salt lakes',
    'the desert silence and unpolluted starlight',
    'traditional Karshif earthen architecture',
    'genuine Siwan hospitality and date-palm craft',
  ],
  hooksAr: [
    'بساتين النخيل والبحيرات المالحة العلاجية',
    'سكون الصحراء ونجومها الصافية',
    'عمارة الكرشيف الطينية الأصيلة',
    'كرم الضيافة السيوية وصناعة النخيل',
  ],
  isRealEstate: false,
};

const EL_ALAMEIN: MarketProfile = {
  slug: 'el-alamein',
  nameEn: 'El Alamein',
  nameAr: 'العلمين',
  tone: 'Mediterranean coastal lifestyle, premium sea-front living and smart property investment, modern and confident',
  toneAr: 'حياة ساحلية متوسطية راقية واستثمار عقاري ذكي، عصرية وواثقة',
  currency: 'EGP',
  hooks: [
    'the Mediterranean shoreline and turquoise water',
    'a master-planned seaside community',
    'flexible payment plans and long-term value',
    'private beaches, pools and year-round amenities',
  ],
  hooksAr: [
    'شاطئ المتوسط ومياهه الفيروزية',
    'مجتمع ساحلي مخطط بالكامل',
    'خطط سداد مرنة وقيمة طويلة الأجل',
    'شواطئ خاصة ومسابقات وخدمات على مدار العام',
  ],
  isRealEstate: true,
};

const KNOWN_MARKETS: Record<string, MarketProfile> = {
  siwa: SIWA,
  'el-alamein': EL_ALAMEIN,
  'ras-el-hekma': { ...EL_ALAMEIN, slug: 'ras-el-hekma', nameEn: 'Ras El Hekma', nameAr: 'رأس الحكمة' },
};

/** A market we have not hand-tuned still gets a sane, non-Siwa voice. */
function genericMarket(slug: string, nameEn: string, nameAr: string, currency: string): MarketProfile {
  const label = nameEn || slug || 'the destination';
  return {
    slug,
    nameEn: label,
    nameAr: nameAr || label,
    tone: 'professional, trustworthy and local',
    toneAr: 'احترافية وموثوقة ومحلية',
    currency: currency || 'EGP',
    hooks: [`the heart of ${label}`, `what makes ${label} special`, `the people and places of ${label}`, `a visit to ${label}`],
    hooksAr: [`قلب ${nameAr || label}`, `ما يميّز ${nameAr || label}`, `أهلها وأماكنها`, `زيارة إلى ${nameAr || label}`],
    isRealEstate: false,
  };
}

export function marketProfile(
  slug: string,
  seed: { nameEn?: string; nameAr?: string; currency?: string } = {}
): MarketProfile {
  const known = KNOWN_MARKETS[String(slug || '').trim().toLowerCase()];
  if (known) return known;
  return genericMarket(String(slug || 'the market').toLowerCase(), seed.nameEn || '', seed.nameAr || '', seed.currency || 'EGP');
}

/** What a typology actually sells, phrased for its market. Falls back to the label. */
export function typologyDescriptor(market: MarketProfile, typeId?: string, typeLabel?: string): { en: string; ar: string } {
  const label = (typeLabel || '').trim();
  const map: Record<string, { en: string; ar: string }> = {
    // El Alamein real estate
    gated_compound: { en: 'a gated seaside compound', ar: 'كمبوند ساحلي مُسوَّر' },
    sea_view_apartment: { en: 'a sea-view apartment', ar: 'شقة بإطلالة بحرية' },
    villa_chalet: { en: 'a private villa or chalet', ar: 'فيلا أو شاليه خاص' },
    commercial_unit: { en: 'a commercial unit with steady footfall', ar: 'وحدة تجارية بحركة زوار ثابتة' },
    brokerage_office: { en: 'a trusted property brokerage', ar: 'وسيط عقاري موثوق' },
    // Siwa tourism
    hotel: { en: 'a warm desert stay', ar: 'إقامة صحراوية دافئة' },
    lodging: { en: 'a comfortable place to stay', ar: 'مكان مريح للإقامة' },
    camp: { en: 'a night under the stars', ar: 'ليلة تحت النجوم' },
    restaurant: { en: 'a table of local flavours', ar: 'مائدة بنكهات محلية' },
    cafe: { en: 'a relaxed corner for coffee and conversation', ar: 'ركن هادئ للقهوة والسهر' },
    salt_rock_desert_safari: { en: 'a guided desert journey', ar: 'رحلة صحراوية برفقة مرشد' },
    tuk_tuk: { en: 'a quick, friendly way around town', ar: 'طريقة سريعة وودودة للتجول' },
    handicraft: { en: 'handmade local craft', ar: 'حِرف يدوية محلية' },
    shop: { en: 'a shop worth stopping at', ar: 'متجر يستحق التوقف عنده' },
    spa: { en: 'a wellness pause by the salt springs', ar: 'استراحة عناية ذاتية بجانب الينابيع المالحة' },
  };
  const hit = map[String(typeId || '').trim().toLowerCase()];
  if (hit) return hit;
  if (label) return { en: `a ${label.toLowerCase()} in ${market.nameEn}`, ar: `${label} في ${market.nameAr}` };
  return market.isRealEstate
    ? { en: `a property opportunity in ${market.nameEn}`, ar: `فرصة عقارية في ${market.nameAr}` }
    : { en: `a destination experience in ${market.nameEn}`, ar: `تجربة مميزة في ${market.nameAr}` };
}

function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length];
}

function buildPrompt(market: MarketProfile, input: PackInput): string {
  const what = typologyDescriptor(market, input.typeId, input.typologyLabel);
  const where = input.location ? ` Located in ${input.location}.` : '';
  return `You are a senior marketer for "${market.nameEn}" (${market.nameAr}), Egypt.
The business is "${input.businessName}"${input.businessNameAr ? ` (${input.businessNameAr})` : ''}, ${what.en}, serving ${market.nameEn}.${where}
Voice for this market: ${market.tone}.
Prices are in ${market.currency}. This business is on our ${market.nameEn} directory/minisite; the goal is to bring real visitors and enquiries to it.
Do NOT mention competitors. Do NOT invent prices, certifications or awards not given. Keep it authentic to ${market.nameEn}.

Return a JSON object with EXACTLY this shape (bilingual, English + Arabic):
{
  "hero": {"title_en": "…", "title_ar": "…", "story_en": "2-3 HTML paragraphs <p>", "story_ar": "2-3 HTML paragraphs <p>"},
  "meta_description": "SEO meta under 160 characters in English",
  "social_captions": [
    {"en": "…", "ar": "…", "hashtags_en": "#… #…", "hashtags_ar": "#… #…"} // exactly 5, each ready for Instagram/TikTok
  ],
  "reel_script": {"hook_en": "…", "body_en": "…", "cta_en": "…", "hook_ar": "…", "body_ar": "…", "cta_ar": "…"}, // 15-30s vertical video
  "weekly_ideas": [
    {"en": "…", "ar": "…"} // exactly 4, one content idea per week for a month
  ],
  "cta": {"en": "one short call-to-action line that drives a WhatsApp/quote request", "ar": "…"}
}`;
}

async function callGeminiPack(model: string, key: string, prompt: string): Promise<MarketingPack | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.hero || !Array.isArray(parsed?.social_captions)) return null;
    return {
      business_name: '',
      market: '',
      hero: parsed.hero,
      meta_description: String(parsed.meta_description || ''),
      social_captions: parsed.social_captions.slice(0, 5),
      reel_script: parsed.reel_script,
      weekly_ideas: Array.isArray(parsed.weekly_ideas) ? parsed.weekly_ideas.slice(0, 4) : [],
      cta: parsed.cta,
      generated_by: 'gemini',
    };
  } catch {
    return null;
  }
}

export interface PackInput {
  market: string;
  businessName: string;
  businessNameAr?: string;
  typeId?: string;
  typologyLabel?: string;
  location?: string;
  currency?: string;
  /** Overrides the profile name when the DB carries a friendlier label. */
  marketNameEn?: string;
  marketNameAr?: string;
}

/** The offline pack: market- and typology-aware, never Siwa-hardcoded. */
function fallbackPack(market: MarketProfile, input: PackInput): MarketingPack {
  const name = input.businessName;
  const nameAr = input.businessNameAr || name;
  const what = typologyDescriptor(market, input.typeId, input.typologyLabel);
  const seed = name.length + (input.typeId || '').length;

  const hookEn = pick(market.hooks, seed);
  const hookAr = pick(market.hooksAr, seed);
  const hookEn2 = pick(market.hooks, seed + 1);
  const hookAr2 = pick(market.hooksAr, seed + 1);

  const marketTag = market.nameEn.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '');
  const marketTagAr = market.nameAr;

  const story_en =
    `<p>Welcome to <strong>${name}</strong> — ${what.en} in ${market.nameEn}. Here you are close to ${hookEn}, with the ${market.tone.split(',')[0]} spirit that makes ${market.nameEn} feel unlike anywhere else.</p>` +
    `<p>Every detail is shaped around real visitors: easy to find, simple to reach, and worth the trip. Whether it is your first time or a return, <strong>${name}</strong> makes ${hookEn2} part of your story.</p>` +
    `<p>Plan your visit and get in touch — we would be glad to welcome you to ${market.nameEn}.</p>`;
  const story_ar =
    `<p>أهلًا بكم في <strong>${nameAr}</strong> — ${what.ar} في ${market.nameAr}. هنا تكون قريبًا من ${hookAr}، وبنفس ${market.toneAr.split('،')[0]} الذي يجعل ${market.nameAr} مكانًا لا يُشبه غيره.</p>` +
    `<p>كل التفصيلات مصمّمة لراحة زوّارنا: سهولة الوصول وقيمة تستحق الرحلة. سواء كانت زيارتك الأولى أو عودة، يجعل منك <strong>${nameAr}</strong> جزءًا من حكاية ${hookAr2}.</p>` +
    `<p>خطّط لزيارتك وتواصل معنا — يسعدنا استقبالكم في ${market.nameAr}.</p>`;

  const captions = [
    { en: `${name} — ${what.en}, right in the heart of ${market.nameEn}. Come and see it for yourself.`, ar: `${nameAr} — ${what.ar} في قلب ${market.nameAr}. تعال وشاهد بنفسك.` },
    { en: `Looking for ${hookEn}? ${name} makes it effortless.`, ar: `تبحث عن ${hookAr}? ${nameAr} يجعلها سهلة.` },
    { en: `A little of ${market.nameEn} goes a long way. Save ${name} for your next visit.`, ar: `قليل من ${market.nameAr} يكفي كثيرًا. احفظ ${nameAr} لزيارتك القادمة.` },
    { en: `This is what ${hookEn2} feels like at ${name}.`, ar: `هذا ما تبدو عليه ${hookAr2} في ${nameAr}.` },
    { en: `Good times, real welcome — ${name}, ${market.nameEn}.`, ar: `أوقات طيبة وترحيب أصيل — ${nameAr}، ${market.nameAr}.` },
  ].map((c) => ({
    en: c.en,
    ar: c.ar,
    hashtags_en: `#${marketTag} #${name.toLowerCase().replace(/[^a-z0-9]+/g, '')} #Egypt`,
    hashtags_ar: `#${marketTagAr.replace(/\s+/g, '_')} #مصر`,
  }));

  return {
    business_name: name,
    market: market.slug,
    hero: {
      title_en: `${name} — ${market.nameEn}`,
      title_ar: `${nameAr} — ${market.nameAr}`,
      story_en,
      story_ar,
    },
    meta_description: `${name} in ${market.nameEn}: ${what.en}. Plan your visit and get in touch.`.slice(0, 160),
    social_captions: captions,
    reel_script: {
      hook_en: `Three seconds of ${market.nameEn}…`,
      body_en: `${name} is ${what.en} — ${hookEn}, and an easy welcome.`,
      cta_en: `Tap to visit ${name}.`,
      hook_ar: `ثوانٍ من ${market.nameAr}…`,
      body_ar: `${nameAr} — ${what.ar}: ${hookAr}، وترحيب سهل.`,
      cta_ar: `اضغط لزيارة ${nameAr}.`,
    },
    weekly_ideas: [
      { en: `Week 1 — Introduce ${name}: what it is and where it sits in ${market.nameEn}.`, ar: `الأسبوع ١ — تعريف ${nameAr}: ما هو وأين يقع في ${market.nameAr}.` },
      { en: `Week 2 — Show ${hookEn} and let the visuals speak.`, ar: `الأسبوع ٢ — أظهر ${hookAr} ودع الصور تتحدّث.` },
      { en: `Week 3 — A short guest moment or review worth trusting.`, ar: `الأسبوع ٣ — لحظة ضيف أو تقييم يستحق الثقة.` },
      { en: `Week 4 — An invitation: the simplest way to book or reach out.`, ar: `الأسبوع ٤ — دعوة: أسهل طريقة للحجز أو التواصل.` },
    ],
    cta: {
      en: `Message us on WhatsApp to plan your visit to ${name}.`,
      ar: `راسلنا على واتساب لتخطيط زيارتك إلى ${nameAr}.`,
    },
    generated_by: 'fallback',
  };
}

/** Generate the full six-part marketing pack for one business. */
export async function generateMarketingPack(input: PackInput): Promise<MarketingPack> {
  const market = marketProfile(input.market, {
    nameEn: input.marketNameEn,
    nameAr: input.marketNameAr,
    currency: input.currency,
  });
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const pack = await callGeminiPack(model, key, buildPrompt(market, input));
    if (pack) return { ...pack, business_name: input.businessName, market: market.slug };
  }
  return fallbackPack(market, input);
}

/* ── Backwards-compatible per-section copy (used by the minisite editors) ──── */

export interface SectionInput {
  businessName: string;
  sectionName?: string;
  typology?: string;
  market?: string;
  marketNameEn?: string;
  marketNameAr?: string;
}

function sectionFallback(input: SectionInput, market: MarketProfile): SectionCopy {
  const name = input.businessName || market.nameEn;
  const section = (input.sectionName || 'Overview').trim();
  const hookEn = pick(market.hooks, name.length);
  const hookAr = pick(market.hooksAr, name.length);
  return {
    title: `${name}: ${section}`,
    title_ar: `${name}: ${section}`,
    story:
      `<p><strong>${name}</strong> brings you ${hookEn} in ${market.nameEn}. This ${section.toLowerCase()} is written for visitors who value the ${market.tone.split(',')[0]} character of the area.</p>` +
      `<p>Expect a warm, genuine experience — and an easy way to plan your next moment in ${market.nameEn}.</p>`,
    story_ar:
      `<p>يقدّم لك <strong>${name}</strong> ${hookAr} في ${market.nameAr}. هذا القسم (${section}) كُتب لمن يُقدّر طابع ${market.toneAr.split('،')[0]} في المنطقة.</p>` +
      `<p>توقّع تجربة أصيلة ودودة — وطريقة سهلة لتخطيط لحظتك القادمة في ${market.nameAr}.</p>`,
    metaDescription: `${name} — ${section} in ${market.nameEn}. Plan your visit.`.slice(0, 160),
  };
}

export async function generateSectionCopy(input: SectionInput): Promise<SectionCopy> {
  const market = marketProfile(input.market || 'siwa', { nameEn: input.marketNameEn, nameAr: input.marketNameAr });
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const prompt = `You are a ${market.isRealEstate ? 'coastal real-estate and lifestyle' : 'luxury travel'} writer for ${market.nameEn}, Egypt. Voice: ${market.tone}.
Write a short bilingual feature for a business minisite section.
Business: "${input.businessName}". Category: "${input.typology || 'Experience'}". Section: "${input.sectionName || 'Overview'}".
Return JSON: {"title_en":"…","story_en":"2-3 HTML <p>","title_ar":"…","story_ar":"2-3 HTML <p>","meta_description":"under 160 chars"}.
Stay authentic to ${market.nameEn}. Do not mention other destinations.`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.story_en) {
            return {
              title: p.title_en,
              title_ar: p.title_ar,
              story: p.story_en,
              story_ar: p.story_ar,
              metaDescription: p.meta_description || `${input.businessName} in ${market.nameEn}.`.slice(0, 160),
            };
          }
        }
      }
    } catch {
      // fall through to the offline template
    }
  }
  return sectionFallback(input, market);
}
