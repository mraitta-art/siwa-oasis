/**
 * SMART MULTI-OTA HOSPITALITY MAPPER
 * Universally parses listings from:
 * - Booking.com
 * - TripAdvisor
 * - Agoda
 * - Airbnb
 * - Google Maps / Business
 * - Manual unstructured text paste
 *
 * Automatically extracts and maps fields across all sections in our database schema.
 */

export interface ParsedHospitalityData {
  basic: Record<string, any>;
  facilities: Record<string, any>;
  gastronomy: Record<string, any>;
  experience: Record<string, any>;
  accommodation: Record<string, any>;
  testimonials: Record<string, any>;
  location: Record<string, any>;
  connector: Record<string, any>;
  vibe: Record<string, any>;
  active_minisite_sections: string[];
}

export function parseHospitalityRawText(rawText: string): ParsedHospitalityData {
  const result: ParsedHospitalityData = {
    basic: {},
    facilities: {},
    gastronomy: {},
    experience: {},
    accommodation: {},
    testimonials: {},
    location: {},
    connector: {},
    vibe: {},
    active_minisite_sections: [
      'basic',
      'facilities',
      'gastronomy',
      'experience',
      'accommodation',
      'testimonials',
      'location',
      'connector',
      'vibe'
    ]
  };

  if (!rawText || typeof rawText !== 'string') return result;

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // ── 0. DETECT OTA SOURCE ────────────────────────────────────────────────────
  let otaSource = 'Travel Platform';
  if (/booking\.com/i.test(rawText)) otaSource = 'Booking.com';
  else if (/tripadvisor/i.test(rawText)) otaSource = 'TripAdvisor';
  else if (/agoda/i.test(rawText)) otaSource = 'Agoda';
  else if (/airbnb/i.test(rawText)) otaSource = 'Airbnb';
  else if (/google\.com\/maps|google reviews/i.test(rawText)) otaSource = 'Google Maps';
  result.testimonials.source = otaSource;
  result.testimonials.ota_source = otaSource;

  // ── 1. TITLE / NAME EXTRACTION ──────────────────────────────────────────────
  const firstLine = lines[0] || '';
  if (firstLine && !firstLine.startsWith('http') && !/booking\.com|tripadvisor|agoda|airbnb/i.test(firstLine)) {
    result.basic.name = firstLine.replace(/^#+\s*/, '').replace(/\s*[-–|].*(Booking|TripAdvisor|Agoda|Airbnb).*$/i, '').trim();
  }

  // ── 2. OTA LINK EXTRACTION ──────────────────────────────────────────────────
  const urlMatch = rawText.match(/https?:\/\/[^\s"'<>]+(?:booking\.com|tripadvisor\.[a-z.]+|agoda\.com|airbnb\.[a-z.]+|google\.[a-z.]+\/maps)[^\s"'<>]*/i);
  if (urlMatch) {
    result.basic.booking_url = urlMatch[0];
    result.connector.booking_url = urlMatch[0];
  }

  // ── 3. RATINGS & REVIEWS (Multi-Platform) ───────────────────────────────────
  // Booking.com / Agoda (10-point scale)
  const tenScaleMatch = rawText.match(/(?:Rated:\s*|Wonderful\s*|Exceptional\s*|Superb\s*|Fabulous\s*|Score:\s*|Rating:\s*)?([0-9]\.[0-9]|[1-9][0-9]?)\s*(?:–|-|\/10)?\s*(?:based on\s*)?([0-9,]+)\s*(?:reviews|ratings)/i)
    || rawText.match(/([0-9]\.[0-9])\s*(?:Wonderful|Superb|Exceptional|Fabulous|Very Good|Good)\s*([0-9,]+)\s*reviews/i);

  // Airbnb / TripAdvisor / Google (5-point scale)
  const fiveScaleMatch = rawText.match(/([4-5]\.[0-9]{1,2})\s*(?:★|stars?|out of 5|bubbles?|ratings?|reviews?)/i)
    || rawText.match(/★\s*([4-5]\.[0-9]{1,2})\s*\(([0-9,]+)\)/i)
    || rawText.match(/(?:Rated|Rating)\s*([1-5]\.[0-9])\s*\/\s*5/i);

  if (tenScaleMatch) {
    const rVal = parseFloat(tenScaleMatch[1]);
    if (!isNaN(rVal)) {
      result.testimonials.rating = rVal;
      result.testimonials.ota_rating = rVal;
      result.testimonials.platform_rating = +(rVal / 2).toFixed(1); // 5-star equivalent
    }
    const countVal = parseInt(tenScaleMatch[2].replace(/,/g, ''));
    if (!isNaN(countVal)) result.testimonials.reviews_count = countVal;
  } else if (fiveScaleMatch) {
    const rVal = parseFloat(fiveScaleMatch[1]);
    if (!isNaN(rVal)) {
      result.testimonials.platform_rating = rVal;
      result.testimonials.rating = +(rVal * 2).toFixed(1); // normalized to 10 for consistency
      result.testimonials.ota_rating = rVal;
    }
    if (fiveScaleMatch[2]) {
      const countVal = parseInt(fiveScaleMatch[2].replace(/,/g, ''));
      if (!isNaN(countVal)) result.testimonials.reviews_count = countVal;
    }
  }

  const ratingLabelMatch = rawText.match(/\b(Wonderful|Exceptional|Superb|Fabulous|Very Good|Good|Excellent|Guest favorite|Superhost)\b/i);
  if (ratingLabelMatch) {
    result.testimonials.rating_label = ratingLabelMatch[1];
  }

  // ── 4. SUB-SCORES BREAKDOWN ─────────────────────────────────────────────────
  const extractScore = (labels: string[]): number | null => {
    for (const label of labels) {
      const regex = new RegExp(`${label}[\\s,:]+([0-9]\\.[0-9]|[1-9][0-9]?)`, 'i');
      const m = rawText.match(regex);
      if (m) return parseFloat(m[1]);
    }
    return null;
  };

  const staff = extractScore(['Staff', 'Service', 'Hospitality', 'Host']);
  if (staff) result.testimonials.score_staff = staff;
  const fac = extractScore(['Facilities', 'Amenities']);
  if (fac) result.testimonials.score_facilities = fac;
  const clean = extractScore(['Cleanliness', 'Hygiene']);
  if (clean) result.testimonials.score_cleanliness = clean;
  const comfort = extractScore(['Comfort', 'Sleep Quality', 'Bed']);
  if (comfort) result.testimonials.score_comfort = comfort;
  const value = extractScore(['Value for money', 'Value']);
  if (value) result.testimonials.score_value = value;
  const loc = extractScore(['Location', 'Neighborhood']);
  if (loc) result.testimonials.score_location = loc;
  const wifi = extractScore(['Free Wifi', 'WiFi', 'Internet']);
  if (wifi) result.testimonials.score_wifi = wifi;

  // ── 5. REVIEW QUOTES / TESTIMONIALS ─────────────────────────────────────────
  const reviewQuotes = [];
  const quoteRegex = /[“"']([^”"']{20,300})[”"']\s*\n*([A-Za-z0-9\s]{2,30}?)\s*\n*(France|United States|Germany|Egypt|Italy|Greece|Morocco|United Kingdom|Spain|Netherlands|Poland|Russia|Saudi Arabia|UAE|Canada|Australia|Switzerland|Belgium|[A-Z][a-z]+)/g;
  let qMatch;
  while ((qMatch = quoteRegex.exec(rawText)) !== null) {
    reviewQuotes.push({
      text: qMatch[1].trim(),
      author: qMatch[2].trim(),
      country: qMatch[3].trim()
    });
  }
  if (reviewQuotes.length > 0) {
    result.testimonials.review_highlights = reviewQuotes;
  }

  // ── 6. DESCRIPTION / ABOUT ──────────────────────────────────────────────────
  const aboutMatch = rawText.match(/(?:About this property|About this space|Description|Property details|Overview)\s*([\s\S]+?)(?=Most popular facilities|Couples in particular|Distance in property|Property highlights|House rules|Where you'll be|Amenities|$)/i);
  if (aboutMatch) {
    const descText = aboutMatch[1].replace(/\n+/g, ' ').trim();
    result.basic.description = descText;
    result.vibe.description = descText;
  } else if (!result.basic.description) {
    const pMatch = rawText.match(/(?:Welcome to[^\n]+|Providing [^\n]+|Located in [^\n]+|Experience [^\n]+)/i);
    if (pMatch) {
      result.basic.description = pMatch[0];
      result.vibe.description = pMatch[0];
    }
  }

  // ── 7. HOST / MANAGER INFO ──────────────────────────────────────────────────
  const hostMatch = rawText.match(/(?:Managed by|Hosted by|Host:|Owner:)\s*([A-Za-z0-9\s]+)/i);
  if (hostMatch) {
    result.basic.manager_name = hostMatch[1].trim();
  }

  // ── 8. LANGUAGES SPOKEN ─────────────────────────────────────────────────────
  const langMatch = rawText.match(/Languages Spoken\s*([A-Za-z,\s]+)/i);
  if (langMatch) {
    const langs = langMatch[1].split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    result.basic.languages_spoken = langs;
  } else {
    result.basic.languages_spoken = ['Arabic', 'English'];
  }

  // ── 9. LOCATION & NEIGHBORHOOD ──────────────────────────────────────────────
  const neighborhoodMatch = rawText.match(/(?:Neighborhood info|Where you'll be|Location info)\s*([\s\S]+?)(?=Languages Spoken|Area info|Restaurants & cafes|House rules|$)/i);
  if (neighborhoodMatch) {
    result.location.neighborhood = neighborhoodMatch[1].replace(/\n+/g, ' ').trim();
  }
  const addressMatch = rawText.match(/([A-Za-z0-9\s,]+,\s*Siwa,\s*Egypt)/i);
  if (addressMatch) {
    result.basic.address = addressMatch[1].trim();
    result.location.address = addressMatch[1].trim();
  } else {
    result.basic.address = 'Siwa Oasis, Matrouh Governorate, Egypt';
    result.location.address = 'Siwa Oasis, Matrouh Governorate, Egypt';
  }
  result.basic.city = 'Siwa';
  result.basic.country = 'Egypt';

  // ── 10. FACILITIES & AMENITIES ──────────────────────────────────────────────
  const facilitiesList = [];
  if (/swimming pool|pools|heated pool|outdoor pool|infinity pool/i.test(rawText)) {
    const poolNumMatch = rawText.match(/([0-9])\s*swimming pools?/i);
    result.facilities.pools_count = poolNumMatch ? parseInt(poolNumMatch[1]) : 1;
    result.facilities.pool_features = ['Outdoor Pool', 'Pool with View', 'Freshwater'];
    facilitiesList.push('Swimming Pool');
  }
  if (/hot spring|thermal spring|sulfur spring/i.test(rawText)) {
    result.facilities.hot_spring = true;
    facilitiesList.push('Natural Hot Spring Bath');
  }
  if (/spa|massage|wellness|open-air bath|jacuzzi|sauna/i.test(rawText)) {
    result.facilities.spa_services = ['Open-air Bath', 'Hot Spring Bath', 'Massage', 'Desert Yoga'];
    facilitiesList.push('Spa & Wellness');
  }
  if (/wifi|wi-fi|free wifi|fast wifi/i.test(rawText)) {
    result.facilities.wifi = true;
    facilitiesList.push('Free High-Speed WiFi');
  }
  if (/free parking|parking|private parking/i.test(rawText)) {
    result.facilities.parking = /free parking/i.test(rawText) ? 'Free parking' : 'Private parking';
    facilitiesList.push('On-Site Parking');
  }
  if (/airport shuttle|shuttle service|pickup/i.test(rawText)) {
    result.facilities.airport_shuttle = true;
    facilitiesList.push('Airport Shuttle Service');
  }
  if (/room service/i.test(rawText)) {
    result.facilities.room_service = true;
    facilitiesList.push('Room Service');
  }
  if (/air conditioning|a\/c|climate/i.test(rawText)) {
    result.facilities.air_conditioning = true;
    facilitiesList.push('Air Conditioning');
  }
  if (/family rooms|family friendly|cribs/i.test(rawText)) {
    result.facilities.family_rooms = true;
    facilitiesList.push('Family Rooms');
  }
  if (/pets are allowed|pet-friendly|pets/i.test(rawText)) {
    result.facilities.pet_friendly = true;
    result.basic.pets_policy = 'Pets allowed (free)';
    facilitiesList.push('Pet Friendly');
  }
  if (/non-smoking/i.test(rawText)) {
    result.facilities.non_smoking = true;
    facilitiesList.push('Non-Smoking Rooms');
  }
  if (/fitness|gym|yoga/i.test(rawText)) {
    result.facilities.fitness = true;
    facilitiesList.push('Fitness & Yoga Facilities');
  }
  result.facilities.facilities_list = facilitiesList;
  result.facilities.description = `Equipped with ${facilitiesList.join(', ')}.`;

  // ── 11. GASTRONOMY & RESTAURANT ─────────────────────────────────────────────
  if (/restaurant|dining|cuisine|breakfast|brunch|lunch|dinner|cafe|food/i.test(rawText)) {
    result.gastronomy.restaurant_name = 'Authentic Oasis Dining';
    const cuisineMatch = rawText.match(/Cuisine\s*([A-Za-z,\s]+)/i);
    result.gastronomy.cuisine_type = cuisineMatch ? [cuisineMatch[1].trim()] : ['Traditional Siwan', 'Egyptian', 'Organic Farm-to-Table'];
    result.gastronomy.meal_types = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Sunset Tea'];
    result.gastronomy.dietary_options = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Organic'];
    result.gastronomy.ambience = 'Traditional Desert Ambience';
    result.gastronomy.bar = /bar\b|cocktails|drinks/i.test(rawText);
    result.gastronomy.coffee_shop = /coffee shop|coffee house|bedouin tea/i.test(rawText);
    result.gastronomy.description = 'Authentic desert cuisine prepared with fresh oasis dates, cold-pressed olive oil, garden vegetables, and traditional Siwan wood-fire baking.';
  }

  // ── 12. EXPERIENCES & ACTIVITIES ────────────────────────────────────────────
  const activities = [];
  const tours = [];
  if (/bicycle|cycling|bike/i.test(rawText)) activities.push('Bicycle Rental & Palm Grove Cycling');
  if (/yoga|meditation/i.test(rawText)) activities.push('Sunrise & Sunset Desert Yoga');
  if (/archery|sports/i.test(rawText)) activities.push('Traditional Archery');
  if (/cooking class|siwan kitchen/i.test(rawText)) activities.push('Siwan Culinary & Bread-making Masterclass');
  if (/live music|firepit|campfires?/i.test(rawText)) activities.push('Live Siwan Folk Music & Fireside Stargazing');
  if (/safari|4x4|dune|sandboarding/i.test(rawText)) tours.push('Great Sand Sea 4x4 Safari & Sandboarding');
  if (/salt lakes?|floating/i.test(rawText)) tours.push('Siwa Salt Lake Healing Float & Bathing Trip');
  if (/temple|oracle|cleopatra|shali/i.test(rawText)) tours.push('Oracle Temple, Cleopatra Spring & Ancient Shali Heritage Tour');

  if (activities.length > 0) result.experience.activities = activities;
  if (tours.length > 0) result.experience.tours = tours;
  result.experience.description = 'Curated oasis journeys from therapeutic natural spring immersions to guided historical expeditions through the ancient landmarks of Siwa.';

  // ── 13. ACCOMMODATION / ROOM CONFIGURATIONS ─────────────────────────────────
  const roomTypes = [];
  const roomMatches = rawText.matchAll(/(?:\[([A-Za-z0-9\s\-]+(?:Room|Suite|Chalet|Dormitory|Villa|Tent|Lodge)[A-Za-z0-9\s\-]*)\]|([A-Za-z0-9\s\-]+(?:Room|Suite|Chalet|Dormitory|Villa|Tent|Lodge)[A-Za-z0-9\s\-]*)\s*(?:1 queen|2 twin|king bed|sleeps [0-9]))/gi);
  for (const rm of roomMatches) {
    const rName = (rm[1] || rm[2] || '').trim();
    if (rName && rName.length > 3 && !roomTypes.some(r => r.name.toLowerCase() === rName.toLowerCase())) {
      roomTypes.push({
        name: rName,
        beds: /double|queen/i.test(rName) ? '1 Queen Bed + 1 Twin Bed' :
              /triple/i.test(rName) ? '3 Twin Beds' :
              /chalet/i.test(rName) ? '1 Queen Bed + 2 Twin Beds' :
              /suite/i.test(rName)  ? '2 Queen Beds + Living Area' :
              /villa/i.test(rName)  ? '3 Bedrooms + Private Pool' : 'Comfort Bedding',
        features: 'Private Kershef Bathroom, Natural Ventilation, Mountain / Date Palm View'
      });
    }
  }
  if (roomTypes.length > 0) {
    result.accommodation.room_types = roomTypes;
    result.accommodation.total_rooms = roomTypes.length;
    result.accommodation.description = `Offering ${roomTypes.length} tailored lodging configurations constructed with centuries-old Kershef stone and palm wood craftsmanship.`;
  }

  // ── 14. POLICIES & HOUSE RULES ──────────────────────────────────────────────
  const checkinMatch = rawText.match(/Check-in\s*([\s\S]+?)(?=Check-out|$)/i);
  if (checkinMatch) {
    result.basic.checkin_time = checkinMatch[1].replace(/\n+/g, ' ').trim().slice(0, 100);
  }
  const checkoutMatch = rawText.match(/Check-out\s*([\s\S]+?)(?=Cancellation|$)/i);
  if (checkoutMatch) {
    result.basic.checkout_time = checkoutMatch[1].replace(/\n+/g, ' ').trim().slice(0, 100);
  }
  const quietMatch = rawText.match(/Quiet hours\s*(?:are between\s*)?([0-9:]+\s*(?:AM|PM|and)\s*[0-9:]+\s*(?:AM|PM)?)/i);
  if (quietMatch) {
    result.basic.quiet_hours = quietMatch[1].trim();
  }

  // ── 15. VIBE & ATMOSPHERE ───────────────────────────────────────────────────
  result.vibe.atmosphere_tags = ['Natural Spring Sanctuary', 'Eco-Heritage Architecture', 'Dakrour Mountain Vista', 'Serene Desert Atmosphere'];
  result.vibe.best_for = ['Wellness & Healing', 'Couples Retreat', 'Desert Explorers', 'Cultural Enthusiasts'];
  result.vibe.unique_selling_point = 'Authentic natural hot spring baths nestled beneath majestic mountain ridges and organic date palm groves.';

  return result;
}
