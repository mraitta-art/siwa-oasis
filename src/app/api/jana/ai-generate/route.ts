import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { businessName, sectionName, typology } = await req.json();

    // In a real production app, you would call OpenAI/Gemini here.
    // For now, I will use my own intelligence to generate the story snippet.
    
    const prompt = `Write a high-end, SEO-OPTIMIZED blog snippet for a ${typology || 'business'} in Siwa Oasis.
    Business Name: ${businessName}
    Section: ${sectionName}
    Tone: Mystical, Luxury, Heritage-focused.
    SEO Requirements: 
    - Use semantic HTML (one <h2>, multiple <p>).
    - Naturally include keywords: "${businessName}", "Siwa Oasis", "${typology || 'Experience'}".
    - Focus on local authenticity.
    - Provide a 160-character SEO Meta Description.`;

    // Simulated SEO-Optimized AI response
    const story = `<h2>Discover the Authentic Soul of ${businessName}</h2>
    <p>When exploring the mystical landscapes of <strong>Siwa Oasis</strong>, the experience at <strong>${businessName}</strong> stands out as a beacon of local heritage and modern comfort. Our ${sectionName} is meticulously designed to offer a deep connection to the ancient traditions of this Egyptian paradise.</p>
    <p>As a premier ${typology || 'destination'} in the heart of the oasis, ${businessName} utilizes natural materials and sustainable practices. From the salt-infused breezes to the tranquil palm groves, every moment spent in our ${sectionName} tells a story of survival, beauty, and timelessness.</p>
    <p>Whether you are seeking a peaceful retreat or a cultural adventure, ${businessName} in Siwa Oasis provides the perfect sanctuary for the modern traveler.</p>`;

    const metaDescription = `Experience the mystical charm of ${businessName} in Siwa Oasis. Discover our unique ${sectionName} and immerse yourself in the authentic heritage of Egypt's hidden gem.`;

    return NextResponse.json({ story, metaDescription });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
