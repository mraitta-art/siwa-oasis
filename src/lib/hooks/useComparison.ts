import { useState, useCallback } from 'react';

/**
 * useComparison Hook
 * Manages business selection for comparison feature
 * 
 * Comparison Rules:
 * - Same business type: Can compare all sections
 * - Mixed types: Can only compare universal sections (Vibe, Experience, Investment Opportunity)
 * 
 * Usage:
 * const comparison = useComparison();
 * 
 * // In a search result item:
 * <input 
 *   type="checkbox" 
 *   checked={comparison.isSelected(businessId)}
 *   onChange={() => comparison.toggleBusiness(businessId)}
 * />
 * 
 * // Show comparison button when valid:
 * {comparison.canCompare && (
 *   <button onClick={() => comparison.openComparison()}>
 *     Compare ({comparison.selectedCount})
 *   </button>
 * )}
 */

interface ValidationResult {
  canCompare: boolean;
  reason?: string;
  comparisonType: 'same-type' | 'universal-sections' | 'not-allowed';
  commonSections: any[];
}

export function useComparison() {
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(
    new Set()
  );
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const toggleBusiness = useCallback((businessId: string) => {
    setSelectedBusinesses(prev => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }
      
      // Validate if 2+ selected
      if (next.size >= 2) {
        validateComparison(Array.from(next));
      } else {
        setValidation(null);
      }
      
      return next;
    });
  }, []);

  const validateComparison = useCallback(async (businessIds: string[]) => {
    try {
      setValidating(true);
      const response = await fetch('/api/compare/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidation(result);
      } else {
        const error = await response.json();
        setValidation({
          canCompare: false,
          reason: error.detail || error.error,
          comparisonType: 'not-allowed',
          commonSections: [],
        });
      }
    } catch (err: any) {
      setValidation({
        canCompare: false,
        reason: err.message,
        comparisonType: 'not-allowed',
        commonSections: [],
      });
    } finally {
      setValidating(false);
    }
  }, []);

  const isSelected = useCallback(
    (businessId: string) => selectedBusinesses.has(businessId),
    [selectedBusinesses]
  );

  const clear = useCallback(() => {
    setSelectedBusinesses(new Set());
    setValidation(null);
  }, []);

  const getComparisonUrl = useCallback((sectionIds?: string[]) => {
    const businessIds = Array.from(selectedBusinesses).join(',');
    const params = new URLSearchParams({ businesses: businessIds });
    if (sectionIds && sectionIds.length > 0) {
      params.set('sections', sectionIds.join(','));
    }
    return `/compare?${params.toString()}`;
  }, [selectedBusinesses]);

  const openComparison = useCallback((sectionIds?: string[]) => {
    const url = getComparisonUrl(sectionIds);
    window.open(url, '_blank');
  }, [getComparisonUrl]);

  return {
    selectedBusinesses: Array.from(selectedBusinesses),
    selectedCount: selectedBusinesses.size,
    toggleBusiness,
    isSelected,
    clear,
    getComparisonUrl,
    openComparison,
    canCompare: validation?.canCompare ?? false,
    comparisonType: validation?.comparisonType,
    validationError: validation?.reason,
    commonSections: validation?.commonSections ?? [],
    validating,
  };
}
