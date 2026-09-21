'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Trash2, Clock, MapPin, Sparkles, Building2, 
  Send, Calendar, User, Phone, Mail, CheckCircle2, Search,
  Compass, RotateCcw, ArrowRight, ArrowLeft, Sliders, Eye
} from 'lucide-react';

interface TimelineItem {
  id: string;
  service_id?: string;
  day_number: number;
  time: string; // HH:MM
  end_time?: string;
  business_id: string;
  business_name: string;
  parent_type_id: string;
  parent_type_name: string;
  child_type_name: string;
  notes?: string;
  duration_minutes?: number;
  is_custom_manual?: boolean;
}

interface ItineraryDay {
  day: number;
  items: TimelineItem[];
}

interface AdvancedJourneyPackage {
  name: string;
  description: string;
  duration_days: number;
  vibe: string;
  pace: string;
  price_usd?: number;
  itinerary: ItineraryDay[];
}

interface Business {
  id: string;
  service_id?: string;
  name: string;
  business_name?: string;
  type_id: string;
  type_name?: string;
  parent_type_id?: string;
  parent_type_name?: string;
  type_icon?: string;
  type_icon_color?: string;
}

interface ExistingTourProduct {
  id: string;
  name: string;
  catalog_cat_id: string;
  duration_days: number;
  base_price_usd: number;
  description: string;
}

