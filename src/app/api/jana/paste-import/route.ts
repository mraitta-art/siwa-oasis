import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { parseHospitalityRawText, hospitalityDataTo10Sections } from '@/lib/hospitality-mapper';
import { detectBusinessCategory } from '@/lib/category-detector';
import {
  enrichSourceWithAi,
  getConfiguredAiProviders,
  type SourceAiProvider,
} from '@/lib/source-agent';

/**
 * PASTE & IMPORT API
 * Universally parses pasted text from OTAs (Booking.com, TripAdvisor, Airbnb, Agoda),
 * raw notes, or messages, auto-detects typology, and supports multi-provider AI enrichment
 * saving into the canonical 10-section database schema with dual backward compatibility.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      action = 'parse',
      text = '',
      businessId,
      typeId,
      parentId,
      customSlug,
      aiProvider = 'built_in',
      enrichedSections,
    } = body;

    // ── ACTION 0: Query available AI providers ──
    if (action === 'providers') {
      return NextResponse.json({
        providers: getConfiguredAiProviders(),
      });
    }

    // ── ACTION 1: Detect Business Typology from Text ──
    if (action === 'detect_category') {
      if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'Text content is required for detection' }, { status: 400 });
      }
      const detected = detectBusinessCategory(text);
      return NextResponse.json({ success: true, detected });
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content is required for parsing' }, { status: 400 });
    }

    // ── 1. Smart Category Detection & NLP Parsing ──
    const detectedCategory = detectBusinessCategory(text);
    const resolvedTypeId = typeId || detectedCategory.childId || 'hotel';
    const resolvedParentId = parentId || detectedCategory.parentId || 'accommodation';

    const parsedData = parseHospitalityRawText(text);
    const sections10 = hospitalityDataTo10Sections(parsedData);

    // ── 2. AI Enrichment (if requested or cloud/local model enabled) ──
    let aiDraft = null;
    const supportedProviders: SourceAiProvider[] = ['built_in', 'gemini', 'openai', 'claude', 'ollama', 'manus'];
    const selectedProvider: SourceAiProvider = supportedProviders.includes(aiProvider) ? aiProvider : 'built_in';

    if (action === 'parse') {
      if (selectedProvider !== 'built_in' && getConfiguredAiProviders()[selectedProvider]) {
        try {
          const placePayload = {
            name: parsedData.basic.name || 'Imported Property',
            address: parsedData.basic.address || 'Siwa Oasis, Egypt',
            phone: parsedData.connector?.phone || parsedData.basic.phone || '',
            website: parsedData.connector?.website || parsedData.basic.booking_url || '',
            rating: parsedData.testimonials.rating ? +(parsedData.testimonials.rating / 2).toFixed(1) : 0,
            reviews: (parsedData.testimonials.review_highlights || []).map((r: any) => ({
              author_name: r.author || 'Guest',
              text: r.text,
              country: r.country,
            })),
            raw_text_snippet: text.slice(0, 1500),
          };
          aiDraft = await enrichSourceWithAi(selectedProvider, placePayload, resolvedTypeId);
        } catch (aiErr: any) {
          console.warn(`[PASTE-IMPORT AI] Provider ${selectedProvider} enrichment warning:`, aiErr?.message || aiErr);
        }
      }

      return NextResponse.json({
        success: true,
        preview: parsedData,
        sections10,
        detectedCategory,
        resolvedTypeId,
        resolvedParentId,
        aiProvider: selectedProvider,
        aiDraft,
        summary: {
          name: parsedData.basic.name || 'Unnamed Property',
          rating: parsedData.testimonials.rating || null,
          reviews_count: parsedData.testimonials.reviews_count || 0,
          pools_count: parsedData.facilities.pools_count || 0,
          room_types_count: (parsedData.rooms?.room_types || []).length,
          reviews_highlights_count: (parsedData.testimonials.review_highlights || []).length,
          has_hot_spring: Boolean(parsedData.facilities.hot_spring),
          has_restaurant: Boolean(parsedData.gastronomy.restaurant_name),
        },
      });
    }

    // ── 3. Action === 'save': Save or update into database ──
    if (action === 'save') {
      const name = parsedData.basic.name || 'Imported Hospitality Business';
      const rawSlug = customSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = rawSlug || `biz-${Date.now()}`;

      // Merge enriched sections if provided by the frontend or AI draft
      const finalSections10 = {
        ...sections10,
        ...(enrichedSections || {}),
      };

      // Build unified dual-schema custom_data JSON
      const customData = {
        // Canonical 10 database sections
        ...finalSections10,

        // Legacy compatibility sections (ensures all older components render seamlessly)
        basic: parsedData.basic,
        facilities: parsedData.facilities,
        gastronomy: parsedData.gastronomy,
        experience: parsedData.experience,
        rooms: parsedData.rooms,
        testimonials: parsedData.testimonials,
        location: parsedData.location,
        connector: parsedData.connector,
        vibe: parsedData.vibe,
        active_minisite_sections: parsedData.active_minisite_sections || [
          'sec_1_identity',
          'sec_2_ambience',
          'sec_3_facilities',
          'sec_4_gastronomy',
          'sec_5_experiences',
          'sec_6_guardian',
          'sec_7_investment',
          'sec_8_connector',
          'sec_9_marketplace_catalog',
          'sec_10_testimonials_faqs',
        ],
        source_provenance: {
          source_mode: 'paste_import',
          ai_provider: selectedProvider,
          detected_typology: detectedCategory.childId,
          detection_confidence: detectedCategory.confidence,
          imported_by: user?.email || 'admin@siwify.com',
          imported_at: new Date().toISOString(),
          source_url: parsedData.basic.booking_url || '',
        },
      };

      if (businessId) {
        // Update existing business
        await execute(
          `UPDATE businesses 
           SET custom_data = ?, 
               name = COALESCE(NULLIF(?, ''), name),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [JSON.stringify(customData), name, businessId]
        );
        return NextResponse.json({
          success: true,
          message: 'Business updated successfully',
          businessId,
          slug,
        });
      } else {
        // Create new business listing
        const res = await execute(
          `INSERT INTO businesses 
           (name, slug, type_id, status, published, approved_by_vendor, custom_data, created_at, updated_at) 
           VALUES (?, ?, ?, 'active', 1, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [name, slug, resolvedTypeId, JSON.stringify(customData)]
        ) as any;

        const newId = res.insertId;
        return NextResponse.json({
          success: true,
          message: 'Business created and imported successfully',
          businessId: newId,
          slug,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[PASTE-IMPORT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

