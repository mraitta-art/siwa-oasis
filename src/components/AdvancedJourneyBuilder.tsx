'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Trash2, Clock, MapPin, Sparkles, Building2, 
  Send, Calendar, User, Phone, Mail, CheckCircle2, Search,
  Compass, RotateCcw, ArrowRight, ArrowLeft, Sliders, Eye,
  ShieldCheck, Gem, Layers, Info
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

  const [step, setStep] = useState(1); // 1: Blueprint, 2: Daily Timeline, 3: Review & Submit
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
    { title: 'Siwan Silver Jewelry & Talisman Guild', parent: 'crafts', type: 'Silver Masterclass' },
    { title: 'Siwa Salt Crystal Art & Lamp Studio', parent: 'crafts', type: 'Salt Stone Carving' },
    { title: 'Date Palm Leaf Weaving & Basketry Workshop', parent: 'crafts', type: 'Handicrafts Guild' },
    { title: 'Ancient Clay Pottery Kiln Session', parent: 'crafts', type: 'Pottery Masterclass' },
    { title: 'Heritage Olive Press & Natural Soap House', parent: 'production', type: 'Soap Crafting' },
    { title: 'Cleopatra Natural Spring Bath & Palm Grove', parent: 'wellness', type: 'Freshwater Springs' },
    { title: '4x4 Great Sand Sea Dune Bashing & Sandboarding', parent: 'transportation', type: 'Desert Safari' },
    { title: 'Hyper-Saline Salt Lake Flotation Therapy', parent: 'wellness', type: 'Salt Lake Float' },
    { title: 'Stargazing Camp & Traditional Bedouin Feast', parent: 'food', type: 'Campfire Dinner' },
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
    <div className="w-full max-w-6xl mx-auto font-sans text-slate-900">
      
      {/* ── 🌟 CINEMATIC HERO SECTION ── */}
      <div className="relative mb-10 pb-8 border-b border-slate-200/80 overflow-hidden">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-200/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-[0.2em] uppercase shadow-xs">
              <Sparkles size={13} className="text-amber-600" />
              <span>Bespoke Expedition Studio</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Design Your <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent">Custom Tour</span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Curate multi-day schedules with verified Siwan silversmiths, date palm guilds, desert drivers, and eco-lodges. Direct dispatch to licensed local operators.
            </p>
          </div>

          {/* Stepper Pill Nav */}
          <div className="inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            {[
              { num: 1, label: 'Blueprint' },
              { num: 2, label: 'Timeline' },
              { num: 3, label: 'Dispatch' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 ${
                  step === s.num
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#f59e0b] text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="opacity-70 text-[10px]">0{s.num}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ✨ ACTIVE PRESET STATUS BAR ── */}
      {loadedPresetKey && !success && (
        <div className="mb-8 p-5 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border border-amber-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
              <Gem size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-amber-800 uppercase">
                Active Preset Loaded
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{packageInfo.name || loadedPresetKey}</span>
                <span className="text-xs text-slate-500 font-medium">
                  • {packageInfo.duration_days} Days · {totalStopsCount} Curated Stops · ${packageInfo.price_usd || 320} / Person
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#f59e0b] text-slate-950 font-black rounded-xl hover:brightness-105 transition-all shadow-sm flex items-center gap-2"
              >
                <span>Edit Daily Timeline (Step 2)</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Trip Blueprint</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToCustomBlank}
              className="px-3.5 py-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold rounded-xl border border-slate-200 hover:border-red-200 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset Blank</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS CONFIRMATION ── */}
      {success ? (
        <div className="p-12 md:p-16 bg-white border border-emerald-200 rounded-3xl text-center flex flex-col items-center max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <div className="text-[11px] font-black tracking-widest text-emerald-700 uppercase mb-2">
            Itinerary Transmitted
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Direct Dispatch Complete!
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mb-8 font-medium">
            Thank you, <strong className="text-slate-900 font-bold">{visitorName}</strong>. Your customized {packageInfo.duration_days}-day Siwa tour package has been dispatched directly to licensed operators and artisans. You will receive quotes and confirmation via WhatsApp/Phone at <span className="text-amber-700 font-bold">{visitorPhone}</span>.
          </p>
          <button
            onClick={() => { setSuccess(false); handleResetToCustomBlank(); }}
            className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#f59e0b] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all shadow-md"
          >
            Create Another Itinerary
          </button>
        </div>
      ) : (
        <>
          {/* STEP 1: BLUEPRINT & CURATED PRESETS */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Curated Presets Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                    <span className="text-xs font-black tracking-widest text-slate-900 uppercase">
                      Curated Signature Expeditions
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">1-Click Full Itineraries</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                    const isCurrent = loadedPresetKey?.toLowerCase() === key;
                    const totalStops = preset.days.reduce((sum, d) => sum + d.items.length, 0);
                    return (
                      <div
                        key={key}
                        onClick={() => applyCuratedPreset(key)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between group relative overflow-hidden ${
                          isCurrent
                            ? 'bg-amber-50/60 border-2 border-amber-500 shadow-lg ring-2 ring-amber-500/20'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 px-2.5 py-1 bg-amber-100/70 rounded-full border border-amber-200">
                              {preset.badge}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              ${preset.price_usd} <span className="text-[10px] font-medium text-slate-500">/ guest</span>
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                            {preset.name}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
                            {preset.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-2 text-slate-700 font-semibold">
                            <span>⏱ {preset.duration_days} Days</span>
                            <span className="text-slate-300">•</span>
                            <span>📍 {totalStops} Stops</span>
                          </div>
                          <span className={`text-xs font-black flex items-center gap-1 ${isCurrent ? 'text-amber-700' : 'text-slate-500 group-hover:text-slate-900'}`}>
                            {isCurrent ? 'Active Plan ✓' : 'Select Plan →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operator Packages Option */}
              {agencyTours.length > 0 && (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                      <Building2 size={14} className="text-amber-600" />
                      <span>Tour Operator Packaged Routes</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{agencyTours.length} verified packages</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {agencyTours.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleLoadAgencyTour(t.id)}
                        className="p-4 bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800 truncate">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal">
                            {t.description || 'Pre-designed operator schedule'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600 font-medium">
                          <span>⏱ {t.duration_days} Days</span>
                          <span className="text-amber-700 font-black">
                            {t.base_price_usd ? `$${t.base_price_usd}` : 'Direct Quote'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary Configuration Form */}
              <div className="p-8 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-amber-800 uppercase">
                  <Sliders size={14} />
                  <span>Itinerary Parameters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Tour Name *
                    </label>
                    <input
                      type="text"
                      value={packageInfo.name}
                      onChange={(e) => setPackageInfo({ ...packageInfo, name: e.target.value })}
                      placeholder="e.g. Siwa Artisan & Desert Exploration"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Experience Focus
                    </label>
                    <select
                      value={packageInfo.vibe}
                      onChange={(e) => setPackageInfo({ ...packageInfo, vibe: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none text-xs font-bold"
                    >
                      <option value="cultural">Artisanal Craft &amp; Cultural Heritage</option>
                      <option value="adventure">Desert Safari &amp; 4x4 Great Sand Sea</option>
                      <option value="wellness">Healing, Salt Lakes &amp; Thermal Springs</option>
                      <option value="culinary">Gastronomy, Olive Groves &amp; Date Harvest</option>
                      <option value="slow-paced">Quiet Detox &amp; Stargazing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Trip Vision &amp; Special Preferences
                  </label>
                  <textarea
                    value={packageInfo.description}
                    onChange={(e) => setPackageInfo({ ...packageInfo, description: e.target.value })}
                    placeholder="Describe your desired pace, must-visit locations, or special logistics..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none text-xs font-medium"
                  />
                </div>

                {/* Duration & Pace */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      Duration: <span className="text-amber-700 font-black">{packageInfo.duration_days} Days</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleChangeDays(d)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            packageInfo.duration_days === d
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {d} {d === 1 ? 'Day' : 'Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      Pace: <span className="text-amber-700 font-black capitalize">{packageInfo.pace}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['relaxed', 'moderate', 'active'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPackageInfo({ ...packageInfo, pace: p })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                            packageInfo.pace === p
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                  className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#f59e0b] to-[#d97706] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-2"
                >
                  <span>Configure Daily Timeline</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DAILY TIMELINE STUDIO */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Presets Switcher Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 font-black text-[11px] uppercase tracking-wider whitespace-nowrap">
                  Switch Plan:
                </span>
                {Object.entries(CURATED_JOURNEY_PRESETS).map(([key, preset]) => {
                  const isCurrent = loadedPresetKey?.toLowerCase() === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyCuratedPreset(key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        isCurrent
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-amber-400'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 border-b border-slate-200">
                {packageInfo.itinerary.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedDay === d.day
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#f59e0b] text-slate-950 shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Day {d.day}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      selectedDay === d.day ? 'bg-black/15 text-black font-black' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.items.length} stops
                    </span>
                  </button>
                ))}
              </div>

              {/* Grid: Timeline Stream (7 cols) + Add Activity Card (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Daily Timeline List (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Calendar size={16} className="text-amber-600" />
                      <span>Day {selectedDay} Schedule</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {currentDayItems.length} activities planned
                    </span>
                  </div>

                  {currentDayItems.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs bg-white">
                      No stops scheduled for Day {selectedDay}.<br />
                      Use the activity panel on the right to schedule visits, meals, or workshops.
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-[38px] before:top-4 before:bottom-4 before:w-[2px] before:bg-amber-200">
                      {currentDayItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-2xl transition-all flex items-start justify-between gap-4 group shadow-xs hover:shadow-sm"
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Time Badge */}
                            <div className="px-2.5 py-1.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-900 font-mono font-black text-xs whitespace-nowrap text-center">
                              {item.time}
                            </div>

                            <div className="space-y-1">
                              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <span>{item.business_name}</span>
                                {item.is_custom_manual && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full border border-blue-200 font-bold">
                                    Custom
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                                <span>{item.child_type_name}</span>
                                <span className="text-slate-300">•</span>
                                <span>
                                  {Math.floor(item.duration_minutes! / 60)}h {item.duration_minutes! % 60 > 0 && `${item.duration_minutes! % 60}m`}
                                </span>
                              </div>

                              {item.notes && (
                                <div className="text-xs text-slate-600 italic font-normal bg-slate-50 p-2 rounded-xl border border-slate-200 mt-1.5">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
                            title="Remove Stop"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Form: Add Activity Panel (5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center justify-between">
                    <span>Add Activity to Day {selectedDay}</span>
                  </div>

                  {/* Mode switcher */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInputMode('db_vendor')}
                      className={`py-2 rounded-lg transition-all ${
                        inputMode === 'db_vendor' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('admin_curated')}
                      className={`py-2 rounded-lg transition-all ${
                        inputMode === 'admin_curated' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Curated
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('custom_manual')}
                      className={`py-2 rounded-lg transition-all ${
                        inputMode === 'custom_manual' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Timings Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration</label>
                      <select
                        value={businessDuration}
                        onChange={(e) => setBusinessDuration(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
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
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={bizSearch}
                          onChange={(e) => setBizSearch(e.target.value)}
                          placeholder="Search hotel, restaurant, guide..."
                          className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                        <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-200 p-1.5 rounded-xl bg-slate-50">
                        {filteredBusinesses.map((b) => (
                          <div
                            key={b.service_id || b.id}
                            onClick={() => setSelectedBusiness(b)}
                            className={`p-2.5 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-all ${
                              selectedBusiness?.id === b.id
                                ? 'bg-amber-100 text-amber-950 font-black border border-amber-300 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <span className="truncate font-medium">{b.service_id ? `${b.name} · ${b.business_name || 'Service'}` : b.name}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{b.type_name || b.type_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: CURATED PRESETS */}
                  {inputMode === 'admin_curated' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 p-1.5 rounded-xl bg-slate-50">
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
                          className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs text-slate-800 font-medium"
                        >
                          <span className="truncate">{preset.title}</span>
                          <Plus size={14} className="text-amber-700 flex-shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE 3: CUSTOM MANUAL ENTRY */}
                  {inputMode === 'custom_manual' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Custom Activity Name
                        </label>
                        <input
                          type="text"
                          value={customActivityName}
                          onChange={(e) => setCustomActivityName(e.target.value)}
                          placeholder="e.g. Private sunset picnic at Fatnas Island"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:border-amber-500 focus:outline-none"
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Specific Wishes / Notes</label>
                    <input
                      type="text"
                      value={businessNotes}
                      onChange={(e) => setBusinessNotes(e.target.value)}
                      placeholder="e.g. English-speaking guide required"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
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
                      className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#f59e0b] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus size={15} /> Add to Day {selectedDay} Schedule
                    </button>
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-between pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={14} />
                  <span>Blueprint Parameters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] via-[#f59e0b] to-[#d97706] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-2"
                >
                  <span>Review &amp; Request Quotes</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & DIRECT VENDOR TRANSMISSION */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Itinerary</div>
                  <div className="text-sm font-black text-slate-900 mt-1 truncate">{packageInfo.name || 'Custom Plan'}</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Duration</div>
                  <div className="text-sm font-black text-slate-900 mt-1">{packageInfo.duration_days} Days</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Stops</div>
                  <div className="text-sm font-black text-slate-900 mt-1">{totalStopsCount} Activities</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Cost</div>
                  <div className="text-sm font-black text-amber-700 mt-1">
                    {packageInfo.price_usd ? `$${packageInfo.price_usd} / guest` : 'Direct Operator Quote'}
                  </div>
                </div>
              </div>

              {/* Day-by-Day Schedule Summary */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div className="text-xs font-black tracking-widest text-amber-800 uppercase flex items-center gap-2">
                  <Layers size={14} />
                  <span>Final Itinerary Timeline</span>
                </div>

                <div className="space-y-3">
                  {packageInfo.itinerary.map((d) => (
                    <div key={d.day} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                        <span>Day {d.day}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{d.items.length} activities scheduled</span>
                      </div>
                      {d.items.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">Free schedule / unassigned</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                          {d.items.map((item) => (
                            <div key={item.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-2.5 shadow-xs">
                              <span className="font-mono text-amber-700 font-bold">{item.time}</span>
                              <span className="text-slate-800 font-semibold truncate">{item.business_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Traveler Contact Input Form */}
              <div className="p-8 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
                <div className="text-xs font-black tracking-widest text-amber-800 uppercase flex items-center gap-2">
                  <User size={15} />
                  <span>Traveler Information (Transmitted Directly to Licensed Siwan Operators)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="eleanor@example.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Expected Travel Date</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Party / Group Size</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Special Requests, Dietary, or Transfers</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Cairo pickup needed, vegetarian meals, private vehicle"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={14} />
                  <span>Edit Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePackage}
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#f59e0b] to-[#d97706] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{loading ? 'Transmitting...' : 'Dispatch Tour Inquiry to Operators'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
