'use client';

import { useComparison } from '@/lib/hooks/useComparison';

interface ComparisonCheckboxProps {
  businessId: string;
  businessName?: string;
  className?: string;
}

/**
 * ComparisonCheckbox
 * Add to any business card/result to enable comparison selection
 * 
 * Usage in search results:
 * const comparison = useComparison();
 * <ComparisonCheckbox 
 *   businessId={business.id} 
 *   businessName={business.name}
 * />
 */
export function ComparisonCheckbox({
  businessId,
  businessName,
  className = '',
}: ComparisonCheckboxProps) {
  const comparison = useComparison();

  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={comparison.isSelected(businessId)}
        onChange={() => comparison.toggleBusiness(businessId)}
        className="w-5 h-5 text-amber-600 rounded cursor-pointer"
      />
      <span className="text-sm text-gray-600">
        Compare {businessName ? `"${businessName}"` : ''}
      </span>
    </label>
  );
}

interface ComparisonBarProps {
  className?: string;
  onCompare?: (url: string) => void;
}

/**
 * ComparisonBar
 * Sticky bar showing selected businesses and comparison button
 * Add to search results page
 * 
 * Handles:
 * - Same type comparison (all sections)
 * - Mixed type comparison (universal sections only)
 * - Validation errors
 * 
 * Usage:
 * <ComparisonBar 
 *   onCompare={(url) => window.open(url, '_blank')}
 * />
 */
export function ComparisonBar({ className = '', onCompare }: ComparisonBarProps) {
  const comparison = useComparison();

  if (comparison.selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-600 to-amber-500 shadow-2xl p-4 z-40 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Selection Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-white font-semibold whitespace-nowrap">
            {comparison.selectedCount} {comparison.selectedCount === 1 ? 'business' : 'businesses'}{' '}
            selected
          </span>
          <div className="flex gap-2 overflow-x-auto flex-1">
            {comparison.selectedBusinesses.slice(0, 3).map(id => (
              <span
                key={id}
                className="inline-block px-3 py-1 bg-amber-700 text-white text-xs rounded-full whitespace-nowrap"
              >
                {id.slice(0, 8)}...
              </span>
            ))}
            {comparison.selectedBusinesses.length > 3 && (
              <span className="inline-block px-3 py-1 bg-amber-700 text-white text-xs rounded-full">
                +{comparison.selectedBusinesses.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-3 items-center">
          {/* Validation Status */}
          {comparison.selectedCount >= 2 && (
            <>
              {comparison.validating && (
                <span className="text-white text-sm">Validating...</span>
              )}
              
              {comparison.validationError && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded text-red-700 text-xs max-w-xs">
                  <span>⚠️</span>
                  <span className="truncate">{comparison.validationError}</span>
                </div>
              )}
              
              {comparison.comparisonType === 'same-type' && (
                <span className="text-white text-xs bg-amber-700 px-2 py-1 rounded">
                  Same type
                </span>
              )}
              
              {comparison.comparisonType === 'universal-sections' && (
                <span className="text-white text-xs bg-amber-700 px-2 py-1 rounded">
                  Universal sections only
                </span>
              )}
            </>
          )}

          {/* Buttons */}
          <button
            onClick={comparison.clear}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded font-semibold transition"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const url = comparison.getComparisonUrl();
              if (onCompare) {
                onCompare(url);
              } else {
                window.open(url, '_blank');
              }
            }}
            disabled={!comparison.canCompare || comparison.validating}
            className="px-6 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-amber-600 font-bold rounded transition"
          >
            Compare Now
          </button>
        </div>
      </div>
    </div>
  );
}
