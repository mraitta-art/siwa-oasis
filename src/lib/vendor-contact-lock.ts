const protectedContactKey = /^(phone|mobile|whatsapp|whats_app|contact_phone|contact_whatsapp|phone_number|mobile_number|whatsapp_number|contact_number|contactphone|contactwhatsapp|mobilenumber|whatsappnumber)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function preserveVendorContact(existing: unknown, incoming: unknown): Record<string, unknown> {
  const current = isRecord(existing) ? existing : {};
  const next = isRecord(incoming) ? incoming : {};
  const result: Record<string, unknown> = { ...next };

  for (const key of Object.keys(result)) {
    if (protectedContactKey.test(key) && !Object.prototype.hasOwnProperty.call(current, key)) {
      delete result[key];
    }
  }

  for (const [key, value] of Object.entries(current)) {
    if (protectedContactKey.test(key)) {
      result[key] = value;
    } else if (isRecord(value)) {
      result[key] = preserveVendorContact(value, next[key]);
    }
  }

  return result;
}
