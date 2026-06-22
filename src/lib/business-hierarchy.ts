/**
 * Business Type Hierarchy Validator
 * 
 * HIERARCHY STRUCTURE:
 * ┌─ Parent Template (is_parent=TRUE, parent_id=NULL)
 * │   └─ Child Template (is_parent=FALSE, parent_id=<parent_id>)
 * │       └─ Leaf Business (is_parent=FALSE, parent_id=NULL, vendor_id set)
 * 
 * RULES:
 * - Parent templates: NO vendors, NO minisites, template structure only, forms are READ-ONLY
 * - Child templates: inherit from parent, NO vendors, NO minisites, forms are READ-ONLY  
 * - Leaf businesses: actual instances with vendor owner/manager, CAN have minisites, forms EDITABLE
 */

export interface BusinessTypeInfo {
  id: string;
  name: string;
  is_parent: boolean;
  parent_id: string | null;
  vendor_id?: string | null;
  sections?: string[];
  own_sections?: string[];
}

/**
 * Determine if a business type is a parent template
 */
export function isParentTemplate(type: BusinessTypeInfo): boolean {
  return type.is_parent === true && !type.parent_id;
}

/**
 * Determine if a business type is a child template
 */
export function isChildTemplate(type: BusinessTypeInfo): boolean {
  return !type.is_parent && type.parent_id !== null && type.parent_id !== undefined;
}

/**
 * Determine if a business is a leaf (actual fillable instance)
 */
export function isLeafBusiness(type: BusinessTypeInfo): boolean {
  return !type.is_parent && !type.parent_id && type.vendor_id !== undefined;
}

/**
 * Determine if business type is a template (parent or child)
 */
export function isTemplate(type: BusinessTypeInfo): boolean {
  return isParentTemplate(type) || isChildTemplate(type);
}

/**
 * Get the template level badge for UI display
 */
export function getTemplateLevelBadge(type: BusinessTypeInfo): {
  label: string;
  icon: string;
  color: string;
  editable: boolean;
} {
  if (isParentTemplate(type)) {
    return {
      label: '👑 Parent Template',
      icon: '👑',
      color: 'bg-purple-900 text-purple-200',
      editable: false,
    };
  }

  if (isChildTemplate(type)) {
    return {
      label: '📋 Child Template',
      icon: '📋',
      color: 'bg-blue-900 text-blue-200',
      editable: false,
    };
  }

  if (isLeafBusiness(type)) {
    return {
      label: '🏪 Business Instance',
      icon: '🏪',
      color: 'bg-green-900 text-green-200',
      editable: true,
    };
  }

  return {
    label: '❓ Unknown',
    icon: '❓',
    color: 'bg-gray-900 text-gray-200',
    editable: false,
  };
}

/**
 * Get validation message for form editability
 */
export function getFormValidationMessage(type: BusinessTypeInfo): {
  canEdit: boolean;
  message: string;
  icon: string;
} {
  if (isParentTemplate(type)) {
    return {
      canEdit: false,
      message: '👑 This is a parent template. Forms are read-only and define the structure for child types.',
      icon: '🔒',
    };
  }

  if (isChildTemplate(type)) {
    return {
      canEdit: false,
      message: `📋 This is a child template inheriting from parent. Forms are read-only templates.`,
      icon: '🔒',
    };
  }

  if (isLeafBusiness(type)) {
    return {
      canEdit: true,
      message: '✅ This is a business instance. You can fill in the form data.',
      icon: '✏️',
    };
  }

  return {
    canEdit: false,
    message: 'Form type unknown',
    icon: '❓',
  };
}

/**
 * Get form field editability based on business type
 */
export function canEditFormField(type: BusinessTypeInfo, fieldSectionOrigin?: string): boolean {
  // Only leaf businesses can have editable forms
  if (!isLeafBusiness(type)) {
    return false;
  }

  // If field is marked as template-only, still not editable
  if (fieldSectionOrigin === 'template') {
    return false;
  }

  return true;
}

/**
 * Build inheritance chain display
 */
export function getInheritanceChain(type: BusinessTypeInfo, parentTypes: Map<string, BusinessTypeInfo>): string[] {
  const chain: string[] = [];

  if (isParentTemplate(type)) {
    chain.push(`👑 ${type.name} (Parent Template)`);
    return chain;
  }

  if (isChildTemplate(type)) {
    chain.push(`📋 ${type.name} (Child Template)`);
    if (type.parent_id && parentTypes.has(type.parent_id)) {
      const parent = parentTypes.get(type.parent_id)!;
      chain.unshift(`👑 ${parent.name} (Parent Template)`);
    }
    return chain;
  }

  if (isLeafBusiness(type)) {
    chain.push(`🏪 ${type.name} (Business Instance)`);
    if (type.parent_id && parentTypes.has(type.parent_id)) {
      const parent = parentTypes.get(type.parent_id)!;
      chain.unshift(`📋 ${parent.name} (Child Template)`);
      if (parent.parent_id && parentTypes.has(parent.parent_id)) {
        const grandparent = parentTypes.get(parent.parent_id)!;
        chain.unshift(`👑 ${grandparent.name} (Parent Template)`);
      }
    }
    return chain;
  }

  return chain;
}

/**
 * Validation rules for form submission
 */
export function validateFormSubmission(type: BusinessTypeInfo, formData: Record<string, any>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Templates cannot have data submitted
  if (isTemplate(type)) {
    errors.push(`Cannot save data to ${isParentTemplate(type) ? 'parent' : 'child'} template type.`);
    errors.push('Only leaf business instances can store data.');
    return { valid: false, errors, warnings };
  }

  // Leaf businesses require vendor_id
  if (isLeafBusiness(type) && !type.vendor_id) {
    warnings.push('⚠️ This business instance has no assigned vendor/owner yet.');
  }

  // Check for empty required fields in template mode
  if (isTemplate(type)) {
    const hasData = Object.values(formData).some(v => v && String(v).trim());
    if (hasData) {
      warnings.push('📋 Template forms should not contain business data. Data will be ignored.');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
