import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { businessName = 'Siwa Destination', sectionName = 'Overview', typology = 'Experience' } = await req.json();

    // Check if Gemini or OpenAI is configured
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const prompt = `You are a luxury travel journalist and cultural heritage writer for Siwa Oasis, Egypt.
Write a captivating, high-end, authentic bilingual article/story for a business minisite section.
Business Name: "${businessName}"
Business Category: "${typology}"
Minisite Section: "${sectionName}"

Generate JSON with the following exact structure:
{
  "title_en": "Evocative English Headline (6-10 words)",
  "story_en": "Rich HTML content with 2-3 paragraphs (<p>), bold highlights (<strong>), and luxury heritage storytelling.",
  "title_ar": "عنوان جذاب باللغة العربية (6-10 كلمات)",
  "story_ar": "محتوى غني بتنسيق HTML يتكون من 2-3 فقرات (<p>) وعبارات مميزة (<strong>) بأسلوب راقٍ وأصيل عن سيوة.",
  "meta_description": "SEO meta description under 160 characters."
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
              story: parsed.story_en,
              title: parsed.title_en,
              story_ar: parsed.story_ar,
              title_ar: parsed.title_ar,
              metaDescription: parsed.meta_description
            });
          }
        }
      } catch (err) {
        console.warn('Gemini generation fallback to local engine:', err);
      }
    }

    // High quality editorial fallback when API keys are not set
    const title_en = `The Timeless Essence of ${businessName}: ${sectionName}`;
    const story_en = `<p>Nestled amidst the golden dunes and therapeutic salt springs of <strong>Siwa Oasis</strong>, <strong>${businessName}</strong> represents the finest tradition of desert hospitality and authentic craft. Our ${sectionName.toLowerCase()} experience is designed to immerse visitors in the serene, untamed beauty of this historic sanctuary.</p>
<p>As a distinguished ${typology} in Siwa, every element honors sustainable earthen architecture, indigenous date palm heritage, and unhurried Berber traditions. Whether gazing at the desert starlight or savoring tranquil moments, your journey here is etched into memory.</p>
<p>Discover the quiet luxury and restorative spirit that makes ${businessName} an unforgettable cornerstone of your Siwa expedition.</p>`;

    const title_ar = `سحر وأصالة ${businessName}: ${sectionName}`;
    const story_ar = `<p>في قلب واحة <strong>سيوة</strong> الساحرة بين بساتين النخيل والبحيرات المالحة العلاجية، يتألق <strong>${businessName}</strong> ليقدم تجربة أصيلة تعكس كرم الضيافة السيوية العريقة. صُمم هذا القسم ليأخذكم في رحلة استثنائية تمتزج فيها الطبيعة البكر مع الهدوء المطلق.</p>
<p>باعتبارنا وجهة رائدة في مجال ${typology}، نحرص على استخدام الخامات الطبيعية من الكرشيف وجذوع النخيل، لنحافظ على الهوية التراثية الفريدة. كل لحظة تقضونها هنا هي حكاية من الجمال والسكينة.</p>
<p>نرحب بكم في ${businessName} لتستمتعوا بتجربة لا تُنسى في واحة الغروب الخالدة.</p>`;

    const metaDescription = `Discover ${businessName} in Siwa Oasis. Authentic ${typology} offering bespoke ${sectionName} in the heart of Egypt's hidden paradise.`;

    return NextResponse.json({
      story: story_en,
      title: title_en,
      story_ar,
      title_ar,
      metaDescription
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
