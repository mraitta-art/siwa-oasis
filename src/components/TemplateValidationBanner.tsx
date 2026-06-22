'use client';

import React from 'react';
import {
  BusinessTypeInfo,
  getTemplateLevelBadge,
  getFormValidationMessage,
  getInheritanceChain,
} from '@/lib/business-hierarchy';

interface TemplateValidationBannerProps {
  businessType: BusinessTypeInfo;
  allBusinessTypes?: Map<string, BusinessTypeInfo>;
  showInheritanceChain?: boolean;
}

export function TemplateValidationBanner({
  businessType,
  allBusinessTypes = new Map(),
  showInheritanceChain = true,
}: TemplateValidationBannerProps) {
  const badge = getTemplateLevelBadge(businessType);
  const validation = getFormValidationMessage(businessType);
  const chain = showInheritanceChain ? getInheritanceChain(businessType, allBusinessTypes) : [];

  return (
    <div className={`p-4 rounded-lg border ${badge.color} mb-6`}>
      {/* Header with badge */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{badge.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{badge.label}</h3>
          <p className="text-sm text-gray-300 mt-1">{businessType.name}</p>
        </div>
      </div>

      {/* Validation message */}
      <div className="flex items-start gap-2 mb-3 p-3 rounded bg-black/30">
        <span className="text-lg flex-shrink-0">{validation.icon}</span>
        <p className="text-sm text-white">{validation.message}</p>
      </div>

      {/* Inheritance chain */}
      {showInheritanceChain && chain.length > 1 && (
        <div className="p-3 rounded bg-black/30 border-l-2 border-[#D4AF37]">
          <p className="text-xs text-gray-400 mb-2">📊 Inheritance Chain:</p>
          <div className="space-y-1">
            {chain.map((item, idx) => (
              <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                {idx > 0 && <span className="text-[#D4AF37]">↓</span>}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editability status */}
      <div className="mt-3 p-2 rounded text-xs font-semibold">
        {validation.canEdit ? (
          <div className="text-green-200 bg-green-900/30 p-2 rounded">
            ✅ Form fields are EDITABLE - you can fill in business data
          </div>
        ) : (
          <div className="text-red-200 bg-red-900/30 p-2 rounded">
            🔒 Form is READ-ONLY - this is a template structure. Data entry is disabled.
          </div>
        )}
      </div>
    </div>
  );
}

interface FormFieldWrapperProps {
  businessType: BusinessTypeInfo;
  fieldName: string;
  fieldSectionOrigin?: string;
  children: React.ReactNode;
}

export function FormFieldWrapper({
  businessType,
  fieldName,
  fieldSectionOrigin,
  children,
}: FormFieldWrapperProps) {
  const validation = getFormValidationMessage(businessType);
  const isEditable = validation.canEdit && fieldSectionOrigin !== 'template';

  return (
    <div
      className={`relative ${isEditable ? '' : 'opacity-60 pointer-events-none'}`}
      title={isEditable ? '' : 'Template fields cannot be edited'}
    >
      {children}
      {!isEditable && (
        <div className="absolute top-1 right-1 text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
          🔒 Read-only
        </div>
      )}
      {fieldSectionOrigin === 'inherited' && (
        <div className="absolute top-1 right-12 text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
          📋 Inherited
        </div>
      )}
    </div>
  );
}
