const { extractTextSourceData } = require('./src/lib/source-agent.js');

const rawText = `Nour El Waha Hotel
Siwa Oasis, 99999 Siwa, Egypt
7.5 Rated: Good 7.5 ? based on 23 reviews
Free Wifi, Indoor swimming pool, Free parking, Restaurant, Room service, Non-smoking rooms, Airport shuttle, Family rooms, Bar, Breakfast
Property highlights: Top Location: Highly rated by recent guests (8.8), Halal, Free private parking available at the hotel

Room Types:
- Standard Triple Room: 3 twin beds
- Standard Double or Twin Room: 2 twin beds or 1 queen bed
- Standard Single Room: 1 twin bed
- Quadruple Room with Balcony: 4 full beds

Categories:
Staff 7.8, Facilities 7.9, Cleanliness 7.4, Comfort 6.6, Value for money 7.4, Location 8.8, Free Wifi 10

Restaurants:
Restaurant #1: Mediterranean, Middle Eastern, Pizza, Local, Grill/BBQ
Open for Breakfast, Brunch, Lunch, Dinner. Ambience: Family-friendly, Traditional, Romantic. Halal.

Facilities:
Outdoors: Outdoor fireplace, Picnic area, BBQ facilities, Balcony, Terrace, Garden
Activities: Bicycle rental, Tour or class about local culture, Bike tours, Walking tours, Water sports, Horseback riding, Cycling, Hiking, Playground, Fishing
Food & Drink: Special diet meals, Breakfast in the room, Bar, Restaurant
Services: 24-hour front desk, Tour desk, Currency exchange, Concierge, Laundry, Dry cleaning, Ironing
Safety & Security: Fire extinguishers, CCTV, Smoke alarms, Security alarm, 24-hour security, Safe
Pets: Pets are allowed. No extra charges.

House rules:
Check-in: From 2:00 PM
Check-out: Until 12:00 PM
Children over 6 welcome. No cribs. Pets free.
`;

async function test() {
  console.log('Testing AI Text Parser on Booking.com data...\n');
  try {
    const result = await extractTextSourceData(rawText, 'https://www.booking.com/hotel/eg/nour-el-waha.html');
    console.log('EXTRACTED PROVENANCE & TYPE:');
    console.log('  Title:', result.title);
    console.log('  Detected Type:', result.detected_type);
    console.log('  Confidence:', result.confidence);
    console.log('  Missing Fields:', result.missing_fields);
    console.log('\nEXTRACTED SECTIONS:');
    Object.keys(result.sections || {}).forEach(secKey => {
      console.log(`\n  --- SECTION [${secKey}] ---`);
      console.log(JSON.stringify(result.sections[secKey], null, 2));
    });
  } catch(e) {
    console.error('Error running parser:', e);
  }
}
test();
