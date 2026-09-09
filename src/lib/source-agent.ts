export type SourceAiProvider = 'ollama' | 'openai' | 'claude' | 'gemini' | 'manus';

export interface SourceAgentDraft {
  suggested_type: string;
  confidence: number;
  sections: Record<string, Record<string, unknown>>;
  missing_fields: string[];
  verification_notes: string[];
}

const IMPORT_SECTIONS = [
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
] as const;

function emptySections() {
  return Object.fromEntries(IMPORT_SECTIONS.map(section => [section, {}])) as Record<string, Record<string, unknown>>;
}

function buildPrompt(place: object, category: string) {
  return `You are a cautious business data analyst. Convert the supplied source facts into a JSON draft for a Siwa Oasis business database.
Rules:
- The administrator confirmed the intended category: ${category}.
- Use only facts in SOURCE_FACTS. Never invent facilities, services, history, prices, reviews, opening hours, ownership, safety claims, or contact details.
- Extract only facts relevant to the confirmed category. Unknown fields go in missing_fields and remain empty.
- Any interpretation must be listed in verification_notes and treated as needing admin verification.
- Return JSON only with this shape: {"suggested_type":"hotel|restaurant|activity|attraction|transportation|craft|wellness|other","confidence":0,"sections":{},"missing_fields":[],"verification_notes":[]}.
- sections must contain exactly these keys: ${IMPORT_SECTIONS.join(', ')}.
SOURCE_FACTS:
${JSON.stringify(place, null, 2)}`;
}

function parseDraft(value: unknown): SourceAgentDraft {
  const parsed = typeof value === 'string' ? JSON.parse(value || '{}') : value as Partial<SourceAgentDraft>;
  const sections = emptySections();
  for (const section of IMPORT_SECTIONS) {
    const candidate = parsed && typeof parsed === 'object' ? (parsed as Partial<SourceAgentDraft>).sections?.[section] : undefined;
    if (candidate && typeof candidate === 'object') sections[section] = candidate as Record<string, unknown>;
  }
  return {
    suggested_type: String((parsed as Partial<SourceAgentDraft>)?.suggested_type || 'other'),
    confidence: Math.max(0, Math.min(1, Number((parsed as Partial<SourceAgentDraft>)?.confidence) || 0)),
    sections,
    missing_fields: Array.isArray((parsed as Partial<SourceAgentDraft>)?.missing_fields) ? (parsed as Partial<SourceAgentDraft>).missing_fields!.map(String) : [],
    verification_notes: Array.isArray((parsed as Partial<SourceAgentDraft>)?.verification_notes) ? (parsed as Partial<SourceAgentDraft>).verification_notes!.map(String) : [],
  };
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}.`);
  return response.json();
}

async function enrichWithOllama(prompt: string) {
  const endpoint = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const payload = await requestJson(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, format: 'json', stream: false, options: { temperature: 0.1 } }),
  });
  return parseDraft(payload.response || '{}');
}

async function enrichWithOpenAi(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured on the server.');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const payload = await requestJson(process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }),
  });
  return parseDraft(payload.choices?.[0]?.message?.content || '{}');
}

async function enrichWithClaude(prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
  const payload = await requestJson(process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 3000, temperature: 0.1, system: 'Return valid JSON only.', messages: [{ role: 'user', content: prompt }] }),
  });
  return parseDraft(payload.content?.find((item: { type?: string }) => item.type === 'text')?.text || '{}');
}

async function enrichWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const payload = await requestJson(`${process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models'}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }),
  });
  return parseDraft(payload.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

async function enrichWithManus(prompt: string) {
  const key = process.env.MANUS_API_KEY;
  const endpoint = process.env.MANUS_API_URL;
  if (!key || !endpoint) throw new Error('MANUS_API_KEY and MANUS_API_URL must be configured before Manus can be selected.');
  const payload = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.MANUS_MODEL, temperature: 0.1, messages: [{ role: 'user', content: prompt }] }),
  });
  return parseDraft(payload.choices?.[0]?.message?.content || payload.output || '{}');
}

export async function enrichSourceWithAi(provider: SourceAiProvider, place: object, category: string) {
  const prompt = buildPrompt(place, category);
  switch (provider) {
    case 'openai': return enrichWithOpenAi(prompt);
    case 'claude': return enrichWithClaude(prompt);
    case 'gemini': return enrichWithGemini(prompt);
    case 'manus': return enrichWithManus(prompt);
    case 'ollama': return enrichWithOllama(prompt);
    default: throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