const CURATED_JOURNEY_PRESETS: Record<string, {
  name: string;
  badge: string;
  tagline: string;
  description: string;
  duration_days: number;
  vibe: string;
  pace: string;
  price_usd: number;
  days: {
    day: number;
    items: Array<{
      time: string;
      end_time: string;
      duration_minutes: number;
      business_name: string;
      parent_type_id: string;
      parent_type_name: string;
      child_type_name: string;
      notes: string;
    }>;
  }[];
}> = {
  'artisan & crafts experience': {
    name: 'Artisan & Crafts Experience',
    badge: 'Artisanal & Heritage',
    tagline: 'Centuries of Berber Craftsmanship & Guild Traditions',
    description: 'Immerse yourself in authentic Siwan mastercrafts: traditional silver jewelry, geometric embroidery, hand-carved salt crystal sculpting, date palm weaving, and ancient terracotta kiln pottery.',
    duration_days: 3,
    vibe: 'cultural',
    pace: 'moderate',
    price_usd: 320,
    days: [
      {
        day: 1,
        items: [
          {
            time: '09:30',
            end_time: '12:00',
            duration_minutes: 150,
            business_name: 'Siwan Silver Jewelry & Talisman Guild',
            parent_type_id: 'crafts',
            parent_type_name: 'HANDICRAFTS',
            child_type_name: 'Silver Jewelry Masterclass',
            notes: 'Hands-on silversmithing session learning ancient Berber geometric engraving and wedding jewelry motifs.'
          },
          {
            time: '13:00',
            end_time: '14:30',
            duration_minutes: 90,
            business_name: 'Oasis Garden Traditional Dining',
            parent_type_id: 'food',
            parent_type_name: 'DINING',
            child_type_name: 'Siwan Organic Lunch',
            notes: 'Wood-fired tagine and date salad under the shade of mature olive and palm trees.'
          },
          {
            time: '15:30',
            end_time: '18:00',
            duration_minutes: 150,
            business_name: 'Siwa Women Embroidery & Textile Guild',
            parent_type_id: 'crafts',
            parent_type_name: 'HANDICRAFTS',
            child_type_name: 'Silk & Cotton Embroidery',
            notes: 'Learn the sacred five-color sunburst embroidery technique crafted on traditional linen shawls.'
          }
        ]
      },
      {
        day: 2,
        items: [
          {
            time: '09:00',
            end_time: '11:30',
            duration_minutes: 150,
            business_name: 'Siwa Salt Crystal Art & Lamp Studio',
            parent_type_id: 'crafts',
            parent_type_name: 'WELLNESS & CRAFTS',
            child_type_name: 'Salt Stone Carving',
            notes: 'Carve natural salt rock lamps and artisanal meditation stones harvested from hyper-saline lakes.'
          },
          {
            time: '12:30',
            end_time: '15:00',
            duration_minutes: 150,
            business_name: 'Palm Grove Basketry & Weaving Workshop',
            parent_type_id: 'crafts',
            parent_type_name: 'HANDICRAFTS',
            child_type_name: 'Date Palm Leaf Weaving',
            notes: 'Master the traditional craft of weaving date palm fronds into durable baskets and desert mats.'
          },
          {
            time: '16:30',
            end_time: '19:00',
            duration_minutes: 150,
            business_name: 'Old Shali Fortress Mudbrick Guild Walk',
            parent_type_id: 'cultural',
            parent_type_name: 'HERITAGE',
            child_type_name: 'Kershef Masonry Masterclass',
            notes: 'Guided exploration of medieval salt-and-clay Kershef architecture and heritage preservation.'
          }
        ]
      },
      {
        day: 3,
        items: [
          {
            time: '09:00',
            end_time: '12:00',
            duration_minutes: 180,
            business_name: 'Ancient Oasis Clay & Terracotta Kiln Studio',
            parent_type_id: 'crafts',
            parent_type_name: 'HANDICRAFTS',
            child_type_name: 'Clay Pottery Workshop',
            notes: 'Shape raw oasis clay pots and water jugs using age-old hand-turning and open-flame kiln firing.'
          },
          {
            time: '13:30',
            end_time: '15:30',
            duration_minutes: 120,
            business_name: 'Heritage Olive Press & Natural Soap House',
            parent_type_id: 'production',
            parent_type_name: 'TRADE & PRODUCTION',
            child_type_name: 'Olive Soap & Oil Crafting',
            notes: 'Discover cold-press olive oil extraction and artisanal herb-infused olive oil soap making.'
          },
          {
            time: '17:00',
            end_time: '19:30',
            duration_minutes: 150,
            business_name: 'Sunset Bedouin Camp & Artisan Souk',
            parent_type_id: 'food',
            parent_type_name: 'EVENING EXPERIENCES',
            child_type_name: 'Desert Tea & Artisan Exchange',
            notes: 'Relax around campfire with lemongrass Bedouin tea and private showcase of rare heritage crafts.'
          }
        ]
      }
    ]
  },
  'desert safari & great sand sea': {
    name: 'Great Sand Sea & Desert Safari Expedition',
    badge: '4x4 Dunes & Safari',
    tagline: 'Endless Golden Dunes, Thermal Springs & Starlit Camps',
    description: 'Thrilling 4x4 dune navigation, sunset sandboarding, Bir Wahed natural sulfur springs, cold lake swimming, and deep desert astronomy under the Milky Way.',
    duration_days: 3,
    vibe: 'adventure',
    pace: 'fast',
    price_usd: 390,
    days: [
      {
        day: 1,
        items: [
          {
            time: '09:00',
            end_time: '13:00',
            duration_minutes: 240,
            business_name: '4x4 Great Sand Sea Dune Bashing Safari',
            parent_type_id: 'transportation',
            parent_type_name: '4X4 SAFARI',
            child_type_name: 'Deep Desert Expedition',
            notes: 'Traverse massive rolling sand dunes with licensed desert drivers in customized 4x4 Land Cruisers.'
          },
          {
            time: '15:00',
            end_time: '19:00',
            duration_minutes: 240,
            business_name: 'Bir Wahed Hot Spring & Sandboarding',
            parent_type_id: 'wellness',
            parent_type_name: 'SPRINGS & ADVENTURE',
            child_type_name: 'Thermal Bath & Sunset Dunes',
            notes: 'Soak in the natural sulfur spring surrounded by dunes, followed by sandboarding at golden hour.'
          }
        ]
      },
      {
        day: 2,
        items: [
          {
            time: '09:30',
            end_time: '13:30',
            duration_minutes: 240,
            business_name: 'Fossil Valley & Prehistoric Whale Remains',
            parent_type_id: 'cultural',
            parent_type_name: 'NATURE & HISTORY',
            child_type_name: 'Geological Desert Trek',
            notes: 'Explore million-year-old petrified coral reefs and prehistoric sea fossils embedded in desert stone.'
          },
          {
            time: '16:00',
            end_time: '21:00',
            duration_minutes: 300,
            business_name: 'Stargazing Camp & Bedouin Feast',
            parent_type_id: 'food',
            parent_type_name: 'CAMP EXPERIENCE',
            child_type_name: 'Starlit Campfire Feast',
            notes: 'Midnight telescope astronomy, traditional underground lamb cooking (Mandi), and desert storytelling.'
          }
        ]
      },
      {
        day: 3,
        items: [
          {
            time: '08:30',
            end_time: '12:00',
            duration_minutes: 210,
            business_name: 'Siwa Salt Crystal Lake Flotation',
            parent_type_id: 'wellness',
            parent_type_name: 'NATURAL WONDERS',
            child_type_name: 'Emerald Salt Lake Swim',
            notes: 'Weightless floating in turquoise salt lakes with 95% mineral purity.'
          },
          {
            time: '14:00',
            end_time: '17:00',
            duration_minutes: 180,
            business_name: 'Fatnas Island Sunset Palm Grove Walk',
            parent_type_id: 'nature',
            parent_type_name: 'RELAXATION',
            child_type_name: 'Lake Birket Siwa Sunset',
            notes: 'Fresh date juice and panoramic views of Lake Siwa backed by desert mountains.'
          }
        ]
      }
    ]
  },
  'wellness & salt lake healing retreat': {
    name: 'Siwa Salt Lake & Thermal Healing Retreat',
    badge: 'Rejuvenation & Springs',
    tagline: 'Mineral Flotation, Thermal Springs & Sand Therapy',
    description: 'Rejuvenating thermal spring hydrotherapy, buoyant salt lake flotation, therapeutic sand baths, and organic herbal wellness in serene desert settings.',
    duration_days: 3,
    vibe: 'wellness',
    pace: 'relaxed',
    price_usd: 350,
    days: [
      {
        day: 1,
        items: [
          {
            time: '09:00',
            end_time: '12:00',
            duration_minutes: 180,
            business_name: 'Hyper-Saline Lake Flotation Therapy',
            parent_type_id: 'wellness',
            parent_type_name: 'HYDROTHERAPY',
            child_type_name: 'Salt Water Therapy',
            notes: 'Therapeutic floating for deep muscle relaxation and respiratory health.'
          },
          {
            time: '14:00',
            end_time: '17:00',
            duration_minutes: 180,
            business_name: 'Cleopatra Natural Spring Bath',
            parent_type_id: 'wellness',
            parent_type_name: 'NATURAL SPRINGS',
            child_type_name: 'Freshwater Spring Soak',
            notes: 'Rinse off in crystal clear freshwater spring shaded by date palms.'
          }
        ]
      },
      {
        day: 2,
        items: [
          {
            time: '09:30',
            end_time: '12:30',
            duration_minutes: 180,
            business_name: 'Gebel Dakrour Hot Sand Therapy',
            parent_type_id: 'wellness',
            parent_type_name: 'ANCIENT HEALING',
            child_type_name: 'Therapeutic Sand Bath',
            notes: 'Traditional Siwan heat treatment renowned for joint rejuvenation and circulation.'
          },
          {
            time: '15:30',
            end_time: '18:30',
            duration_minutes: 180,
            business_name: 'Desert Salt Cave Halo-Therapy & Meditation',
            parent_type_id: 'wellness',
            parent_type_name: 'SALT CAVES',
            child_type_name: 'Salt Cave Meditation',
            notes: 'Negative ion respiratory session inside a carved underground salt chamber.'
          }
        ]
      },
      {
        day: 3,
        items: [
          {
            time: '09:00',
            end_time: '12:00',
            duration_minutes: 180,
            business_name: 'Organic Herbal Medicine & Essential Oils Garden',
            parent_type_id: 'wellness',
            parent_type_name: 'HERBALISM',
            child_type_name: 'Herbal Consultation',
            notes: 'Tour of native Siwan medicinal herbs, olive leaf extracts, and essential oils.'
          },
          {
            time: '14:30',
            end_time: '18:00',
            duration_minutes: 210,
            business_name: 'Thermal Sulfur Spring & Sunset Sound Healing',
            parent_type_id: 'wellness',
            parent_type_name: 'SOUND & SPRINGS',
            child_type_name: 'Sunset Sound Journey',
            notes: 'Relaxing sound bath ceremony under palm trees as the sun sets over the oasis.'
          }
        ]
      }
    ]
  }
};

