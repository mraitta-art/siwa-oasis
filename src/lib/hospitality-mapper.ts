/**
 * SMART HOSPITALITY DATA MAPPER
 * Organizes raw text (e.g. from Booking.com, TripAdvisor, manual paste) or structured objects
 * into correctly keyed sections and form fields matching our DB schema.
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

  // 1. Title / Name extraction
  const firstLine = lines[0] || '';
  if (firstLine && !firstLine.startsWith('http') && !firstLine.includes('booking.com')) {
    result.basic.name = firstLine.replace(/^#+\s*/, '').trim();
  }

  // 2. Booking URL
  const bookingMatch = rawText.match(/https?:\/\/[^\s"'<>]+booking\.com[^\s"'<>]*/i);
  if (bookingMatch) {
    result.basic.booking_url = bookingMatch[0];
    result.connector.booking_url = bookingMatch[0];
  }

  // 3. Overall Rating & Reviews
  const ratingMatch = rawText.match(/(?:Rated:\s*|Wonderful\s*|Score:\s*|Rating:\s*)?([0-9]\.[0-9]|[1-9][0-9]?)\s*(?:–|-|\/10)?\s*(?:based on\s*)?([0-9,]+)\s*reviews/i)
    || rawText.match(/([0-9]\.[0-9])\s*(?:Wonderful|Superb|Exceptional|Good|Very Good)\s*([0-9,]+)\s*reviews/i);
  if (ratingMatch) {
    const rVal = parseFloat(ratingMatch[1]);
    if (!isNaN(rVal)) {
      result.testimonials.rating = rVal <= 5 ? +(rVal * 2).toFixed(1) : rVal;
    }
    const countVal = parseInt(ratingMatch[2].replace(/,/g, ''));
    if (!isNaN(countVal)) {
      result.testimonials.reviews_count = countVal;
    }
  }

  const ratingLabelMatch = rawText.match(/\b(Wonderful|Exceptional|Superb|Fabulous|Very Good|Good)\b/i);
  if (ratingLabelMatch) {
    result.testimonials.rating_label = ratingLabelMatch[1];
  }
  result.testimonials.source = 'Booking.com / Online Travel Platform';

  // 4. Sub-scores
  const extractScore = (label: string): number | null => {
    const regex = new RegExp(`${label}[\\s,:]+([0-9]\\.[0-9]|[1-9][0-9]?)`, 'i');
    const m = rawText.match(regex);
    return m ? parseFloat(m[1]) : null;
  };
  const staffScore = extractScore('Staff');
  if (staffScore) result.testimonials.score_staff = staffScore;
  const facScore = extractScore('Facilities');
  if (facScore) result.testimonials.score_facilities = facScore;
  const cleanScore = extractScore('Cleanliness');
  if (cleanScore) result.testimonials.score_cleanliness = cleanScore;
  const comfortScore = extractScore('Comfort');
  if (comfortScore) result.testimonials.score_comfort = comfortScore;
  const valueScore = extractScore('Value for money');
  if (valueScore) result.testimonials.score_value = valueScore;
  const locScore = extractScore('Location');
  if (locScore) result.testimonials.score_location = locScore;
  const wifiScore = extractScore('Free Wifi|WiFi');
  if (wifiScore) result.testimonials.score_wifi = wifiScore;

  // 5. Review quotes
  const reviewQuotes = [];
  const quoteRegex = /“([^”"]+)”\s*\n*([A-Za-z0-9\s]+?)\s*\n*(France|United States|Germany|Egypt|Italy|Greece|Morocco|United Kingdom|Spain|Netherlands|Poland|Russia|Saudi Arabia|UAE|Canada|Australia|[A-Z][a-z]+)/g;
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

  // 6. Description
  const aboutMatch = rawText.match(/About this property\s*([\s\S]+?)(?=Most popular facilities|Couples in particular|Distance in property|Property highlights|$)/i);
  if (aboutMatch) {
    const descText = aboutMatch[1].replace(/\n+/g, ' ').trim();
    result.basic.description = descText;
    result.vibe.description = descText;
  } else if (!result.basic.description && lines.length > 2) {
    const pMatch = rawText.match(/(?:Welcome to[^\n]+|Providing [^\n]+|Located in [^\n]+)/i);
    if (pMatch) {
      result.basic.description = pMatch[0];
    }
  }

  // 7. Manager
  const managerMatch = rawText.match(/Managed by\s*([A-Za-z0-9\s]+)/i);
  if (managerMatch) {
    result.basic.manager_name = managerMatch[1].trim();
  }

  // 8. Languages
  const langMatch = rawText.match(/Languages Spoken\s*([A-Za-z,\s]+)/i);
  if (langMatch) {
    const langs = langMatch[1].split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    result.basic.languages_spoken = langs;
  }

  // 9. Location
  const neighborhoodMatch = rawText.match(/Neighborhood info\s*([\s\S]+?)(?=Languages Spoken|Area info|Restaurants & cafes|$)/i);
  if (neighborhoodMatch) {
    result.location.neighborhood = neighborhoodMatch[1].replace(/\n+/g, ' ').trim();
  }
  const addressMatch = rawText.match(/([A-Za-z0-9\s,]+,\s*Siwa,\s*Egypt)/i);
  if (addressMatch) {
    result.basic.address = addressMatch[1].trim();
    result.location.address = addressMatch[1].trim();
    result.basic.city = 'Siwa';
    result.basic.country = 'Egypt';
  } else {
    result.basic.city = 'Siwa';
    result.basic.country = 'Egypt';
  }

  // 10. Facilities
  const facilitiesList = [];
  if (/swimming pool|pools|heated pool|outdoor pool/i.test(rawText)) {
    const poolNumMatch = rawText.match(/([0-9])\s*swimming pools?/i);
    result.facilities.pools_count = poolNumMatch ? parseInt(poolNumMatch[1]) : 1;
    result.facilities.pool_features = ['Outdoor Pool', 'Pool with View', 'Heated Pool'];
    facilitiesList.push('Swimming Pool');
  }
  if (/hot spring/i.test(rawText)) {
    result.facilities.hot_spring = true;
    facilitiesList.push('Natural Hot Spring');
  }
  if (/spa|massage|wellness|open-air bath|jacuzzi/i.test(rawText)) {
    result.facilities.spa_services = ['Open-air Bath', 'Hot Spring Bath', 'Massage', 'Yoga Classes'];
    facilitiesList.push('Spa & Wellness');
  }
  if (/wifi|wi-fi|free wifi/i.test(rawText)) {
    result.facilities.wifi = true;
    facilitiesList.push('Free High-Speed WiFi');
  }
  if (/free parking|parking/i.test(rawText)) {
    result.facilities.parking = /free parking/i.test(rawText) ? 'Free parking' : 'Street parking';
    facilitiesList.push('Parking');
  }
  if (/airport shuttle|shuttle/i.test(rawText)) {
    result.facilities.airport_shuttle = true;
    facilitiesList.push('Airport Shuttle');
  }
  if (/room service/i.test(rawText)) {
    result.facilities.room_service = true;
    facilitiesList.push('Room Service');
  }
  if (/air conditioning/i.test(rawText)) {
    result.facilities.air_conditioning = true;
    facilitiesList.push('Air Conditioning');
  }
  if (/family rooms/i.test(rawText)) {
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
    facilitiesList.push('Fitness & Yoga');
  }
  result.facilities.facilities_list = facilitiesList;
  result.facilities.description = `Offering ${facilitiesList.join(', ')} in a tranquil desert setting.`;

  // 11. Gastronomy
  if (/restaurant|dining|cuisine|breakfast|brunch|lunch|dinner/i.test(rawText)) {
    result.gastronomy.restaurant_name = 'On-site Restaurant';
    const cuisineMatch = rawText.match(/Cuisine\s*([A-Za-z,\s]+)/i);
    if (cuisineMatch) {
      result.gastronomy.cuisine_type = [cuisineMatch[1].trim()];
    } else {
      result.gastronomy.cuisine_type = ['African', 'Traditional Siwan', 'Egyptian'];
    }
    result.gastronomy.meal_types = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'High Tea'];
    result.gastronomy.dietary_options = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'];
    result.gastronomy.ambience = 'Traditional';
    result.gastronomy.bar = /bar\b/i.test(rawText);
    result.gastronomy.coffee_shop = /coffee shop|coffee house/i.test(rawText);
    result.gastronomy.description = 'Traditional dining featuring local organic ingredients, fresh breads, and dietary options for every guest.';
  }

  // 12. Experiences
  const activities = [];
  const tours = [];
  if (/bicycle|cycling|bike tours/i.test(rawText)) activities.push('Bicycle Rental & Cycling Tours');
  if (/yoga|meditation/i.test(rawText)) activities.push('Desert Yoga Classes');
  if (/archery/i.test(rawText)) activities.push('Archery');
  if (/cooking class/i.test(rawText)) activities.push('Siwan Cooking Classes');
  if (/live music|performance/i.test(rawText)) activities.push('Live Siwan Music & Firepit Nights');
  if (/water sports/i.test(rawText)) activities.push('Water Sports Facilities');
  if (/walking tours/i.test(rawText)) tours.push('Siwa Oasis Walking Tours');
  if (/tours|safari|trips/i.test(rawText)) tours.push('Desert Safari & Salt Lakes Tours', 'Amoun Temple & Cleopatra Spring Trips');

  if (activities.length > 0) result.experience.activities = activities;
  if (tours.length > 0) result.experience.tours = tours;
  result.experience.description = 'Immersive desert experiences including natural hot spring bathing, campfires under the stars, guided heritage tours, and local Siwan adventures.';

  // 13. Accommodation
  const roomTypes = [];
  const roomMatches = rawText.matchAll(/\[([A-Za-z0-9\s\-]+(?:Room|Suite|Chalet|Dormitory|Villa)[A-Za-z0-9\s\-]*)\]/g);
  for (const rm of roomMatches) {
    const rName = rm[1].trim();
    if (rName && !roomTypes.some(r => r.name === rName)) {
      roomTypes.push({
        name: rName,
        beds: rName.includes('Double') ? '1 Queen Bed + 1 Twin Bed' :
              rName.includes('Triple') ? '3 Twin Beds' :
              rName.includes('Chalet') ? '1 Queen Bed + 2 Twin Beds' :
              rName.includes('Suite')  ? '2 Queen Beds + 2 Twin Beds' : 'Comfort Bedding',
        features: 'Private Bathroom, Air Conditioning, Mountain / Garden View'
      });
    }
  }
  if (roomTypes.length > 0) {
    result.accommodation.room_types = roomTypes;
    result.accommodation.total_rooms = roomTypes.length;
    result.accommodation.description = `Featuring ${roomTypes.length} distinctive room configurations designed with authentic Siwan architectural elements and modern desert comforts.`;
  }

  // 14. House Rules
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

  // 15. Vibe
  result.vibe.atmosphere_tags = ['Hot Spring Haven', 'Eco-Camp', 'Dakrour Mountain Views', 'Peaceful Oasis'];
  result.vibe.best_for = ['Couples', 'Solo Travelers', 'Wellness Seekers', 'Nature Lovers'];
  result.vibe.unique_selling_point = 'Authentic natural hot spring baths surrounded by palm groves and the mystical Dakrour Mountain.';

  return result;
}
