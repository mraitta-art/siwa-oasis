'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ComparisonField {
  label: string;
  value: any;
  rawValue: any;
  type: string;
  isSearchable?: boolean;
}

interface ComparisonSection {
  name: string;
  icon?: string;
  fields: Record<string, ComparisonField>;
}

interface ComparisonBusiness {
  id: string;
  name: string;
  typeName: string;
  typeIcon: string;
  sections: Record<string, ComparisonSection>;
}

interface ComparisonTableProps {
  businessIds: string[];
  sectionIds?: string[];
  onClose?: () => void;
  className?: string;
}

export default function ComparisonTable({
  businessIds,
  sectionIds,
  onClose,
  className = '',
}: ComparisonTableProps) {
  const [businesses, setBusinesses] = useState<ComparisonBusiness[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonType, setComparisonType] = useState<string>('');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/compare/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessIds,
            sectionIds: sectionIds || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch comparison');
        }

        const data = await response.json();
        setBusinesses(data.businesses);
        setSections(data.sections);
        setComparisonType(data.comparisonType || '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (businessIds.length > 0) {
      fetchComparison();
    }
  }, [businessIds, sectionIds]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-red-800 font-semibold mb-2">Comparison Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-600">No businesses available for comparison</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Compare {businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}
          </h2>
          {comparisonType === 'universal-sections' && (
            <p className="text-sm text-amber-700 mt-2">
              📌 Comparing different business types — showing universal sections only (Vibe, Experience, Investment Opportunity)
            </p>
          )}
          {comparisonType === 'same-type' && (
            <p className="text-sm text-blue-700 mt-2">
              ✓ Same business type — comparing all available sections
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Business Cards Header */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          <div className="w-48 flex-shrink-0"></div>
          {businesses.map(biz => (
            <div
              key={biz.id}
              className="w-80 flex-shrink-0 bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg p-4 border-2 border-amber-200"
            >
              <div className="flex items-center gap-3 mb-3">
                {biz.typeIcon && (
                  <img
                    src={biz.typeIcon}
                    alt={biz.typeName}
                    className="w-8 h-8 rounded"
                  />
                )}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{biz.name}</h3>
                  <p className="text-xs text-gray-600">{biz.typeName}</p>
                </div>
              </div>
              <Link
                href={`/business/${biz.id}`}
                target="_blank"
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold"
              >
                View Full Profile →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map(section => {
          // Check if any business has data for this section
          const hasData = businesses.some(biz => {
            const sectionData = biz.sections[section.id];
            return sectionData && Object.keys(sectionData.fields).length > 0;
          });

          if (!hasData) return null;

          // Get all unique field names in this section
          const allFields = new Set<string>();
          businesses.forEach(biz => {
            const sectionData = biz.sections[section.id];
            if (sectionData) {
              Object.keys(sectionData.fields).forEach(field =>
                allFields.add(field)
              );
            }
          });

          return (
            <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                {section.icon && (
                  <span className="text-2xl">{section.icon}</span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {Array.from(allFields).map(fieldName => (
                      <tr
                        key={fieldName}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        {/* Field Label */}
                        <td className="w-48 px-6 py-4 bg-gray-50 font-semibold text-gray-900 text-sm sticky left-0 z-10">
                          {businesses[0].sections[section.id]?.fields[fieldName]
                            ?.label || fieldName}
                        </td>

                        {/* Business Values */}
                        {businesses.map(biz => {
                          const field = biz.sections[section.id]?.fields[fieldName];
                          return (
                            <td
                              key={`${biz.id}-${fieldName}`}
                              className="w-80 px-6 py-4 text-sm text-gray-700"
                            >
                              {field ? (
                                <div className="flex items-center gap-2">
                                  <span className="break-words">
                                    {typeof field.value === 'string' &&
                                    field.value.startsWith('http') ? (
                                      <a
                                        href={field.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {new URL(field.value).hostname}
                                      </a>
                                    ) : (
                                      field.value
                                    )}
                                  </span>
                                  {field.isSearchable && (
                                    <span
                                      className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                      title="Searchable field"
                                    >
                                      🔍
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-gray-600">
          💡 Use this comparison to help visitors make informed decisions. Fields marked with 🔍 are
          searchable and filterable.
        </p>
      </div>
    </div>
  );
}
