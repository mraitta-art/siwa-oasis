/**
 * Gives every typology its Arabic name.
 *
 * The Arabic markets (El Alamein's default locale is 'ar') print
 * `business_types.name_ar`, and fall back to the English `name` when it is
 * empty. Every row in the tree was created without one, so the Arabic pages
 * read "Accommodation", "Food & Beverage" and so on.
 *
 * This fills only the rows that are still empty: a name an admin typed later
 * is never overwritten, so the script can be re-run at any time.
 *
 *   node scripts/seed-typology-arabic.mjs         # write
 *   node scripts/seed-typology-arabic.mjs --dry   # report only
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createConnection } from 'mysql2/promise';

const DRY = process.argv.includes('--dry');

/** id -> Arabic name. Keys not listed here are left untouched and reported. */
const ARABIC = {
  // ── parent categories ──────────────────────────────────────────────────────
  accommodation: 'الإقامة',
  food: 'الطعام والمشروبات',
  adventure: 'السفر والرحلات',
  wellness: 'الصحة والعافية',
  crafts: 'التجارة والحرف',
  logistics: 'الخدمات اللوجستية والنقل',
  arts_culture: 'الفنون والثقافة والتراث',
  education_research: 'التعليم والبحث والدراسات الميدانية',
  events_entertainment: 'الفعاليات والترفيه والمهرجانات',
  investment_parent: 'الاستثمار وتطوير رأس المال',
  media_content: 'الإعلام والمحتوى والتسويق الرقمي',
  services_professional: 'الخدمات المهنية وخدمات الأعمال',
  retreats: 'الخلوات والاستجمام',
  agriculture_industry: 'الزراعة والموارد الطبيعية والإنتاج',
  SECTION_TEMPLATE: 'قالب القسم المرجعي',

  // ── accommodation ──────────────────────────────────────────────────────────
  siwa_lodge: 'لودج سيوي تقليدي',
  apartment: 'شقة',
  villa: 'فيلا',
  guest_house: 'بيت ضيافة',
  camp: 'مخيم صحراوي',
  camps: 'مخيمات',
  eco_lodge: 'لودج بيئي',
  hotel: 'فندق',
  lodge: 'لودج',
  resort: 'منتجع',
  apartment_rental: 'تأجير الشقق',
  glamping_tent: 'تخييم فاخر وخيام',
  guesthouse: 'بيت ضيافة وإقامة منزلية',
  villa_rental: 'تأجير فلل خاصة ومسابح',
  camping_areas: 'مناطق التخييم',

  // ── food ───────────────────────────────────────────────────────────────────
  restaurant: 'مطعم',
  siwan_kitchen: 'مطبخ سيوي تقليدي',
  cafe_juice: 'مقهى وعصائر',
  cafe: 'مقهى ومخبز',
  street_food: 'أكل الشارع',
  bakery_sweets: 'مخبوزات وحلويات سيوية',
  desert_dining_event: 'عشاء بدوي في الصحراء ومخيمات',
  fine_dining: 'مطاعم فاخرة وعشاء الغروب',
  juice_smoothie: 'عصائر وسموذي طازج',
  street_food_stall: 'أكشاك الطعام والأسواق',

  // ── adventure ──────────────────────────────────────────────────────────────
  safari_4x4: 'سفاري صحراوي بالدفع الرباعي',
  desert_safari: 'سفاري صحراوي ورحلات استكشافية',
  camel_trek: 'ركوب الجمال',
  salt_lakes: 'رحلات بحيرات الملح',
  stargazing_tour: 'رحلات مراقبة النجوم',
  oasis_cycling: 'دراجات وتنزه في بساتين النخيل',
  quad_atv: 'دراجات رباعية في الصحراء',
  rock_climbing: 'تسلق الصخور وجبل الدكرور',
  sandboarding: 'التزلج على الرمال والدونات',

  // ── wellness ───────────────────────────────────────────────────────────────
  sand_bath: 'الحمام الرملي العلاجي',
  salt_therapy: 'العلاج بغرف الملح',
  hot_spring: 'تجربة العين الساخنة',
  spa_massage: 'سبا ومساج طبيعي',
  traditional_medicine: 'الطب الشعبي والعلاج بالأعشاب',
  yoga_meditation: 'يوغا وتأمل',

  // ── arts, culture & heritage ───────────────────────────────────────────────
  nature_tour: 'رحلات الطبيعة ومراقبة الطيور',
  heritage_tour: 'جولة التراث التاريخي',
  cultural_tour: 'جولة ثقافية',
  embroidery: 'تطريز ومنسوجات سيوية',
  cultural_workshop: 'ورش ثقافية ودروس تراثية',
  art_gallery: 'معارض الفن الصحراوي',
  photography_studio: 'استوديوهات تصوير صحراوي',
  museum_heritage: 'متاحف ومراكز تراثية',

  // ── crafts & trade ─────────────────────────────────────────────────────────
  date_olive: 'تجارة التمور والزيتون',
  artisan_shop: 'متجر حرف يدوية',
  date_packers: 'تعبئة التمور والزيتون بالجملة',
  herbal_cosmetics: 'أعشاب ومستحضرات تجميل عضوية',
  pottery_clay: 'فخار وطين سيوي',
  salt_crafts: 'مصابيح وديكور بلورات الملح',
  handmade_jewelry: 'فضة وخرز سيوي',
  tentmaking_and_canvas_crafts: 'صناعة الخيام والمشغولات القماشية',

  // ── logistics & transport ──────────────────────────────────────────────────
  travel_agency: 'وكالة سفر ومنظم رحلات',
  tuk_tuk: 'خدمة التوك توك المحلية',
  equipment_rental: 'تأجير المعدات',
  airport_transfer: 'نقل بعيد المدى وتأجير سيارات',
  boat_service: 'قوارب وتجديف في بحيرات الملح',
  local_guide_service: 'خدمات المرشدين والترجمة',
  donkey_cart: 'جولات عربات الحمار التقليدية',

  // ── education & research ───────────────────────────────────────────────────
  language_school: 'مدارس اللغة العربية والسيوية',
  archaeology_dig: 'حفريات أثرية وزيارة مواقع',
  eco_research: 'البحث البيئي والتنوع الحيوي',

  // ── events & entertainment ─────────────────────────────────────────────────
  corporate_retreat: 'خلوات الشركات وبناء الفرق',
  cultural_festival: 'مهرجانات واحتفالات تقليدية',
  live_music_venue: 'أماكن موسيقى حية وعروض سيوية',
  private_event_host: 'استضافة مناسبات وأعراس',

  // ── investment ─────────────────────────────────────────────────────────────
  land_investment: 'الاستثمار الزراعي والأراضي',
  ecolodge_development: 'تطوير اللودجات البيئية والرحلات',
  residential_sales: 'عقارات وإيجارات طويلة الأجل',

  // ── media ──────────────────────────────────────────────────────────────────
  film_documentary: 'إنتاج أفلام وثائقية',
  content_agency: 'وكالات التواصل الاجتماعي والمحتوى',

  // ── professional services ──────────────────────────────────────────────────
  legal_property: 'خدمات قانونية وتسجيل عقارات',
  printing_packaging: 'طباعة وتغليف محلي',
  local_consultancy: 'استشارات سياحية وتجارية',
  sport: 'الرياضة',

  // ── agriculture & industry ─────────────────────────────────────────────────
  herbal_factory: 'مصنع أعشاب عطرية ومعالجة زراعية عضوية',
  date_factory: 'مصنع معالجة وتعبئة التمور',
  salt_factory: 'مصنع استخلاص وتكرير الملح',
  water_factory: 'مصنع تعبئة مياه معدنية طبيعية',
  olive_mill: 'معصرة زيتون',

  // ── retreats ───────────────────────────────────────────────────────────────
  siwa_retreats: 'خلوات سيوة',
};

const conn = await createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { minVersion: 'TLSv1.2' },
});

const [rows] = await conn.query('SELECT id, name, name_ar FROM business_types');
const byId = new Map(rows.map((row) => [String(row.id), row]));

let filled = 0;
let kept = 0;
const unknown = [];
const unmapped = [];

for (const [id, arabic] of Object.entries(ARABIC)) {
  const row = byId.get(id);
  if (!row) {
    unknown.push(id);
    continue;
  }
  if (String(row.name_ar || '').trim()) {
    kept += 1;
    continue;
  }
  if (!DRY) {
    await conn.query(
      "UPDATE business_types SET name_ar = ? WHERE id = ? AND (name_ar IS NULL OR TRIM(name_ar) = '')",
      [arabic, id]
    );
  }
  filled += 1;
}

for (const row of rows) {
  if (!ARABIC[String(row.id)]) unmapped.push(String(row.id));
}

console.log(`${DRY ? 'would fill' : 'filled'} ${filled} · kept ${kept} existing · ${rows.length} rows total`);
if (unknown.length) console.log('no such typology (skipped):', unknown.join(', '));
if (unmapped.length) console.log('not in this map (left as-is):', unmapped.join(', '));

await conn.end();
