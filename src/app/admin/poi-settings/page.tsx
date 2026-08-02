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
    { business_id: '1', business_name: 'Desert Tours Co',   can_create_packages: true,  can_create_offers: true, can_create_discounts: false, packages_limit: 20, offers_limit: 50, discounts_limit: 0, requires_approval: true,  status: 'active' },
    { business_id: '2', business_name: 'Siwa Palace Hotel', can_create_packages: true,  can_create_offers: true, can_create_discounts: false, packages_limit: 30, offers_limit: 100, discounts_limit: 0, requires_approval: true, status: 'active' },
    { business_id: '3', business_name: 'Restaurant Siwa',  can_create_packages: false, can_create_offers: true, can_create_discounts: false, packages_limit: 0,  offers_limit: 50, discounts_limit: 0, requires_approval: false, status: 'active' },
  ]);

  const [activeTab, setActiveTab] = useState<'global' | 'vendor'>('global');
  const [editingVendor, setEditingVendor] = useState<string | null>(null);

  const handleGlobalChange = (key: string, value: any) => {
    setGlobalSettings((prev) => ({ ...prev, [key]: value }));
  };

  /* Reusable toggle row */
  const ToggleRow = ({ label, subLabel, settingKey }: { label: string; subLabel?: string; settingKey: keyof typeof globalSettings }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
      <div>
        <div className="text-slate-800 font-extrabold text-sm">{label}</div>
        {subLabel && <div className="text-xs text-slate-400 font-semibold mt-0.5">{subLabel}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={globalSettings[settingKey] as boolean}
          onChange={(e) => handleGlobalChange(settingKey, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition mb-3 block">
            ← Control Center
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <span className="text-[#D4AF37]">⚙️</span> Packages &amp; Offers Settings
          </h1>
          <p className="text-slate-400 text-sm font-semibold">Configure global settings and vendor permissions for all businesses</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
          {(['global', 'vendor'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 font-bold text-sm rounded-xl transition ${
                activeTab === tab
                  ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'global' ? '🌍 Global Settings' : '👥 Vendor Permissions'}
            </button>
          ))}
        </div>

        {/* ── GLOBAL SETTINGS ── */}
        {activeTab === 'global' && (
          <div className="space-y-6">

            {/* Vendor Feature Access */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">👥 Vendor Feature Access</h2>
              <p className="text-slate-400 text-sm font-semibold mb-6">Enable or disable features for all vendors (can be overridden per vendor)</p>
              <div className="space-y-3">
                <ToggleRow settingKey="vendors_can_create_packages" label="Allow Vendors to Create Packages" subLabel="Product bundles, service packages, combos" />
                <ToggleRow settingKey="vendors_can_create_offers"   label="Allow Vendors to Create Offers"   subLabel="Discounts, promotions, special deals" />
                <ToggleRow settingKey="vendors_can_create_discounts" label="Allow Vendors to Create Discounts" subLabel="System-wide or targeted discounts" />
              </div>
            </div>

            {/* Default Limits */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">📊 Default Limits per Vendor</h2>
              <p className="text-slate-400 text-sm font-semibold mb-6">These limits apply by default unless overridden per vendor</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'default_packages_limit',  label: 'Default Package Limit',  unit: 'packages per vendor' },
                  { key: 'default_offers_limit',    label: 'Default Offer Limit',    unit: 'offers per vendor' },
                  { key: 'default_discounts_limit', label: 'Default Discount Limit', unit: 'discounts per vendor' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{f.label}</label>
                    <input
                      type="number"
                      value={(globalSettings as any)[f.key]}
                      onChange={(e) => handleGlobalChange(f.key, parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50"
                    />
                    <div className="text-xs text-slate-400 font-semibold mt-1">{f.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Settings */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">✅ Approval Requirements</h2>
              <p className="text-slate-400 text-sm font-semibold mb-6">Require admin approval before items go live</p>
              <div className="space-y-3">
                <ToggleRow settingKey="packages_require_approval"  label="Packages Require Approval" />
                <ToggleRow settingKey="offers_require_approval"    label="Offers Require Approval" />
                <ToggleRow settingKey="discounts_require_approval" label="Discounts Require Approval" />
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-800 mb-1">🎨 Display Settings</h2>
              <div className="space-y-3 mt-4">
                <ToggleRow settingKey="show_savings_percentage"    label="Show Savings Percentage" />
                <ToggleRow settingKey="show_original_price"        label="Show Original Price (Strikethrough)" />
                <ToggleRow settingKey="highlight_featured_deals"   label="Highlight Featured Deals" />
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Featured Deals to Show</label>
                  <input
                    type="number"
                    value={globalSettings.max_featured_count}
                    onChange={(e) => handleGlobalChange('max_featured_count', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50"
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <button className="px-8 py-3 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition shadow-sm w-full">
              💾 Save Global Settings
            </button>
          </div>
        )}

        {/* ── VENDOR PERMISSIONS ── */}
        {activeTab === 'vendor' && (
          <div>
            <p className="text-slate-400 text-sm font-semibold mb-6">Override default permissions for individual vendors</p>
            <div className="space-y-4">
              {vendorPermissions.map((vendor) => (
                <div
                  key={vendor.business_id}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:border-amber-200 transition"
                >
                  {editingVendor === vendor.business_id ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        {[
                          { key: 'can_create_packages',  label: 'Create Packages' },
                          { key: 'can_create_offers',    label: 'Create Offers' },
                          { key: 'can_create_discounts', label: 'Create Discounts' },
                        ].map(f => (
                          <label key={f.key} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(vendor as any)[f.key]}
                              onChange={(e) => {
                                setVendorPermissions(vendorPermissions.map(v =>
                                  v.business_id === vendor.business_id ? { ...v, [f.key]: e.target.checked } : v
                                ));
                              }}
                              className="w-4 h-4 accent-[#D4AF37]"
                            />
                            <span className="text-slate-700 text-sm font-semibold">{f.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditingVendor(null)}
                          className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-600 rounded-2xl text-white font-bold transition text-sm"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => setEditingVendor(null)}
                          className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition text-sm"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 mb-2">{vendor.business_name}</h3>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {vendor.can_create_packages  && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">✓ Packages</span>}
                            {vendor.can_create_offers    && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">✓ Offers</span>}
                            {vendor.can_create_discounts && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">✓ Discounts</span>}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-xl font-bold text-xs border ${
                          vendor.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50'
                            : 'bg-rose-50 text-rose-600 border-rose-200/50'
                        }`}>
                          {vendor.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingVendor(vendor.business_id)}
                        className="px-5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-700 font-bold transition text-sm"
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
