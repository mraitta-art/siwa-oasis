import type { BrandSectorSlug } from '@/lib/brand-sectors';

/**
 * Editorial copy for the three public sector hubs.
 *
 * These pages used to be client components with no text in the HTML, so a
 * crawler arriving from Google found an empty shell. The words below are the
 * part search engines can actually read: what the sector is, what to expect,
 * and the questions people ask before they book.
 *
 * Nothing here quotes a price or a distance that the site cannot verify.
 * Arabic is a real translation, not a machine dump: the /ar pages carry it.
 */

export interface SectorFaq {
  q: string;
  a: string;
}

/** The three hubs that carry editorial copy. The other brand sectors are
 *  still client-only search pages. */
export type SectorHubSlug = 'siwa-stay' | 'siwa-go' | 'siwa-retreats';

export interface SectorCopy {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string[];
  facts: string[];
  faq: SectorFaq[];
  ar: {
    metaTitle: string;
    metaDescription: string;
    heading: string;
    intro: string[];
    facts: string[];
    faq: SectorFaq[];
  };
}

export const SECTOR_COPY: Record<SectorHubSlug, SectorCopy> = {
  'siwa-stay': {
    metaTitle: 'Where to Stay in Siwa Oasis — Eco-lodges, Camps & Hotels | Siwify',
    metaDescription:
      'Stays in Siwa Oasis: eco-lodges of salt and palm, camps at the edge of the Great Sand Sea, and small hotels beside Shali. Contact each property directly.',
    heading: 'Where to stay in Siwa Oasis',
    intro: [
      'Accommodation in Siwa falls into three families. Eco-lodges are built from kershef — salt rock, mud and palm — and stay cool without air conditioning. Desert camps sit where the Great Sand Sea begins, with dunes instead of a garden. Small hotels cluster in Siwa town around the ruined fortress of Shali, within walking distance of the springs and the market.',
      'Expect simplicity rather than polish: thick walls, solar power, cold-water showers in the older lodges, and breakfast under palm trees. Wi-Fi is slow or absent outside town, and for most guests that is the point of coming.',
      'Rates differ widely between a basic camp and a full-board eco-lodge, and most properties quote per room, per night, with breakfast. Few places take cards, so confirm the rate and the currency before you arrive and bring cash.',
      'Every property on this page has its own minisite, written by the owner, with a direct WhatsApp line. Siwify takes no commission and handles no bookings: you speak to the person who runs the place.',
    ],
    facts: [
      'Best months are October to April; July and August are punishingly hot.',
      'Spring can bring a khamsin sandstorm — keep a spare day in the plan.',
      'Most stays are cash only. Confirm the rate and currency in advance.',
      'Transfers from Marsa Matruh or Cairo are arranged privately; ask the property.',
    ],
    faq: [
      {
        q: 'Do Siwa hotels accept credit cards?',
        a: 'Rarely. A few places in town do, but ATMs are unreliable, so plan on cash for accommodation, meals and desert trips alike.',
      },
      {
        q: 'When is the best time to stay in Siwa?',
        a: 'October to April. Days are warm and nights genuinely cold. In summer the heat is severe and many camps close.',
      },
      {
        q: 'How do I get to Siwa Oasis?',
        a: 'By road, via Marsa Matruh. Most visitors take a private transfer or an overnight bus; the drive is long and the last stretch crosses open desert.',
      },
      {
        q: 'Does Siwify take a commission on bookings?',
        a: 'No. We do not handle bookings or payments. Each page links straight to the owner on WhatsApp.',
      },
    ],
    ar: {
      metaTitle: 'الإقامة في واحة سيوة — نزل بيئية ومخيمات وفنادق | Siwify',
      metaDescription:
        'الإقامة في سيوة: نزل بيئية مبنية بالكرشيف والملح، ومخيمات على حدود بحر الرمال الأعظم، وفنادق صغيرة قرب قلعة شالي. تواصل مع كل مكان مباشرة.',
      heading: 'أين تقيم في واحة سيوة',
      intro: [
        'تنقسم الإقامة في سيوة إلى ثلاثة أنواع: نزل بيئية مبنية بالكرشيف — الملح والطين والجريد — تحتفظ بالبرودة دون تكييف، ومخيمات تقع حيث يبدأ بحر الرمال الأعظم، وفنادق صغيرة في بلدة سيوة حول قلعة شالي على مسافة قريبة من العيون والسوق.',
        'توقّع البساطة لا الفخامة: جدران سميكة، وطاقة شمسية، وإفطاراً تحت النخيل. الإنترنت ضعيف أو معدوم خارج البلدة، وهذا في الغالب سبب المجيء.',
        'تختلف الأسعار كثيراً بين مخيم بسيط ونزل كامل الإقامة، ومعظم الأماكن تقبل النقد فقط. أكّد السعر والعملة قبل الوصول.',
        'لكل مكان في هذه الصفحة موقع مصغّر كتبه صاحبه، مع رقم واتساب مباشر. سيويفاي لا تأخذ عمولات ولا تتولى الحجز: أنت تتحدث مع من يدير المكان.',
      ],
      facts: [
        'أفضل الشهور من أكتوبر إلى أبريل، والصيف شديد الحرارة.',
        'قد تهب عاصفة خماسين في الربيع؛ اترك يوماً احتياطياً.',
        'معظم الأماكن نقدية فقط، فأكّد السعر مقدماً.',
        'التوصيل من مرسى مطروح أو القاهرة يُرتَّب مسبقاً مع مكان الإقامة.',
      ],
      faq: [
        {
          q: 'هل تقبل فنادق سيوة البطاقات البنكية؟',
          a: 'نادراً. تعتمد على النقد، فماكينات الصرف في البلدة غير موثوقة.',
        },
        {
          q: 'ما أفضل وقت للإقامة في سيوة؟',
          a: 'من أكتوبر إلى أبريل؛ الأيام دافئة والليالي باردة فعلاً. أما الصيف فقاسٍ وتغلق فيه مخيمات كثيرة.',
        },
        {
          q: 'هل تأخذ سيويفاي عمولة؟',
          a: 'لا. لا نتدخل في الحجز ولا في الدفع؛ كل صفحة تنقلك مباشرة إلى واتساب صاحب المكان.',
        },
      ],
    },
  },

  'siwa-go': {
    metaTitle: 'Siwa Oasis Tours & 4x4 Desert Trips — Local Guides | Siwify',
    metaDescription:
      'Day trips from Siwa Oasis: the Great Sand Sea, Bir Wahed, the cold spring, Fatnas Island and the Temple of the Oracle. Local operators, contacted directly.',
    heading: 'Tours, desert trips and getting around Siwa',
    intro: [
      'A Siwa day tends to start before dawn in the Great Sand Sea, where the dunes move from grey to gold as the light arrives, and end at Fatnas Island while the sun drops into the salt lake.',
      'Inside the oasis you can walk or take a tuk-tuk. Shali fortress, the Temple of the Oracle, Gebel al-Mawta and the springs are close together. The desert is different: beyond the paved ring you need a 4x4 and someone who reads the sand.',
      'Trips are priced per vehicle rather than per person, and the route is agreed before departure — dunes, the cold and hot springs at Bir Wahed, sandboarding, lunch in the shade. Ask what the total covers, not just the headline number.',
      'Every operator here has a minisite with their routes and a direct WhatsApp line. No commission, no booking desk, no middleman deciding which guide gets the work.',
    ],
    facts: [
      'Half-day trips cover Bir Wahed and the dunes; a full day adds the salt lakes and Fatnas.',
      'Agree the price, the route and the return time before the vehicle moves.',
      'Carry water and a scarf: the sand sea offers no shade at all.',
      'Tuk-tuks handle the town and the springs; they cannot cross deep sand.',
    ],
    faq: [
      {
        q: 'Do I need a guide to visit Siwa Oasis?',
        a: 'For the oasis itself, no: the monuments are walkable or a short tuk-tuk ride away. For the Great Sand Sea and the remote springs, go with a local 4x4 operator.',
      },
      {
        q: 'How much does a desert safari cost?',
        a: 'It is quoted per vehicle, so the price follows the route and the hours. Ask two operators and compare what the itinerary includes, not only the number.',
      },
      {
        q: 'Can Siwa be done as a day trip from Cairo?',
        a: 'It is a very long drive in each direction. Most visitors stay at least two nights, which is also the only way to see the dunes at sunrise.',
      },
    ],
    ar: {
      metaTitle: 'رحلات سيوة وسفاري الدفع الرباعي — مرشدون محليون | Siwify',
      metaDescription:
        'رحلات من واحة سيوة: بحر الرمال الأعظم، وبئر واحدة، والعين الباردة، وجزيرة فطناس، ومعبد الوحي. مشغّلون محليون وتواصل مباشر.',
      heading: 'الرحلات وسفاري الصحراء والتنقل في سيوة',
      intro: [
        'يبدأ يوم سيوة عادة قبل الفجر في بحر الرمال الأعظم، حيث تتحول الكثبان من الرمادي إلى الذهبي مع الضوء، وينتهي في جزيرة فطناس مع غروب الشمس على بحيرة الملح.',
        'داخل الواحة تمشي أو تستقل توك توك: قلعة شالي ومعبد الوحي وجبل الموتى والعيون قريبة من بعضها. أما الصحراء فتحتاج سيارة دفع رباعي ومن يعرف الطريق.',
        'تُحسب الرحلات للسيارة لا للفرد، ويُتفق على المسار قبل الانطلاق. اسأل عن السعر الإجمالي وما يشمله، لا عن الرقم المعلن فقط.',
        'لكل مشغّل هنا موقع مصغّر بمساره ورقم واتساب مباشر. لا عمولة ولا مكتب حجز وسيط.',
      ],
      facts: [
        'نصف اليوم لبئر واحدة والكثبان، واليوم الكامل يضيف بحيرات الملح وفطناس.',
        'اتفق على السعر والمسار ووقت العودة قبل انطلاق السيارة.',
        'خذ ماءً وغطاءً للرأس؛ لا ظل في بحر الرمال.',
        'التوك توك للبلدة والعيون، ولا يعبر الرمال العميقة.',
      ],
      faq: [
        {
          q: 'هل أحتاج مرشداً في سيوة؟',
          a: 'داخل الواحة لا؛ الآثار قريبة ويمكن المشي إليها. أما بحر الرمال والعيون البعيدة فتحتاج مشغّلاً محلياً بسيارة دفع رباعي.',
        },
        {
          q: 'كم تكلفة سفاري الصحراء؟',
          a: 'تُسعَّر للسيارة، لذا يتبع السعر المسار وعدد الساعات. اسأل مشغّلين ووازن ما يشمله البرنامج لا الرقم وحده.',
        },
        {
          q: 'هل يمكن زيارة سيوة في يوم واحد من القاهرة؟',
          a: 'المسافة طويلة في الاتجاهين. معظم الزوار يقيمون ليلتين على الأقل، وهي الطريقة الوحيدة لرؤية الكثبان عند الشروق.',
        },
      ],
    },
  },

  'siwa-retreats': {
    metaTitle: 'Siwa Wellness Retreats — Salt Lakes, Hot Springs & Sand Baths | Siwify',
    metaDescription:
      'Floating in the salt lakes, hot springs, sand baths and desert silence in Siwa Oasis. Small-scale traditional wellness, with providers contacted directly.',
    heading: 'Wellness and retreats in Siwa Oasis',
    intro: [
      'Wellness in Siwa is not a spa industry. It is four things the desert already provides: water so salty you cannot sink, springs that run hot and cold, sand hot enough to bury a body in, and silence.',
      'A retreat day usually follows the light — a spring at dawn, breakfast in palm shade, the salt lakes at midday, a sand bath as the ground cools, tea at dusk. Stargazing is the part nobody advertises and everybody remembers.',
      'The infrastructure is small and traditional. Ask what is actually included: a guide, a vehicle, meals, a room. Treat any health claim as the provider speaking for themselves, not as medical advice.',
      'Each provider listed here can be reached directly on WhatsApp, and Siwify takes no commission from whatever you agree with them.',
    ],
    facts: [
      'The salt lakes are hyper-saline: float rather than swim, keep water out of your eyes, rinse afterwards.',
      'Sand baths are hot and dehydrating; skip them if you have heart or circulation problems.',
      'Sun protection and drinking water matter more than any treatment here.',
      'October to April is the season; desert nights are cold even then.',
    ],
    faq: [
      {
        q: 'What is a Siwan sand bath?',
        a: 'You are buried to the neck in sun-heated sand for ten to twenty minutes, then rinsed with fresh water. It is a traditional practice, not a medical treatment, and provider practice varies.',
      },
      {
        q: 'Is it safe to swim in the salt lakes?',
        a: 'You float rather than swim. Avoid open wounds, keep your eyes clear, and shower with fresh water afterwards.',
      },
      {
        q: 'Are Siwa retreats run by hotels?',
        a: 'Sometimes. More often they are small local operations that pair a camp or lodge with a guide. Ask each provider what the price covers before you commit.',
      },
    ],
    ar: {
      metaTitle: 'استجمام في سيوة — بحيرات الملح والعيون الكبريتية والرمال | Siwify',
      metaDescription:
        'الطفو في بحيرات الملح، والعيون الحارة، والحمّام الرملي، وصمت الصحراء في واحة سيوة. تجارب صغيرة وتقليدية وتواصل مباشر مع مقدّميها.',
      heading: 'الاستجمام والاسترخاء في واحة سيوة',
      intro: [
        'الاستجمام في سيوة ليس صناعة منتجعات. هو أربعة أشياء تمنحها الصحراء أصلاً: ماء مالح لا يمكنك الغرق فيه، وعيون ساخنة وباردة، ورمال تكفي حرارتها للدفن، وصمت.',
        'يتبع يوم الاسترخاء ضوء الشمس: عين عند الفجر، وإفطار في ظل النخل، وبحيرات الملح في الظهيرة، وحمّام رملي عند اعتدال الأرض، وشاي عند الغروب.',
        'البنية بسيطة وتقليدية. اسأل عمّا يشمله العرض فعلاً: مرشد، سيارة، طعام، غرفة. واعتبرها تجارب لا ادعاءات طبية.',
        'يمكنك التواصل المباشر مع كل مقدّم خدمة عبر واتساب، ولا تأخذ سيويفاي عمولة على ما تتفقون عليه.',
      ],
      facts: [
        'بحيرات الملح شديدة الملوحة: اطفُ ولا تسبح، وأغلق عينيك، واغتسل بعدها.',
        'الحمّام الرملي ساخن ويجفف الجسم؛ تجنّبه إن كان لديك مشاكل في القلب أو الدورة الدموية.',
        'واقي الشمس وماء الشرب أهم من أي جلسة علاجية.',
        'الموسم من أكتوبر إلى أبريل، والليالي باردة.',
      ],
      faq: [
        {
          q: 'ما هو الحمّام الرملي في سيوة؟',
          a: 'يُدفن الجسم حتى الرقبة في رمل مسخّن بالشمس لعشر إلى عشرين دقيقة ثم يُغسل. هو عادة تقليدية لا علاج طبي، ويختلف من مقدّم لآخر.',
        },
        {
          q: 'هل السباحة في بحيرات الملح آمنة؟',
          a: 'أنت تطفو ولا تسبح. تجنّب الجروح المفتوحة، واحفظ عينيك من الماء، واغتسل بماء عذب بعدها.',
        },
        {
          q: 'هل هذه التجارب تديرها فنادق؟',
          a: 'أحياناً. في الغالب تكون عمليات محلية صغيرة تجمع مخيماً أو نزلاً مع مرشد. اسأل عن مكوّنات السعر قبل الالتزام.',
        },
      ],
    },
  },
};
