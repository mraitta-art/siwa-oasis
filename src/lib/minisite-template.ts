export type MinisiteTemplateComponentType =
  | 'hero_carousel'
  | 'service_catalog'
  | 'cta_section'
  | 'text_section'
  | 'testimonials'
  | 'faq';

export interface MinisiteTemplateComponent {
  id: string;
  type: MinisiteTemplateComponentType;
  order: number;
  label?: string;
  props: Record<string, unknown>;
}

export interface MinisiteTemplatePlan {
  schemaVersion: 1;
  templateId: string;
  components: MinisiteTemplateComponent[];
}

const SUPPORTED_COMPONENTS = new Set<MinisiteTemplateComponentType>([
  'hero_carousel',
  'service_catalog',
  'cta_section',
  'text_section',
  'testimonials',
  'faq',
]);

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

/** Normalize template JSON without allowing malformed layout data to break a minisite. */
export function normalizeMinisiteTemplate(
  templateId: unknown,
  serializedComponents: unknown,
  availableSectionIds: string[] = []
): MinisiteTemplatePlan | null {
  const id = typeof templateId === 'string' ? templateId.trim() : '';
  const parsed = parseJson(serializedComponents);
  if (!id || !Array.isArray(parsed)) return null;

  const components: MinisiteTemplateComponent[] = [];
  const ids = new Set<string>();
  const orders = new Set<number>();

  parsed.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;
    const type = item.type;
    if (typeof type !== 'string' || !SUPPORTED_COMPONENTS.has(type as MinisiteTemplateComponentType)) return;

    const componentId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `template-${index}`;
    const order = Number.isInteger(item.order) ? Number(item.order) : index;
    if (ids.has(componentId) || orders.has(order)) return;

    const props = item.props && typeof item.props === 'object' && !Array.isArray(item.props)
      ? item.props as Record<string, unknown>
      : {};

    const sectionId = props.section_id;
    if (typeof sectionId === 'string' && availableSectionIds.length > 0 && !availableSectionIds.includes(sectionId)) return;

    ids.add(componentId);
    orders.add(order);
    components.push({
      id: componentId,
      type: type as MinisiteTemplateComponentType,
      order,
      label: typeof item.label === 'string' ? item.label : undefined,
      props,
    });
  });

  if (components.length === 0) return null;
  components.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  return { schemaVersion: 1, templateId: id, components };
}