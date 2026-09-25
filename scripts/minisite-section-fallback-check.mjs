import assert from 'node:assert/strict';

const mod = await import('../src/lib/section-registry.ts');
const { getMinisiteSectionIds } = mod;

const fallback = getMinisiteSectionIds('travel_agency', []);
assert.ok(Array.isArray(fallback) && fallback.length > 0, 'fallback should include default public sections');
assert.ok(fallback.includes('sec_1_identity'), 'travel agency fallback should include identity');
assert.ok(fallback.includes('sec_9_marketplace_catalog'), 'travel agency fallback should include marketplace catalog');
console.log('minisite fallback ok:', fallback.slice(0, 5));
