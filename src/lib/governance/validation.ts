// ================================================================
// SIWA OASIS: Validation Engine (Ported from Master HTML Module 4)
// ================================================================

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  email?: boolean;
  url?: boolean;
  regex?: string;
  min?: number;
  max?: number;
}

export function validate(value: any, rules: ValidationRules, label: string): string[] {
  const errors: string[] = [];
  const str = String(value ?? '').trim();

  if (rules.required && !str) errors.push(`${label} is required`);
  if (str && rules.minLength && str.length < rules.minLength) errors.push(`${label} must be at least ${rules.minLength} characters`);
  if (str && rules.maxLength && str.length > rules.maxLength) errors.push(`${label} must be at most ${rules.maxLength} characters`);
  if (str && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) errors.push(`${label} must be a valid email`);
  if (str && rules.url && !/^https?:\/\/.+/.test(str)) errors.push(`${label} must be a valid URL`);
  if (str && rules.regex) {
    try { if (!new RegExp(rules.regex).test(str)) errors.push(`${label} format is invalid`); } catch { /* ignore invalid regex */ }
  }
  if (str && rules.min !== undefined && Number(str) < rules.min) errors.push(`${label} must be at least ${rules.min}`);
  if (str && rules.max !== undefined && Number(str) > rules.max) errors.push(`${label} must be at most ${rules.max}`);

  return errors;
}

export function validateAllFields(
  data: Record<string, any>,
  fieldRules: { name: string; label: string; rules: ValidationRules }[]
): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let valid = true;

  for (const field of fieldRules) {
    const fieldErrors = validate(data[field.name], field.rules, field.label);
    if (fieldErrors.length) {
      errors[field.name] = fieldErrors;
      valid = false;
    }
  }

  return { valid, errors };
}
