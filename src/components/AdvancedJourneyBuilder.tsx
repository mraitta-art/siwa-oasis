'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Trash2, ChevronDown, Clock, MapPin, Sparkles, Building2, 
  Send, Calendar, User, Phone, Mail, CheckCircle2, Search, Edit3,
  Flame, Compass, Heart, History, Utensils, RotateCcw
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
  icon: string;
  description: string;
  duration_days: number;
  vibe: string;
  pace: string;
  price_usd?: number;
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
    icon: '🧵',
    description: 'Immerse yourself in authentic Siwan craftsmanship: traditional silver jewelry, fine embroidery, hand-carved salt crystal sculpting, date palm weaving, and ancient terracotta pottery.',
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
            child_type_name: 'Silver Jewelry Workshop',
            notes: 'Hands-on silversmithing session learning ancient Berber geometric engraving and wedding jewelry motifs.'
          },
          {
            time: '13:00',
            end_time: '14:30',
            duration_minutes: 90,
            business_name: 'Oasis Garden Traditional Restaurant',
            parent_type_id: 'food',
            parent_type_name: 'DINING',
            child_type_name: 'Siwan Organic Lunch',
            notes: 'Wood-fired tagine and date salad under the shade of mature olive and palm trees.'
          },
          {
            time: '15:30',
            end_time: '18:00',
            duration_minutes: 150,
            business_name: 'Siwa Women Embroidery & Textile Cooperative',
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
    icon: '🐪',
    description: 'Thrilling 4x4 dune bashing, sunset sandboarding, Bir Wahed thermal hot springs, cold lake swimming, and deep desert camping under the stars.',
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
            business_name: 'Stargazing Camp & Bedouin Dinner',
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
    icon: '🧂',
    description: 'Rejuvenating thermal spring hydrotherapy, buoyant salt lake flotation, therapeutic sand baths, and organic herbal wellness.',
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
    vibe: 'adventure',
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
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('11:00');
  const [businessDuration, setBusinessDuration] = useState(120);
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
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);

  // Admin preset suggestions
  const adminPresets = [
    { title: 'Visit Organic Olive Mill & Oil Tasting', parent: 'agriculture_industry', type: 'olive_mill' },
    { title: 'Traditional Date Factory Packaging Tour', parent: 'agriculture_industry', type: 'date_factory' },
    { title: 'Cleopatra Spring Bath & Palm Grove Walk', parent: 'wellness', type: 'hot_spring' },
    { title: 'Sunset Sandboarding & 4x4 Great Sand Sea', parent: 'adventure', type: 'safari_4x4' },
    { title: 'Siwan Silver Jewelry & Embroidery Workshop', parent: 'crafts', type: 'embroidery' },
    { title: 'Float in Siwa Salt Crystal Lakes', parent: 'adventure', type: 'salt_lakes' },
    { title: 'Bedouin Candlelight Dinner & Stargazing', parent: 'food', type: 'desert_dining_event' }
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
          name: `Custom ${data.name}`,
          description: data.description || '',
          duration_days: days,
          vibe: 'adventure',
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
    setShowBusinessPicker(false);
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
      
      // 1. Submit to /api/journeys so travel agencies & vendors get it in their portal
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
      vibe: 'adventure',
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

  const currentDayItems = packageInfo.itinerary[selectedDay - 1]?.items || [];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 bg-[#090e17] text-white rounded-2xl shadow-2xl border border-white/10 font-sans">
      {/* Header */}
      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full text-xs font-black tracking-widest uppercase mb-3">
            <Sparkles size={14} /> Tailor-Made Siwa Experiences
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Design Your <span className="text-[#D4AF37]">Custom Tour</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base max-w-2xl">
            Choose from authentic tour operator itineraries, pull verified local businesses, or enter custom stops with exact dates and timings.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10">
          {[
            { num: 1, label: 'Base' },
            { num: 2, label: 'Timeline' },
            { num: 3, label: 'Quote' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-[#D4AF37] text-gray-900 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Preset Banner */}
      {loadedPresetKey && !success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-white/[0.02] border border-[#D4AF37]/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                Active Preset Loaded
              </div>
              <div className="text-base font-bold text-white">
                {packageInfo.name || loadedPresetKey}
                <span className="text-xs font-normal text-gray-300 ml-2">
                  ({packageInfo.duration_days} Days · {packageInfo.itinerary.reduce((sum, d) => sum + d.items.length, 0)} Scheduled Stops)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-[#D4AF37] text-gray-950 text-xs font-black rounded-xl hover:scale-105 transition-all shadow"
              >
                Go to Timeline (Step 2) →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
              >
                ← Edit Tour Info
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToCustomBlank}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset / Blank
            </button>
          </div>
        </div>
      )}

      {success ? (
        <div className="p-10 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl text-center flex flex-col items-center">
          <CheckCircle2 size={64} className="text-[#D4AF37] mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">Itinerary Dispatched to Agencies!</h2>
          <p className="text-gray-300 max-w-md mb-6 text-sm">
            Thank you, <strong className="text-white">{visitorName}</strong>. Your {packageInfo.duration_days}-day customized journey has been transmitted directly to licensed Siwan tour operators and specialists. You will receive quotes and confirmation via WhatsApp/Phone ({visitorPhone}).
          </p>
          <button
            onClick={() => { setSuccess(false); setStep(1); }}
            className="px-6 py-2.5 bg-[#D4AF37] text-gray-950 font-black rounded-xl text-sm hover:scale-105 transition-all"
          >
            Create Another Tour
          </button>
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: BASICS & TEMPLATE CLONING */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Curated Signature Expeditions & Presets */}
              <div className="p-5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[#D4AF37]/30 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                    <Sparkles size={16} /> Curated Signature Expeditions (1-Click Itineraries)
                  </span>
                  <span className="text-xs text-gray-400">Pre-built multi-day schedules</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                    const isCurrent = loadedPresetKey?.toLowerCase() === key;
                    const totalStops = preset.days.reduce((sum, d) => sum + d.items.length, 0);
                    return (
                      <div
                        key={key}
                        onClick={() => applyCuratedPreset(key)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border flex flex-col justify-between group ${
                          isCurrent
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-2xl">{preset.icon}</span>
                            <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-wider">
                              {preset.badge}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                            {preset.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-300">
                            <span>⏱ {preset.duration_days} Days</span>
                            <span>•</span>
                            <span>📍 {totalStops} Stops</span>
                          </div>
                          <span className="text-[#D4AF37] font-black">
                            ${preset.price_usd}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional: Load from Operator Templates */}
              {agencyTours.length > 0 && (
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black tracking-wider text-[#D4AF37] uppercase flex items-center gap-2">
                      <Building2 size={16} /> Or Start from an Existing Tour Operator Package
                    </span>
                    <span className="text-xs text-gray-400">{agencyTours.length} available</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {agencyTours.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleLoadAgencyTour(t.id)}
                        className="p-3.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/40 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-[#D4AF37]">
                            {t.name}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-1 mt-1">
                            {t.description || 'Pre-designed itinerary'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-xs text-gray-400">
                          <span>⏱ {t.duration_days} Days</span>
                          <span className="text-[#D4AF37] font-bold">
                            {t.base_price_usd ? `$${t.base_price_usd}` : 'TBD'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Package Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    Tour Name *
                  </label>
                  <input
                    type="text"
                    value={packageInfo.name}
                    onChange={(e) => setPackageInfo({ ...packageInfo, name: e.target.value })}
                    placeholder="e.g. My Private Desert & Olive Harvest Journey"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    Vibe / Focus
                  </label>
                  <select
                    value={packageInfo.vibe}
                    onChange={(e) => setPackageInfo({ ...packageInfo, vibe: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-white/10 rounded-xl text-white focus:border-[#D4AF37] focus:outline-none text-sm"
                  >
                    <option value="adventure">Desert Adventure & 4x4 Dunes</option>
                    <option value="wellness">Healing, Salt Lakes & Hot Springs</option>
                    <option value="cultural">Cultural Heritage, Ruins & Craft</option>
                    <option value="culinary">Gastronomy, Olive Mills & Date Harvest</option>
                    <option value="slow-paced">Quiet Detox & Stargazing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                  Trip Narrative / Vision
                </label>
                <textarea
                  value={packageInfo.description}
                  onChange={(e) => setPackageInfo({ ...packageInfo, description: e.target.value })}
                  placeholder="What would make this journey unforgettable for you? Special requests, places you dream of seeing..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none text-sm"
                />
              </div>

              {/* Duration and Pace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Duration: <span className="text-[#D4AF37]">{packageInfo.duration_days} Days</span>
                    </label>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleChangeDays(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          packageInfo.duration_days === d
                            ? 'bg-[#D4AF37] text-gray-950 shadow-md'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {d} {d === 1 ? 'Day' : 'Days'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                    Travel Pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['slow', 'moderate', 'active'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPackageInfo({ ...packageInfo, pace: p })}
                        className={`py-2 px-3 rounded-xl text-xs font-black capitalize transition-all border ${
                          packageInfo.pace === p
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!packageInfo.name) {
                      alert('Please provide a name for your tour.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-8 py-3.5 bg-[#D4AF37] text-gray-950 font-black rounded-xl text-sm hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                >
                  Configure Daily Timeline →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: TIMELINE BUILDER WITH TIMINGS & 3 INPUT MODES */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Presets Bar in Step 2 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <Sparkles size={13} className="text-[#D4AF37]" /> Switch Preset:
                </span>
                {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                  const isCurrent = loadedPresetKey?.toLowerCase() === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyCuratedPreset(key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        isCurrent
                          ? 'bg-[#D4AF37] text-gray-950 border-[#D4AF37] shadow-sm'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-[#D4AF37]/50'
                      }`}
                    >
                      {preset.icon} {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Day selector tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
                {packageInfo.itinerary.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedDay === d.day
                        ? 'bg-[#D4AF37] text-gray-950 shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>Day {d.day}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      selectedDay === d.day ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                    }`}>
                      {d.items.length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Daily Timeline List (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar size={18} className="text-[#D4AF37]" /> Day {selectedDay} Schedule
                    </h3>
                    <span className="text-xs text-gray-400">{currentDayItems.length} stops planned</span>
                  </div>

                  {currentDayItems.length === 0 ? (
                    <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 text-sm">
                      No stops scheduled for Day {selectedDay}.<br />
                      Use the builder on the right to add places, visits, or activities.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentDayItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-start justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] font-black text-xs flex flex-col items-center">
                              <Clock size={12} className="mb-0.5" />
                              <span>{item.time}</span>
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                {item.business_name}
                                {item.is_custom_manual && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {item.child_type_name} • {Math.floor(item.duration_minutes! / 60)}h {item.duration_minutes! % 60 > 0 && `${item.duration_minutes! % 60}m`}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-[#D4AF37]/80 mt-1 italic">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Form: 3 Input Modes (5 cols) */}
                <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center justify-between">
                    <span>Add Stop to Day {selectedDay}</span>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInputMode('db_vendor')}
                      className={`py-1.5 rounded-lg transition-all ${
                        inputMode === 'db_vendor' ? 'bg-[#D4AF37] text-gray-950' : 'text-gray-400'
                      }`}
                    >
                      Vendor DB
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('admin_curated')}
                      className={`py-1.5 rounded-lg transition-all ${
                        inputMode === 'admin_curated' ? 'bg-[#D4AF37] text-gray-950' : 'text-gray-400'
                      }`}
                    >
                      Curated
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('custom_manual')}
                      className={`py-1.5 rounded-lg transition-all ${
                        inputMode === 'custom_manual' ? 'bg-[#D4AF37] text-gray-950' : 'text-gray-400'
                      }`}
                    >
                      Self-Typed
                    </button>
                  </div>

                  {/* Timings Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">Duration</label>
                      <select
                        value={businessDuration}
                        onChange={(e) => setBusinessDuration(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                      >
                        <option value={30}>30 mins</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours (Half Day)</option>
                        <option value={360}>6 hours (Full Day)</option>
                      </select>
                    </div>
                  </div>

                  {/* MODE 1: PULL FROM DB VENDORS */}
                  {inputMode === 'db_vendor' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={bizSearch}
                          onChange={(e) => setBizSearch(e.target.value)}
                          placeholder="Search hotel, restaurant, safari..."
                          className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white placeholder-gray-500 text-xs"
                        />
                        <Search size={14} className="absolute right-3 top-2.5 text-gray-500" />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/5 p-1 rounded-xl">
                        {filteredBusinesses.map((b) => (
                          <div
                            key={b.service_id || b.id}
                            onClick={() => setSelectedBusiness(b)}
                            className={`p-2 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-all ${
                              selectedBusiness?.id === b.id
                                ? 'bg-[#D4AF37] text-gray-950 font-bold'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                            }`}
                          >
                            <span>{b.service_id ? `${b.name} · ${b.business_name || 'Vendor service'}` : b.name}</span>
                            <span className="text-[10px] opacity-70 uppercase">{b.type_name || b.type_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: ADMIN POPUP PRESETS */}
                  {inputMode === 'admin_curated' && (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto border border-white/5 p-1 rounded-xl">
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
                          className="p-2.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/5 hover:border-[#D4AF37]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold">{preset.title}</span>
                          <Plus size={14} className="text-[#D4AF37]" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE 3: VISITOR TYPING MANUALLY */}
                  {inputMode === 'custom_manual' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          Custom Place / Visit Name
                        </label>
                        <input
                          type="text"
                          value={customActivityName}
                          onChange={(e) => setCustomActivityName(e.target.value)}
                          placeholder="e.g. Visit my friend's private palm farm"
                          className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          Stop Category
                        </label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
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
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">Specific Wishes / Notes</label>
                    <input
                      type="text"
                      value={businessNotes}
                      onChange={(e) => setBusinessNotes(e.target.value)}
                      placeholder="e.g. Need sunset view or vegetarian food"
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white placeholder-gray-500 text-xs"
                    />
                  </div>

                  {/* Add action button */}
                  {inputMode !== 'admin_curated' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (inputMode === 'db_vendor') {
                          if (!selectedBusiness) {
                            alert('Please select a business from the list.');
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
                      className="w-full py-2.5 bg-[#D4AF37] text-gray-950 font-black rounded-xl text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus size={14} /> Add to Day {selectedDay}
                    </button>
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-between pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-all"
                >
                  ← Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-[#D4AF37] text-gray-950 font-black rounded-xl text-sm hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                >
                  Review & Submit to Agencies →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: REVIEW & DIRECT VENDOR TRANSMISSION */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase font-bold">Package</div>
                  <div className="text-sm font-black text-[#D4AF37] mt-1 truncate">{packageInfo.name}</div>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase font-bold">Duration</div>
                  <div className="text-sm font-black text-white mt-1">{packageInfo.duration_days} Days</div>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase font-bold">Total Stops</div>
                  <div className="text-sm font-black text-[#D4AF37] mt-1">
                    {packageInfo.itinerary.reduce((sum, d) => sum + d.items.length, 0)} Activities
                  </div>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase font-bold">Estimated Cost</div>
                  <div className="text-sm font-black text-white mt-1">
                    {packageInfo.price_usd ? `$${packageInfo.price_usd}` : 'Direct Quote'}
                  </div>
                </div>
              </div>

              {/* Visitor Contact Input (Transmitted to Vendors) */}
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                <h3 className="text-sm font-black tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
                  <User size={16} /> Traveler Information (Transmitted to Travel Operators)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Target Travel Date</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Party / Group Size</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Special Logistics or Dietary Needs</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Vegetarian diet, need pickup from Cairo or Siwa bus station"
                    className="w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              {/* Day-by-day review overview */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-gray-400">Scheduled Itinerary</h3>
                {packageInfo.itinerary.map((d) => (
                  <div key={d.day} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="text-xs font-black text-[#D4AF37] mb-2">DAY {d.day}</div>
                    {d.items.length === 0 ? (
                      <div className="text-xs text-gray-500 italic">Free day / no scheduled stops</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {d.items.map((item) => (
                          <div key={item.id} className="p-2 bg-white/5 rounded-lg text-xs flex items-center gap-2">
                            <span className="font-mono text-[#D4AF37] font-bold">{item.time}</span>
                            <span className="text-white font-semibold truncate">{item.business_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-all"
                >
                  ← Edit Schedule
                </button>

                <button
                  type="button"
                  onClick={handleSavePackage}
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#D4AF37] text-gray-950 font-black rounded-xl text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  {loading ? 'Transmitting to Operators...' : 'Transmit Tour Inquiry to Agencies'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
