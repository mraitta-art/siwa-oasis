'use client';

import { useState } from 'react';
import ComparisonTable from './ComparisonTable';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComparisonModal({ isOpen, onClose }: ComparisonModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-8">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Compare Businesses</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-light"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {selectedIds.length > 0 ? (
              <ComparisonTable
                businessIds={selectedIds}
                onClose={onClose}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No businesses selected for comparison
                </p>
                <button
                  onClick={onClose}
                  className="text-amber-600 hover:text-amber-800 font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