export default function AdvancedJourneyBuilder() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get('preset') || searchParams.get('template') || searchParams.get('tour') || '';

  const [step, setStep] = useState(1); // 1: Setup/Template, 2: Timeline Builder, 3: Review & Submit
  const [loadedPresetKey, setLoadedPresetKey] = useState<string | null>(null);

  const [packageInfo, setPackageInfo] = useState<AdvancedJourneyPackage>({
    name: '',
    description: '',
    duration_days: 3,
    vibe: 'cultural',
    pace: 'moderate',
    itinerary: Array.from({ length: 3 }, (_, i) => ({
      day: i + 1,
      items: [],
    })),
  });

  // Visitor Info
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [arrivalDate, setArrivalDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Timeline inputs
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState('09:30');
  const [selectedEndTime, setSelectedEndTime] = useState('12:00');
  const [businessDuration, setBusinessDuration] = useState(150);
  const [businessNotes, setBusinessNotes] = useState('');

  // Mode for adding activity: 'db_vendor' | 'admin_curated' | 'custom_manual'
  const [inputMode, setInputMode] = useState<'db_vendor' | 'admin_curated' | 'custom_manual'>('db_vendor');

  // Manual custom activity fields
  const [customActivityName, setCustomActivityName] = useState('');
  const [customCategory, setCustomCategory] = useState('visit');

  // DB & Agency Data
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [agencyTours, setAgencyTours] = useState<ExistingTourProduct[]>([]);
  const [bizSearch, setBizSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Admin preset suggestions
  const adminPresets = [
    { title: 'Siwan Silver Jewelry & Talisman Guild', parent: 'crafts', type: 'Silver Workshop' },
    { title: 'Siwa Salt Crystal Art & Lamp Studio', parent: 'crafts', type: 'Salt Carving' },
    { title: 'Date Palm Leaf Weaving & Basketry', parent: 'crafts', type: 'Handicrafts' },
    { title: 'Ancient Clay Pottery Kiln Session', parent: 'crafts', type: 'Pottery Studio' },
    { title: 'Heritage Olive Press & Natural Soap House', parent: 'production', type: 'Soap Crafting' },
    { title: 'Cleopatra Spring Bath & Palm Grove Walk', parent: 'wellness', type: 'Freshwater Spring' },
    { title: '4x4 Great Sand Sea Dune Bashing & Sandboarding', parent: 'transportation', type: 'Desert Safari' },
    { title: 'Hyper-Saline Salt Lake Flotation', parent: 'wellness', type: 'Salt Lake Float' },
    { title: 'Stargazing Camp & Traditional Bedouin Dinner', parent: 'food', type: 'Campfire Feast' },
  ];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const appliedPresetRef = useRef(false);

  const applyCuratedPreset = (presetKey: string) => {
    const preset = CURATED_JOURNEY_PRESETS[presetKey.toLowerCase()];
    if (!preset) return false;

    const days = preset.duration_days;
    const newItinerary: ItineraryDay[] = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      items: [],
    }));

    preset.days.forEach((d) => {
      if (newItinerary[d.day - 1]) {
        newItinerary[d.day - 1].items = d.items.map((item, idx) => ({
          id: `preset_stop_${d.day}_${idx}_${Date.now()}`,
          day_number: d.day,
          time: item.time,
          end_time: item.end_time,
          business_id: `preset_${idx}`,
          business_name: item.business_name,
          parent_type_id: item.parent_type_id,
          parent_type_name: item.parent_type_name,
          child_type_name: item.child_type_name,
          notes: item.notes,
          duration_minutes: item.duration_minutes,
          is_custom_manual: false,
        }));
      }
    });

    setPackageInfo({
      name: preset.name,
      description: preset.description,
      duration_days: days,
      vibe: preset.vibe,
      pace: preset.pace,
      price_usd: preset.price_usd,
      itinerary: newItinerary,
    });
    setLoadedPresetKey(presetKey);
    setSelectedDay(1);
    setStep(2); // Jump straight into the interactive timeline
    return true;
  };

  // 1. Fetch live businesses and live agency tours on load
  useEffect(() => {
    fetch('/api/jana/tour-builder?action=businesses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllBusinesses(data);
          setFilteredBusinesses(data);
        }
      })
      .catch(err => console.error('Failed to load businesses:', err));

    fetch('/api/jana/tour-builder?action=list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAgencyTours(data);
        }
      })
      .catch(err => console.error('Failed to load tours:', err));
  }, []);

  // 2. Preset query resolution
  useEffect(() => {
    if (!presetParam || appliedPresetRef.current) return;

    const normalized = presetParam.trim().toLowerCase();
    
    // Check in curated library
    const matchedCuratedKey = Object.keys(CURATED_JOURNEY_PRESETS).find(
      k => k === normalized || normalized.includes(k) || k.includes(normalized)
    );

    if (matchedCuratedKey) {
      applyCuratedPreset(matchedCuratedKey);
      appliedPresetRef.current = true;
      return;
    }

    // Check in agency tours
    if (agencyTours.length > 0) {
      const tour = agencyTours.find(t => t.name.toLowerCase().includes(normalized) || normalized.includes(t.name.toLowerCase()));
      if (tour) {
        handleLoadAgencyTour(tour.id);
        setLoadedPresetKey(tour.name);
        setStep(2);
        appliedPresetRef.current = true;
      }
    }
  }, [presetParam, agencyTours]);

  // Search filter for businesses
  useEffect(() => {
    if (!bizSearch.trim()) {
      setFilteredBusinesses(allBusinesses);
    } else {
      const q = bizSearch.toLowerCase();
      setFilteredBusinesses(
        allBusinesses.filter(b => 
          b.name.toLowerCase().includes(q) || 
          (b.type_name && b.type_name.toLowerCase().includes(q))
        )
      );
    }
  }, [bizSearch, allBusinesses]);

  // Clone template from agency package
  const handleLoadAgencyTour = async (tourId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/tour-builder?action=get&id=${tourId}`);
      const data = await res.json();
      if (data && data.name) {
        const days = data.duration_days || 3;
        const newItinerary: ItineraryDay[] = Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          items: []
        }));

        if (Array.isArray(data.stops)) {
          data.stops.forEach((stop: any) => {
            const d = stop.day_number || 1;
            if (newItinerary[d - 1]) {
              newItinerary[d - 1].items.push({
                id: `stop_${Date.now()}_${Math.random()}`,
                day_number: d,
                time: (stop.start_time || '09:00').slice(0, 5),
                end_time: (stop.end_time || '11:00').slice(0, 5),
                business_id: stop.business_id,
                business_name: stop.business_name || 'Tour Stop',
                parent_type_id: stop.parent_type_id || 'tour',
                parent_type_name: stop.stop_role || 'Activity',
                child_type_name: stop.type_name || stop.stop_role || 'Stop',
                notes: stop.notes || '',
                duration_minutes: stop.duration_hours ? stop.duration_hours * 60 : 120,
              });
            }
          });
        }

        setPackageInfo({
          name: `${data.name}`,
          description: data.description || '',
          duration_days: days,
          vibe: 'cultural',
          pace: 'moderate',
          price_usd: data.base_price_usd ? parseFloat(data.base_price_usd) : undefined,
          itinerary: newItinerary,
        });
        setLoadedPresetKey(data.name);
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to clone tour:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Item
  const handleAddItem = (
    bId: string, 
    bName: string, 
    pType: string, 
    cType: string, 
    isManual = false,
    serviceId?: string
  ) => {
    if (!selectedTime) {
      alert('Please select a start time');
      return;
    }

    const newItem: TimelineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      service_id: serviceId,
      day_number: selectedDay,
      time: selectedTime,
      end_time: selectedEndTime,
      business_id: bId,
      business_name: bName,
      parent_type_id: pType,
      parent_type_name: pType.toUpperCase(),
      child_type_name: cType,
      notes: businessNotes,
      duration_minutes: businessDuration,
      is_custom_manual: isManual,
    };

    const updatedItinerary = packageInfo.itinerary.map((day) =>
      day.day === selectedDay
        ? { ...day, items: [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time)) }
        : day
    );

    setPackageInfo({ ...packageInfo, itinerary: updatedItinerary });
    setSelectedBusiness(null);
    setCustomActivityName('');
    setBusinessNotes('');
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItinerary = packageInfo.itinerary.map((day) => ({
      ...day,
      items: day.items.filter((item) => item.id !== itemId),
    }));
    setPackageInfo({ ...packageInfo, itinerary: updatedItinerary });
  };

  const handleChangeDays = (days: number) => {
    const newItinerary = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      items: packageInfo.itinerary[i]?.items || [],
    }));
    setPackageInfo({ ...packageInfo, duration_days: days, itinerary: newItinerary });
    if (selectedDay > days) setSelectedDay(days);
  };

  // Submit to both Vendor Marketplace and Custom Journey Packages
  const handleSavePackage = async () => {
    if (!packageInfo.name.trim()) {
      alert('Please enter a journey name');
      return;
    }
    if (!visitorName || !visitorPhone) {
      alert('Please enter your Name and Contact Phone / WhatsApp');
      return;
    }

    const totalItems = packageInfo.itinerary.reduce((sum, day) => sum + day.items.length, 0);
    if (totalItems === 0) {
      alert('Please add at least one stop or activity to your itinerary');
      return;
    }

    setLoading(true);
    try {
      const allItems = packageInfo.itinerary.flatMap((day) => day.items);
      
      const journeyRes = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: visitorName,
          customer_phone: visitorPhone,
          customer_email: visitorEmail,
          request_type: 'journey',
          vibe: packageInfo.vibe,
          duration: `${packageInfo.duration_days} Days`,
          pace: packageInfo.pace,
          budget: packageInfo.price_usd ? `$${packageInfo.price_usd}` : 'Flexible',
          group_size: groupSize,
          arrival_date: arrivalDate || null,
          special_requests: specialRequests,
          itinerary_name: packageInfo.name,
          itinerary_summary: `${packageInfo.duration_days}-day itinerary with ${totalItems} scheduled activities across Siwa.`,
          custom_details: {
            package_info: packageInfo,
            timeline_items: allItems,
          },
        }),
      });

      if (journeyRes.ok) {
        setSuccess(true);
      } else {
        const data = await journeyRes.json();
        alert('Error creating inquiry: ' + (data.error || 'Server error'));
      }
    } catch (error: any) {
      alert('Error submitting inquiry: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToCustomBlank = () => {
    setPackageInfo({
      name: '',
      description: '',
      duration_days: 3,
      vibe: 'cultural',
      pace: 'moderate',
      itinerary: Array.from({ length: 3 }, (_, i) => ({
        day: i + 1,
        items: [],
      })),
    });
    setLoadedPresetKey(null);
    setSelectedDay(1);
    setStep(1);
  };

  const totalStopsCount = packageInfo.itinerary.reduce((sum, d) => sum + d.items.length, 0);
  const currentDayItems = packageInfo.itinerary[selectedDay - 1]?.items || [];

  return (
    <div className="w-full max-w-6xl mx-auto font-sans text-zinc-100">
      
      {/* ── Top Sleek Header & Step Navigation ── */}
      <div className="mb-8 border-b border-white/[0.08] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#D4AF37] uppercase mb-2">
            <span>EXPEDITION ARCHITECT</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">SIWA OASIS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-white">
            Custom Itinerary <span className="font-semibold text-[#D4AF37]">Studio</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
            Craft an authentic multi-day journey with exact timings, verified local artisans, and direct tour operator dispatch.
          </p>
        </div>

        {/* Minimalist Monochromatic Step Pill Indicator */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs">
          {[
            { num: 1, label: 'Overview' },
            { num: 2, label: 'Timeline' },
            { num: 3, label: 'Dispatch' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.num
                  ? 'bg-[#D4AF37] text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              0{s.num} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Preset Bar (Clean & Monochromatic) ── */}
      {loadedPresetKey && !success && (
        <div className="mb-8 p-4 sm:p-5 bg-[#121824]/60 border border-white/[0.08] rounded-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-4 ring-[#D4AF37]/20" />
            <div>
              <div className="text-[10px] font-semibold tracking-widest text-[#D4AF37] uppercase">
                Active Curated Preset
              </div>
              <div className="text-sm sm:text-base font-medium text-white flex items-center gap-2 mt-0.5">
                <span>{packageInfo.name || loadedPresetKey}</span>
                <span className="text-xs text-zinc-400 font-normal">
                  — {packageInfo.duration_days} Days · {totalStopsCount} Scheduled Stops
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Edit Daily Timeline</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-medium rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Trip Overview</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToCustomBlank}
              className="px-3 py-2 bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset Blank</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Success Confirmation Screen ── */}
      {success ? (
        <div className="p-10 md:p-16 bg-[#121824]/80 border border-white/[0.08] rounded-2xl text-center flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-5">
            <CheckCircle2 size={32} />
          </div>
          <div className="text-[11px] font-semibold tracking-widest text-[#D4AF37] uppercase mb-2">
            Inquiry Dispatched
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-3 tracking-tight">
            Itinerary Transmitted to Specialists
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md mb-8">
            Thank you, <strong className="text-white font-medium">{visitorName}</strong>. Your customized {packageInfo.duration_days}-day Siwa itinerary has been transmitted to licensed tour operators. You will receive quotes and confirmation via WhatsApp/Phone at <span className="text-zinc-200 font-medium">{visitorPhone}</span>.
          </p>
          <button
            onClick={() => { setSuccess(false); handleResetToCustomBlank(); }}
            className="px-6 py-2.5 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg text-xs hover:brightness-110 transition-all shadow-sm"
          >
            Create Another Itinerary
          </button>
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: ITINERARY OVERVIEW & CURATED PRESET SELECTION                     */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Curated Presets Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
                    Curated Signature Expeditions
                  </span>
                  <span className="text-[11px] text-zinc-500">1-Click Multi-Day Templates</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                    const isCurrent = loadedPresetKey?.toLowerCase() === key;
                    const totalStops = preset.days.reduce((sum, d) => sum + d.items.length, 0);
                    return (
                      <div
                        key={key}
                        onClick={() => applyCuratedPreset(key)}
                        className={`p-5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between group ${
                          isCurrent
                            ? 'bg-[#121824] border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]'
                            : 'bg-[#121824]/40 hover:bg-[#121824]/80 border-white/[0.08] hover:border-zinc-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20">
                              {preset.badge}
                            </span>
                            <span className="text-xs font-semibold text-zinc-300">
                              ${preset.price_usd} <span className="text-[10px] font-normal text-zinc-500">/ person</span>
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-medium text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                            {preset.name}
                          </h4>

                          <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed font-normal">
                            {preset.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span>{preset.duration_days} Days</span>
                            <span className="text-zinc-600">•</span>
                            <span>{totalStops} Stops</span>
                          </div>
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${isCurrent ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'}`}>
                            {isCurrent ? 'Active Preset' : 'Select Plan →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operator Packages Option */}
              {agencyTours.length > 0 && (
                <div className="p-5 bg-[#121824]/30 border border-white/[0.06] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">
                      Tour Operator Packages
                    </span>
                    <span className="text-[11px] text-zinc-500">{agencyTours.length} verified packages</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {agencyTours.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleLoadAgencyTour(t.id)}
                        className="p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-zinc-500 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="text-xs font-medium text-zinc-200 group-hover:text-[#D4AF37] truncate">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
                            {t.description || 'Pre-designed operator schedule'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04] text-[11px] text-zinc-400">
                          <span>{t.duration_days} Days</span>
                          <span className="text-zinc-200 font-medium">
                            {t.base_price_usd ? `$${t.base_price_usd}` : 'Quote'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Itinerary Metadata Form */}
              <div className="p-6 bg-[#121824]/40 border border-white/[0.08] rounded-xl space-y-6">
                <div className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
                  Itinerary Parameters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Journey Name *
                    </label>
                    <input
                      type="text"
                      value={packageInfo.name}
                      onChange={(e) => setPackageInfo({ ...packageInfo, name: e.target.value })}
                      placeholder="e.g. Siwa Artisan & Desert Exploration"
                      className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-white/[0.1] rounded-lg text-white placeholder-zinc-600 focus:border-[#D4AF37] focus:outline-none text-xs font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Experience Focus
                    </label>
                    <select
                      value={packageInfo.vibe}
                      onChange={(e) => setPackageInfo({ ...packageInfo, vibe: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-white/[0.1] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none text-xs font-normal"
                    >
                      <option value="cultural">Artisanal Craft & Cultural Heritage</option>
                      <option value="adventure">Desert Safari & 4x4 Great Sand Sea</option>
                      <option value="wellness">Healing, Salt Lakes & Thermal Springs</option>
                      <option value="culinary">Gastronomy, Olive Groves & Date Harvest</option>
                      <option value="slow-paced">Quiet Retreat & Stargazing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Trip Vision / Special Preferences
                  </label>
                  <textarea
                    value={packageInfo.description}
                    onChange={(e) => setPackageInfo({ ...packageInfo, description: e.target.value })}
                    placeholder="Describe your goals, desired pace, special interests, or must-see locations..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-white/[0.1] rounded-lg text-white placeholder-zinc-600 focus:border-[#D4AF37] focus:outline-none text-xs font-normal"
                  />
                </div>

                {/* Duration & Pace */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/[0.04]">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Duration: <span className="text-white font-semibold">{packageInfo.duration_days} Days</span>
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleChangeDays(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            packageInfo.duration_days === d
                              ? 'bg-[#D4AF37] text-zinc-950 font-semibold shadow-sm'
                              : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {d} {d === 1 ? 'Day' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Pace: <span className="text-white font-semibold capitalize">{packageInfo.pace}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['relaxed', 'moderate', 'active'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPackageInfo({ ...packageInfo, pace: p })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                            packageInfo.pace === p
                              ? 'bg-white/[0.08] border-[#D4AF37] text-[#D4AF37]'
                              : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!packageInfo.name) {
                      alert('Please provide a name for your journey.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 py-3 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg text-xs hover:brightness-110 transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Proceed to Daily Timeline</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: TIMELINE BUILDER (MINIMALIST & CLEAN)                             */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Presets Switcher Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-zinc-500 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Switch Plan:
                </span>
                {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                  const isCurrent = loadedPresetKey?.toLowerCase() === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyCuratedPreset(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                        isCurrent
                          ? 'bg-[#D4AF37] text-zinc-950 border-[#D4AF37] font-semibold'
                          : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:border-zinc-500'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08]">
                {packageInfo.itinerary.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedDay === d.day
                        ? 'bg-white/[0.1] text-white border border-[#D4AF37]'
                        : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>Day 0{d.day}</span>
                    <span className="px-1.5 py-0.2 bg-white/[0.08] rounded text-[10px] text-zinc-400 font-mono">
                      {d.items.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Grid: Timeline Stream (7 cols) + Add Activity Card (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Daily Timeline List (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <Calendar size={14} className="text-[#D4AF37]" />
                      <span>Day 0{selectedDay} Scheduled Itinerary</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {currentDayItems.length} activities
                    </span>
                  </div>

                  {currentDayItems.length === 0 ? (
                    <div className="p-8 border border-dashed border-white/[0.08] rounded-xl text-center text-zinc-500 text-xs">
                      No stops scheduled for Day 0{selectedDay}.<br />
                      Use the activity selector on the right to add visits, meals, or experiences.
                    </div>
                  ) : (
                    <div className="space-y-2.5 relative before:absolute before:left-[35px] before:top-4 before:bottom-4 before:w-[1px] before:bg-white/[0.06]">
                      {currentDayItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-[#121824]/50 border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all flex items-start justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Time Badge */}
                            <div className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded text-zinc-200 font-mono text-[11px] whitespace-nowrap text-center">
                              {item.time}
                            </div>

                            <div>
                              <div className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
                                <span>{item.business_name}</span>
                                {item.is_custom_manual && (
                                  <span className="px-1.5 py-0.2 bg-white/[0.06] text-zinc-400 text-[10px] rounded border border-white/[0.06]">
                                    Custom
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                <span>{item.child_type_name}</span>
                                <span className="text-zinc-600">•</span>
                                <span>
                                  {Math.floor(item.duration_minutes! / 60)}h {item.duration_minutes! % 60 > 0 && `${item.duration_minutes! % 60}m`}
                                </span>
                              </div>

                              {item.notes && (
                                <div className="text-[11px] text-zinc-400 mt-1.5 italic font-normal bg-white/[0.02] p-1.5 rounded border border-white/[0.04]">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-zinc-600 hover:text-red-400 rounded transition-colors"
                            title="Remove Stop"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Form: Add Activity Panel (5 cols) */}
                <div className="lg:col-span-5 bg-[#121824]/60 border border-white/[0.08] rounded-xl p-5 space-y-4 backdrop-blur-md">
                  <div className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
                    Add Activity to Day 0{selectedDay}
                  </div>

                  {/* Mode switcher */}
                  <div className="grid grid-cols-3 gap-1 bg-white/[0.03] p-1 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setInputMode('db_vendor')}
                      className={`py-1.5 rounded text-xs transition-all ${
                        inputMode === 'db_vendor' ? 'bg-white/[0.1] text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('admin_curated')}
                      className={`py-1.5 rounded text-xs transition-all ${
                        inputMode === 'admin_curated' ? 'bg-white/[0.1] text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Curated
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('custom_manual')}
                      className={`py-1.5 rounded text-xs transition-all ${
                        inputMode === 'custom_manual' ? 'bg-white/[0.1] text-white font-semibold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Manual
                    </button>
                  </div>

                  {/* Timings Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs font-mono focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Duration</label>
                      <select
                        value={businessDuration}
                        onChange={(e) => setBusinessDuration(parseInt(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                      >
                        <option value={30}>30 mins</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={150}>2.5 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours (Half Day)</option>
                      </select>
                    </div>
                  </div>

                  {/* MODE 1: PULL FROM DB VENDORS */}
                  {inputMode === 'db_vendor' && (
                    <div className="space-y-2.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={bizSearch}
                          onChange={(e) => setBizSearch(e.target.value)}
                          placeholder="Search directory..."
                          className="w-full pl-3 pr-8 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white placeholder-zinc-600 text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                        <Search size={13} className="absolute right-2.5 top-2.5 text-zinc-600" />
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1 border border-white/[0.06] p-1 rounded-lg">
                        {filteredBusinesses.map((b) => (
                          <div
                            key={b.service_id || b.id}
                            onClick={() => setSelectedBusiness(b)}
                            className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center transition-all ${
                              selectedBusiness?.id === b.id
                                ? 'bg-white/[0.1] text-white font-medium border border-[#D4AF37]'
                                : 'bg-transparent hover:bg-white/[0.03] text-zinc-300'
                            }`}
                          >
                            <span className="truncate">{b.service_id ? `${b.name} · ${b.business_name || 'Service'}` : b.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{b.type_name || b.type_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: CURATED PRESETS */}
                  {inputMode === 'admin_curated' && (
                    <div className="space-y-1 max-h-48 overflow-y-auto border border-white/[0.06] p-1 rounded-lg">
                      {adminPresets.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            handleAddItem(
                              `preset_${idx}`,
                              preset.title,
                              preset.parent,
                              preset.type,
                              false
                            );
                          }}
                          className="p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] rounded cursor-pointer transition-all flex items-center justify-between text-xs text-zinc-200"
                        >
                          <span className="truncate">{preset.title}</span>
                          <Plus size={13} className="text-[#D4AF37] flex-shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE 3: CUSTOM MANUAL ENTRY */}
                  {inputMode === 'custom_manual' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                          Custom Activity Name
                        </label>
                        <input
                          type="text"
                          value={customActivityName}
                          onChange={(e) => setCustomActivityName(e.target.value)}
                          placeholder="e.g. Private sunset photography at Lake Siwa"
                          className="w-full px-3 py-1.5 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                          Category
                        </label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                        >
                          <option value="visit">Visit / Tour Site</option>
                          <option value="stay">Accommodation / Camp</option>
                          <option value="eat">Dining / Cafe</option>
                          <option value="do">Activity / Adventure</option>
                          <option value="travel">Logistics / Transfer</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Specific Wishes / Instructions</label>
                    <input
                      type="text"
                      value={businessNotes}
                      onChange={(e) => setBusinessNotes(e.target.value)}
                      placeholder="e.g. Private guide required"
                      className="w-full px-3 py-1.5 bg-[#0b0f17] border border-white/[0.08] rounded text-white placeholder-zinc-600 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {/* Add action button */}
                  {inputMode !== 'admin_curated' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (inputMode === 'db_vendor') {
                          if (!selectedBusiness) {
                            alert('Please select a business from the directory.');
                            return;
                          }
                          handleAddItem(
                            selectedBusiness.id,
                            selectedBusiness.name,
                            selectedBusiness.parent_type_id || 'service',
                            selectedBusiness.type_name || selectedBusiness.type_id,
                            false,
                            selectedBusiness.service_id
                          );
                        } else if (inputMode === 'custom_manual') {
                          if (!customActivityName.trim()) {
                            alert('Please enter a name for this custom stop.');
                            return;
                          }
                          handleAddItem(
                            `custom_${Date.now()}`,
                            customActivityName,
                            customCategory,
                            'custom_visit',
                            true
                          );
                        }
                      }}
                      className="w-full py-2 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Add to Day 0{selectedDay} Itinerary
                    </button>
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-between pt-6 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 font-medium rounded-lg text-xs border border-white/[0.08] transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Overview &amp; Parameters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg text-xs hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Review &amp; Dispatch</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: REVIEW & DIRECT VENDOR TRANSMISSION                               */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#121824]/40 border border-white/[0.08] rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Itinerary</div>
                  <div className="text-xs sm:text-sm font-medium text-white mt-1 truncate">{packageInfo.name || 'Custom Plan'}</div>
                </div>
                <div className="p-4 bg-[#121824]/40 border border-white/[0.08] rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Duration</div>
                  <div className="text-xs sm:text-sm font-medium text-white mt-1">{packageInfo.duration_days} Days</div>
                </div>
                <div className="p-4 bg-[#121824]/40 border border-white/[0.08] rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Stops</div>
                  <div className="text-xs sm:text-sm font-medium text-white mt-1">{totalStopsCount} Activities</div>
                </div>
                <div className="p-4 bg-[#121824]/40 border border-white/[0.08] rounded-xl">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Estimated Price</div>
                  <div className="text-xs sm:text-sm font-medium text-[#D4AF37] mt-1">
                    {packageInfo.price_usd ? `$${packageInfo.price_usd} / person` : 'Custom Quote'}
                  </div>
                </div>
              </div>

              {/* Day-by-Day Schedule Summary */}
              <div className="p-5 bg-[#121824]/40 border border-white/[0.08] rounded-xl space-y-3">
                <div className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
                  Final Itinerary Overview
                </div>

                <div className="space-y-2.5">
                  {packageInfo.itinerary.map((d) => (
                    <div key={d.day} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                      <div className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                        <span>Day 0{d.day}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">{d.items.length} activities</span>
                      </div>
                      {d.items.length === 0 ? (
                        <div className="text-[11px] text-zinc-500 italic">Free schedule / unassigned</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {d.items.map((item) => (
                            <div key={item.id} className="p-2 bg-white/[0.02] border border-white/[0.04] rounded text-xs flex items-center gap-2">
                              <span className="font-mono text-zinc-400 text-[11px]">{item.time}</span>
                              <span className="text-zinc-200 truncate">{item.business_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitor Contact Input Form */}
              <div className="p-6 bg-[#121824]/60 border border-white/[0.08] rounded-xl space-y-4">
                <div className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase flex items-center gap-2">
                  <User size={14} className="text-[#D4AF37]" />
                  <span>Traveler Information (Transmitted Directly to Tour Specialists)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="eleanor@example.com"
                      className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Expected Travel Date</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Party Size</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Logistics, Dietary, or Accessibility Notes</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Cairo airport transfer required, vegetarian meals"
                    className="w-full px-3 py-2 bg-[#0b0f17] border border-white/[0.08] rounded text-white placeholder-zinc-600 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 font-medium rounded-lg text-xs border border-white/[0.08] transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Edit Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePackage}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#D4AF37] text-zinc-950 font-semibold rounded-lg text-xs hover:brightness-110 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{loading ? 'Transmitting...' : 'Dispatch Inquiry to Operators'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
