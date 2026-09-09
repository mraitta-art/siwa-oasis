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

const SOURCE_AGENT_STRATEGY = `SOURCE IMPORT TASK
You are the Siwa Oasis source-data analyst. The server supplies one public source link, one selected business category, and an explicit administrator confirmation.

WORKFLOW:
1. Analyze only the supplied source facts. Do not invent facts or browse unrelated sources.
2. Compare the source evidence with the administrator-selected category.
3. Treat AI category recognition as a warning signal. The administrator's explicit confirmation is the final authority.
4. If the administrator confirmed the link and category match, continue and extract only data relevant to that confirmed category.
5. If confirmation is missing, do not approve the draft. Report that admin confirmation is required.
6. Keep unknown fields empty and list them in missing_fields.
7. Preserve source provenance: provider, original URL, source ID, and import time.
8. If facts suggest an existing business, report duplicate evidence and recommend merge, delete, keep separate, or manual review. Never silently merge or delete.
9. Return cautious, database-ready JSON only. Generated wording must be listed in verification_notes.

OFFLINE RULE:
When running through Ollama, use this same strategy without assuming internet access. The source facts supplied by the server are the complete evidence available to you.
`;

function buildPrompt(place: object, category: string) {
  return `${SOURCE_AGENT_STRATEGY}
CONFIRMED ADMIN CATEGORY: ${category}

OUTPUT CONTRACT:
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

export function getConfiguredAiProviders() {
  return {
    ollama: Boolean(process.env.OLLAMA_URL || process.env.OLLAMA_MODEL),
    openai: Boolean(process.env.OPENAI_API_KEY),
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    manus: Boolean(process.env.MANUS_API_KEY && process.env.MANUS_API_URL),
  } satisfies Record<SourceAiProvider, boolean>;
}
