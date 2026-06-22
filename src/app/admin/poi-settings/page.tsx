'use client';

import Link from 'next/link';
import { useState } from 'react';

interface VendorPermission {
  business_id: string;
  business_name: string;
  can_create_packages: boolean;
  can_create_offers: boolean;
  can_create_discounts: boolean;
  packages_limit: number;
  offers_limit: number;
  discounts_limit: number;
  requires_approval: boolean;
  status: 'active' | 'suspended';
}

export default function AdminPOISettingsPage() {
  const [globalSettings, setGlobalSettings] = useState({
    vendors_can_create_packages: false,
    vendors_can_create_offers: true,
    vendors_can_create_discounts: false,
    default_packages_limit: 20,
    default_offers_limit: 50,
    default_discounts_limit: 50,
    packages_require_approval: true,
    offers_require_approval: false,
    discounts_require_approval: true,
    show_savings_percentage: true,
    show_original_price: true,
    highlight_featured_deals: true,
    max_featured_count: 5,
    notify_admin_on_new_vendor_package: true,
    notify_customer_on_offer: false,
  });

  const [vendorPermissions, setVendorPermissions] = useState<VendorPermission[]>([
    {
      business_id: '1',
      business_name: 'Desert Tours Co',
      can_create_packages: true,
      can_create_offers: true,
      can_create_discounts: false,
      packages_limit: 20,
      offers_limit: 50,
      discounts_limit: 0,
      requires_approval: true,
      status: 'active',
    },
    {
      business_id: '2',
      business_name: 'Siwa Palace Hotel',
      can_create_packages: true,
      can_create_offers: true,
      can_create_discounts: false,
      packages_limit: 30,
      offers_limit: 100,
      discounts_limit: 0,
      requires_approval: true,
      status: 'active',
    },
    {
      business_id: '3',
      business_name: 'Restaurant Siwa',
      can_create_packages: false,
      can_create_offers: true,
      can_create_discounts: false,
      packages_limit: 0,
      offers_limit: 50,
      discounts_limit: 0,
      requires_approval: false,
      status: 'active',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'global' | 'vendor'>('global');
  const [editingVendor, setEditingVendor] = useState<string | null>(null);

  const handleGlobalChange = (key: string, value: any) => {
    setGlobalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-400 hover:text-[#D4AF37] transition-colors mb-4 block">
            ← Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Packages & Offers Settings</h1>
          <p className="text-gray-400">Configure global settings and vendor permissions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'global'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌍 Global Settings
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'vendor'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Vendor Permissions
          </button>
        </div>

        {/* Global Settings */}
        {activeTab === 'global' && (
          <div className="space-y-8">
            {/* Vendor Feature Access */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">👥 Vendor Feature Access</h2>
              <p className="text-gray-400 mb-6">Enable/disable features for all vendors (can be overridden per vendor)</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div>
                    <div className="text-white font-semibold">Allow Vendors to Create Packages</div>
                    <div className="text-sm text-gray-400">Product bundles, service packages, combos</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.vendors_can_create_packages}
                      onChange={(e) =>
                        handleGlobalChange('vendors_can_create_packages', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div>
                    <div className="text-white font-semibold">Allow Vendors to Create Offers</div>
                    <div className="text-sm text-gray-400">Discounts, promotions, special deals</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.vendors_can_create_offers}
                      onChange={(e) =>
                        handleGlobalChange('vendors_can_create_offers', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div>
                    <div className="text-white font-semibold">Allow Vendors to Create Discounts</div>
                    <div className="text-sm text-gray-400">System-wide or targeted discounts</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.vendors_can_create_discounts}
                      onChange={(e) =>
                        handleGlobalChange('vendors_can_create_discounts', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Default Limits */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Default Limits per Vendor</h2>
              <p className="text-gray-400 mb-6">These limits apply by default unless overridden per vendor</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Default Package Limit</label>
                  <input
                    type="number"
                    value={globalSettings.default_packages_limit}
                    onChange={(e) =>
                      handleGlobalChange('default_packages_limit', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="text-xs text-gray-500 mt-1">packages per vendor</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Default Offer Limit</label>
                  <input
                    type="number"
                    value={globalSettings.default_offers_limit}
                    onChange={(e) =>
                      handleGlobalChange('default_offers_limit', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="text-xs text-gray-500 mt-1">offers per vendor</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Default Discount Limit</label>
                  <input
                    type="number"
                    value={globalSettings.default_discounts_limit}
                    onChange={(e) =>
                      handleGlobalChange('default_discounts_limit', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="text-xs text-gray-500 mt-1">discounts per vendor</div>
                </div>
              </div>
            </div>

            {/* Approval Settings */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">✓ Approval Requirements</h2>
              <p className="text-gray-400 mb-6">Require admin approval before items go live</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Packages Require Approval</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.packages_require_approval}
                      onChange={(e) =>
                        handleGlobalChange('packages_require_approval', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Offers Require Approval</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.offers_require_approval}
                      onChange={(e) =>
                        handleGlobalChange('offers_require_approval', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Discounts Require Approval</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.discounts_require_approval}
                      onChange={(e) =>
                        handleGlobalChange('discounts_require_approval', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🎨 Display Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Show Savings Percentage</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.show_savings_percentage}
                      onChange={(e) =>
                        handleGlobalChange('show_savings_percentage', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Show Original Price (Strikethrough)</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.show_original_price}
                      onChange={(e) =>
                        handleGlobalChange('show_original_price', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                  <div className="text-white font-semibold">Highlight Featured Deals</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.highlight_featured_deals}
                      onChange={(e) =>
                        handleGlobalChange('highlight_featured_deals', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#D4AF37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#556B2F]"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Max Featured Deals to Show</label>
                  <input
                    type="number"
                    value={globalSettings.max_featured_count}
                    onChange={(e) =>
                      handleGlobalChange('max_featured_count', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button className="px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity w-full">
              💾 Save Global Settings
            </button>
          </div>
        )}

        {/* Vendor Permissions */}
        {activeTab === 'vendor' && (
          <div>
            <div className="mb-6">
              <p className="text-gray-400 mb-4">Override default permissions for individual vendors</p>
            </div>

            <div className="space-y-4">
              {vendorPermissions.map((vendor) => (
                <div
                  key={vendor.business_id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors"
                >
                  {editingVendor === vendor.business_id ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                          <input
                            type="checkbox"
                            checked={vendor.can_create_packages}
                            onChange={(e) => {
                              const updated = vendorPermissions.map((v) =>
                                v.business_id === vendor.business_id
                                  ? { ...v, can_create_packages: e.target.checked }
                                  : v
                              );
                              setVendorPermissions(updated);
                            }}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-white text-sm font-semibold">Create Packages</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                          <input
                            type="checkbox"
                            checked={vendor.can_create_offers}
                            onChange={(e) => {
                              const updated = vendorPermissions.map((v) =>
                                v.business_id === vendor.business_id
                                  ? { ...v, can_create_offers: e.target.checked }
                                  : v
                              );
                              setVendorPermissions(updated);
                            }}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-white text-sm font-semibold">Create Offers</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 bg-gray-800 rounded">
                          <input
                            type="checkbox"
                            checked={vendor.can_create_discounts}
                            onChange={(e) => {
                              const updated = vendorPermissions.map((v) =>
                                v.business_id === vendor.business_id
                                  ? { ...v, can_create_discounts: e.target.checked }
                                  : v
                              );
                              setVendorPermissions(updated);
                            }}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          <span className="text-white text-sm font-semibold">Create Discounts</span>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditingVendor(null)}
                          className="px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => setEditingVendor(null)}
                          className="px-4 py-2 bg-gray-800 rounded text-white font-semibold hover:bg-gray-700 transition-colors"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{vendor.business_name}</h3>
                          <div className="flex gap-4 text-sm">
                            {vendor.can_create_packages && (
                              <span className="text-green-400">✓ Packages</span>
                            )}
                            {vendor.can_create_offers && (
                              <span className="text-green-400">✓ Offers</span>
                            )}
                            {vendor.can_create_discounts && (
                              <span className="text-green-400">✓ Discounts</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded font-semibold text-sm ${
                            vendor.status === 'active'
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>

                      <button
                        onClick={() => setEditingVendor(vendor.business_id)}
                        className="px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        ✏️ Edit Permissions
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
