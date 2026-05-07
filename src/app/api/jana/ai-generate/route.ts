import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { businessName, sectionName, typology } = await req.json();

    // In a real production app, you would call OpenAI/Gemini here.
    // For now, I will use my own intelligence to generate the story snippet.
    
    const prompt = `Write a cinematic, high-end blog snippet for a ${typology || 'business'} in Siwa Oasis.
    Business Name: ${businessName}
    Section: ${sectionName}
    Tone: Mystical, Luxury, Heritage-focused.
    Length: ~150 words.
    Include mentions of Siwan salt, olive groves, or the Oracle Temple if relevant to the section.`;

    // Simulated AI response (replacing actual LLM call for immediate functionality)
    const story = `<h3>The Magic of ${businessName}: A Journey through ${sectionName}</h3>
    <p>In the heart of the Great Sand Sea, where the golden dunes meet the emerald canopy of a thousand palm trees, lies <strong>${businessName}</strong>. Our ${sectionName} section isn't just a place; it's a sensory experience rooted in the ancient soul of Siwa Oasis.</p>
    <p>As the sun sets behind the Fatnas Island, casting long shadows over the salt-crusted earth, visitors to our ${typology || 'establishment'} are invited to rediscover a slower, more meaningful rhythm of life. Whether it's the hand-carved Shali stones that form our walls or the scent of blooming olives in our gardens, every detail of ${sectionName} has been curated to honor the heritage of the Berber kings.</p>
    <p>Join us at ${businessName}, where the whispers of Alexander the Great still echo through the limestone cliffs, and let the mystery of the oasis transform you.</p>`;

    return NextResponse.json({ story });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
