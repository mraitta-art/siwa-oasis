'use client';

import { useState, useCallback } from 'react';
import {
  BusinessTypeInfo,
  canEditFormField,
  validateFormSubmission,
  isTemplate,
} from '@/lib/business-hierarchy';

interface UseBusinessFormValidationOptions {
  businessType: BusinessTypeInfo;
  onValidationChange?: (isValid: boolean) => void;
}

export function useBusinessFormValidation({
  businessType,
  onValidationChange,
}: UseBusinessFormValidationOptions) {
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);

  const validateSubmission = useCallback(
    (formData: Record<string, any>) => {
      const result = validateFormSubmission(businessType, formData);
      setFormErrors(result.errors);
      setFormWarnings(result.warnings);
      onValidationChange?.(result.valid);
      return result;
    },
    [businessType, onValidationChange]
  );

  const canEditField = useCallback(
    (fieldSectionOrigin?: string) => {
      return canEditFormField(businessType, fieldSectionOrigin);
    },
    [businessType]
  );

  const isFormReadOnly = useCallback(() => {
    return isTemplate(businessType);
  }, [businessType]);

  return {
    validateSubmission,
    canEditField,
    isFormReadOnly,
    formErrors,
    formWarnings,
  };
}

interface FormFieldValidationProps {
  businessType: BusinessTypeInfo;
  value: any;
  fieldSectionOrigin?: string;
  fieldName?: string;
}

export function useFieldValidation({
  businessType,
  value,
  fieldSectionOrigin,
  fieldName,
}: FormFieldValidationProps) {
  const canEdit = canEditFormField(businessType, fieldSectionOrigin);
  
  const isInherited = fieldSectionOrigin === 'inherited';
  const isTemplate = fieldSectionOrigin === 'template';

  const fieldStatus = {
    canEdit,
    isInherited,
    isTemplate,
    isEmpty: !value || String(value).trim() === '',
  };

  const getFieldHint = useCallback((): string => {
    if (isTemplate) {
      return '🔒 This is a template field - read-only structure definition';
    }
    if (isInherited) {
      return '📋 Inherited from parent template structure';
    }
    if (!canEdit) {
      return '❌ Cannot edit - business type is a template';
    }
    return '✅ You can edit this field';
  }, [isTemplate, isInherited, canEdit]);

  return { canEdit, isInherited, isTemplate, isEmpty: fieldStatus.isEmpty, getFieldHint };
}

/**
 * Hook to disable form submission for templates
 */
export function useFormSubmissionControl(businessType: BusinessTypeInfo) {
  const isReadOnly = isTemplate(businessType);

  const handleSubmit = useCallback(
    (callback: () => Promise<void>) => {
      return async (e: React.FormEvent) => {
        e.preventDefault();

        if (isReadOnly) {
          alert('❌ Cannot submit form: This is a template. Only leaf business instances can save data.');
          return;
        }

        try {
          await callback();
        } catch (error) {
          console.error('Form submission error:', error);
        }
      };
    },
    [isReadOnly]
  );

  return {
    canSubmit: !isReadOnly,
    handleSubmit,
    isReadOnly,
    submitButtonLabel: isReadOnly ? '🔒 Read-only Template' : '💾 Save Business Data',
  };
}
