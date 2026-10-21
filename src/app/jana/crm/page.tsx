'use client';

import React, { useEffect, useState } from 'react';

interface CRMContact {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  phone_international: boolean;
  whatsapp_opt_in: boolean;
}

interface CRMGroup {
  id: string;
  name: string;
  description: string | null;
}

interface CRMMember {
  group_id: string;
  member_type: 'contact' | 'business';
  member_id: string;
  contact_name?: string;
  business_name?: string;
  whatsapp_opt_in?: boolean;
}

interface CRMAnnouncement {
  id: string;
  group_id: string;
  group_name: string;
  kind: 'ribbon' | 'news';
  title_ar: string;
  body_ar: string;
  status: 'published' | 'archived';
  published_at: string;
}

interface CRMCampaign {
  id: string;
  group_id: string;
  group_name: string;
  status: 'queued' | 'sending' | 'sent' | 'partial' | 'failed';
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  skipped_count: number;
  pending_count: number;
  created_at: string;
}

interface ImportedContact {
  full_name: string;
  phone: string;
  email?: string;
  whatsapp_opt_in?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.8rem',
  border: '1px solid #cbd5e1',
  borderRadius: 9,
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

function parseCsv(text: string): ImportedContact[] {
  const rows: string[][] = [];
  const input = text.replace(/^\uFEFF/, '');
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(value => value)) rows.push(row);
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one contact.');

  const headers = rows[0].map(value => value.toLowerCase().replace(/[\s-]+/g, '_'));
  const findColumn = (names: string[]) => headers.findIndex(header => names.includes(header));
  const nameIndex = findColumn(['name', 'full_name', 'contact_name', 'الاسم']);
  const phoneIndex = findColumn(['phone', 'mobile', 'whatsapp', 'telephone', 'phone_number', 'الهاتف', 'الموبايل']);
  const emailIndex = findColumn(['email', 'email_address', 'البريد_الإلكتروني']);
  const optInIndex = findColumn(['whatsapp_opt_in', 'opt_in', 'consent', 'whatsapp_consent']);
  if (nameIndex < 0 || phoneIndex < 0) {
    throw new Error('CSV headers must include a name and phone/mobile column.');
  }

  const isTrue = (value: string) => ['true', 'yes', '1', 'y', 'نعم', 'موافق'].includes(value.trim().toLowerCase());
  return rows.slice(1).map(values => ({
    full_name: values[nameIndex] || '',
    phone: values[phoneIndex] || '',
    email: emailIndex >= 0 ? values[emailIndex] || '' : undefined,
    whatsapp_opt_in: optInIndex >= 0 ? isTrue(values[optInIndex] || '') : false,
  }));
}

function parseVCard(text: string): ImportedContact[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  if (!cards.length) throw new Error('No vCard contacts were found.');
  return cards.map(card => {
    const fields = card.split(/\r?\n/);
    const valueFor = (key: string) => {
      const line = fields.find(item => item.toUpperCase().startsWith(`${key}:`) || item.toUpperCase().startsWith(`${key};`));
      if (!line) return '';
      const separator = line.indexOf(':');
      return separator >= 0 ? line.slice(separator + 1).replace(/^tel:/i, '').trim() : '';
    };
    const name = valueFor('FN') || valueFor('N').split(';').filter(Boolean).reverse().join(' ');
    const phone = valueFor('TEL');
    const email = valueFor('EMAIL');
    const optInValue = valueFor('X-WHATSAPP-OPT-IN').toLowerCase();
    return {
      full_name: name,
      phone,
      email: email || undefined,
      whatsapp_opt_in: ['true', 'yes', '1'].includes(optInValue),
    };
  }).filter(contact => contact.full_name || contact.phone);
}

export default function AdminCRMPage() {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [groups, setGroups] = useState<CRMGroup[]>([]);
  const [members, setMembers] = useState<CRMMember[]>([]);
  const [businesses, setBusinesses] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [announcements, setAnnouncements] = useState<CRMAnnouncement[]>([]);
  const [campaigns, setCampaigns] = useState<CRMCampaign[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [memberType, setMemberType] = useState<'contact' | 'business'>('contact');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [campaignText, setCampaignText] = useState('');
  const [announcementKind, setAnnouncementKind] = useState<'ribbon' | 'news'>('ribbon');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [ctaTextAr, setCtaTextAr] = useState('');
  const [ctaTextEn, setCtaTextEn] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [importPreview, setImportPreview] = useState<ImportedContact[]>([]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  async function loadData() {
    const [crmResponse, campaignsResponse] = await Promise.all([
      fetch('/api/jana/crm'),
      fetch('/api/jana/crm/campaigns'),
    ]);
    const crmData = await crmResponse.json();
    const campaignData = await campaignsResponse.json();
    if (!crmResponse.ok) throw new Error(crmData.error || 'Unable to load CRM data.');
    if (!campaignsResponse.ok) throw new Error(campaignData.error || 'Unable to load WhatsApp campaigns.');
    setContacts(crmData.contacts || []);
    setGroups(crmData.groups || []);
    setMembers(crmData.members || []);
    setBusinesses(crmData.businesses || []);
    setAnnouncements(crmData.announcements || []);
    setCampaigns(campaignData.campaigns || []);
    setSelectedGroupId(current => current && (crmData.groups || []).some((group: CRMGroup) => group.id === current)
      ? current
      : crmData.groups?.[0]?.id || '');
  }

  useEffect(() => {
    loadData()
      .catch(error => setMessage(error.message || 'Unable to load CRM.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const current = members
      .filter(member => member.group_id === selectedGroupId && member.member_type === memberType)
      .map(member => member.member_id);
    setSelectedMemberIds(current);
  }, [members, selectedGroupId, memberType]);

  useEffect(() => {
    const group = groups.find(item => item.id === selectedGroupId);
    setEditGroupName(group?.name || '');
    setEditGroupDescription(group?.description || '');
  }, [groups, selectedGroupId]);

  async function post(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The request failed.');
    return data;
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = file.name.toLowerCase().endsWith('.vcf') || file.type.includes('vcard')
        ? parseVCard(text)
        : parseCsv(text);
      setImportPreview(rows);
      setMessage(`${rows.length} contacts ready to review. Opt-in is disabled unless explicitly confirmed and recorded.`);
    } catch (error: any) {
      setMessage(error.message || 'Unable to parse this contact file.');
    }
  }

  async function submitImport() {
    setSaving(true);
    setMessage('');
    try {
      const result = await post('/api/jana/crm', {
        action: 'import_contacts',
        contacts: importPreview.map(contact => ({
          ...contact,
          whatsapp_opt_in: consentConfirmed && contact.whatsapp_opt_in === true,
        })),
      });
      const rejectedCount = result.rejected?.length || 0;
      const rejectionDetails = (result.rejected || [])
        .slice(0, 3)
        .map((item: { index: number; reason: string }) => `Row ${item.index + 2}: ${item.reason}`)
        .join(' ');
      setMessage(`${result.imported} contacts imported; ${rejectedCount} rows rejected.${rejectionDetails ? ` ${rejectionDetails}` : ''}`);
      setImportPreview([]);
      setConsentConfirmed(false);
      await loadData();
    } catch (error: any) {
      setMessage(error.message || 'Import failed.');
    } finally {
      setSaving(false);
    }
  }

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await post('/api/jana/crm', {
        action: 'save_group',
        name: groupName,
        description: groupDescription,
      });
      setGroupName('');
      setGroupDescription('');
      await loadData();
      setSelectedGroupId(result.id);
      setMessage('Group created.');
    } catch (error: any) {
      setMessage(error.message || 'Could not create group.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMembership() {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await post('/api/jana/crm', {
        action: 'set_members',
        groupId: selectedGroupId,
        memberType,
        memberIds: selectedMemberIds,
      });
      await loadData();
      setMessage('Group membership saved.');
    } catch (error: any) {
      setMessage(error.message || 'Could not save group membership.');
    } finally {
      setSaving(false);
    }
  }

  async function updateGroup() {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await post('/api/jana/crm', {
        action: 'update_group',
        id: selectedGroupId,
        name: editGroupName,
        description: editGroupDescription,
      });
      await loadData();
      setMessage('Group details updated.');
    } catch (error: any) {
      setMessage(error.message || 'Could not update group.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup() {
    if (!selectedGroupId || !window.confirm(`Delete ${selectedGroup?.name || 'this group'}? Groups with campaign or announcement history cannot be removed.`)) return;
    setSaving(true);
    try {
      await post('/api/jana/crm', { action: 'delete_group', groupId: selectedGroupId });
      setSelectedGroupId('');
      await loadData();
      setMessage('Group deleted.');
    } catch (error: any) {
      setMessage(error.message || 'Could not delete group.');
    } finally {
      setSaving(false);
    }
  }

  async function setOptIn(contact: CRMContact, optedIn: boolean) {
    try {
      await post('/api/jana/crm', {
        action: 'set_contact_opt_in',
        contactId: contact.id,
        optedIn,
      });
      await loadData();
      setMessage(`WhatsApp opt-in ${optedIn ? 'enabled' : 'revoked'} for ${contact.full_name}.`);
    } catch (error: any) {
      setMessage(error.message || 'Could not update WhatsApp consent.');
    }
  }

  async function createCampaign() {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      const result = await post('/api/jana/crm/campaigns', {
        action: 'create',
        groupId: selectedGroupId,
        messageText: campaignText,
      });
      setCampaignText('');
      await loadData();
      setMessage(`Campaign queued for ${result.recipientCount} opted-in contacts. Send it in tracked batches from the campaign list.`);
    } catch (error: any) {
      setMessage(error.message || 'Could not queue campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaignBatch(campaignId: string) {
    setSaving(true);
    try {
      const result = await post('/api/jana/crm/campaigns', { action: 'send_batch', campaignId });
      await loadData();
      setMessage(`Batch attempted: ${result.batchSucceeded}/${result.attempted} accepted by Meta. ${result.queued} queued; ${result.failed} failed.`);
    } catch (error: any) {
      setMessage(error.message || 'Could not send campaign batch.');
    } finally {
      setSaving(false);
    }
  }

  async function publishAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      await post('/api/jana/crm', {
        action: 'publish_announcement',
        groupId: selectedGroupId,
        kind: announcementKind,
        titleAr,
        titleEn,
        bodyAr,
        bodyEn,
        ctaTextAr,
        ctaTextEn,
        ctaUrl,
        expiresAt: expiresAt || null,
      });
      setTitleAr('');
      setTitleEn('');
      setBodyAr('');
      setBodyEn('');
      setCtaTextAr('');
      setCtaTextEn('');
      setCtaUrl('');
      setExpiresAt('');
      await loadData();
      setMessage(`${announcementKind === 'ribbon' ? 'Ribbon' : 'News'} published to vendor members of this group.`);
    } catch (error: any) {
      setMessage(error.message || 'Could not publish announcement.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveAnnouncement(id: string) {
    try {
      await post('/api/jana/crm', { action: 'archive_announcement', announcementId: id });
      await loadData();
      setMessage('Announcement archived.');
    } catch (error: any) {
      setMessage(error.message || 'Could not archive announcement.');
    }
  }

  const groupBusinessIds = members
    .filter(member => member.group_id === selectedGroupId && member.member_type === 'business')
    .map(member => member.member_id);
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading admin CRM…</div>;

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem', color: '#0f172a' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <div style={{ color: '#a16207', fontSize: '0.72rem', fontWeight: 900, letterSpacing: 2 }}>ADMIN CONTACTS · AUDIENCES · OUTREACH</div>
        <h1 style={{ margin: '0.3rem 0', fontSize: '1.65rem' }}>CRM Groups & Messaging</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Import contacts exported from your phone, create separate contact/vendor audiences, and track approved WhatsApp sends and vendor-dashboard notices.</p>
      </header>

      {message && (
        <div role="status" style={{ padding: '0.8rem 1rem', marginBottom: '1rem', borderRadius: 10, background: '#eff6ff', color: '#1e3a8a' }}>
          {message}
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(340px, 1.2fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>Import phone contacts</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 0 }}>
            Export contacts from your mobile phone as .vcf or .csv, then choose the file here. Use international phone format (+country code) for WhatsApp.
          </p>
          <input
            type="file"
            accept=".csv,.vcf,text/csv,text/vcard"
            onChange={event => importFile(event.target.files?.[0])}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#92400e', background: '#fffbeb', padding: '0.65rem', borderRadius: 8 }}>
            Imported contacts are not WhatsApp opted-in by default. Only mark opt-in for contacts with recorded consent.
          </p>
          {importPreview.length > 0 && (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Preview: {importPreview.length} contacts</div>
              <div style={{ maxHeight: 130, overflow: 'auto', fontSize: '0.75rem', marginBottom: '0.7rem' }}>
                {importPreview.slice(0, 8).map((contact, index) => (
                  <div key={`${contact.phone}-${index}`} style={{ padding: '0.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    {contact.full_name || 'Missing name'} · {contact.phone || 'Missing phone'} {contact.whatsapp_opt_in ? '· opted-in in file' : ''}
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.76rem', margin: '0.75rem 0' }}>
                <input type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} />
                I confirm every imported opt-in flag reflects recorded WhatsApp consent.
              </label>
              <button disabled={saving} onClick={submitImport} style={primaryButton}>
                {saving ? 'Importing…' : 'Import contacts'}
              </button>
            </>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.7rem', fontSize: '1.05rem' }}>Create a saved group</h2>
          <form onSubmit={createGroup} style={{ display: 'grid', gap: '0.65rem' }}>
            <input style={inputStyle} placeholder="Group name" value={groupName} onChange={event => setGroupName(event.target.value)} required maxLength={160} />
            <input style={inputStyle} placeholder="Purpose (optional)" value={groupDescription} onChange={event => setGroupDescription(event.target.value)} maxLength={500} />
            <button disabled={saving} style={primaryButton}>{saving ? 'Saving…' : 'Create group'}</button>
          </form>
          <h3 style={{ fontSize: '0.9rem', margin: '1.1rem 0 0.45rem' }}>Groups ({groups.length})</h3>
          <div style={{ display: 'grid', gap: '0.4rem', maxHeight: 180, overflow: 'auto' }}>
            {groups.map(group => {
              const contactCount = members.filter(member => member.group_id === group.id && member.member_type === 'contact').length;
              const vendorCount = members.filter(member => member.group_id === group.id && member.member_type === 'business').length;
              return (
                <button key={group.id} onClick={() => setSelectedGroupId(group.id)} style={{
                  textAlign: 'left', padding: '0.55rem 0.7rem', borderRadius: 8,
                  border: `1px solid ${selectedGroupId === group.id ? '#d4af37' : '#e2e8f0'}`,
                  background: selectedGroupId === group.id ? '#fffbeb' : '#fff', cursor: 'pointer',
                }}>
                  <strong>{group.name}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}> · {contactCount} contacts · {vendorCount} vendors</span>
                </button>
              );
            })}
            {groups.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No groups yet.</div>}
          </div>
          {selectedGroup && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.45rem', marginTop: '0.65rem' }}>
              <input style={inputStyle} value={editGroupName} onChange={event => setEditGroupName(event.target.value)} aria-label="Edit group name" />
              <input style={inputStyle} value={editGroupDescription} onChange={event => setEditGroupDescription(event.target.value)} aria-label="Edit group description" />
              <button disabled={saving} onClick={updateGroup} style={secondaryButton}>Save</button>
              <button disabled={saving} onClick={deleteGroup} style={{ ...secondaryButton, color: '#b91c1c' }}>Delete</button>
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Group membership</h2>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{selectedGroup ? `Editing ${selectedGroup.name}` : 'Create or choose a group first.'}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button onClick={() => setMemberType('contact')} style={memberTypeButton(memberType === 'contact')}>Imported contacts</button>
            <button onClick={() => setMemberType('business')} style={memberTypeButton(memberType === 'business')}>Registered vendors</button>
          </div>
        </div>
        {selectedGroup && (
          <>
            <input
              style={{ ...inputStyle, margin: '0.8rem 0' }}
              placeholder={`Filter ${memberType === 'contact' ? 'contacts' : 'vendors'}`}
              value={memberSearch}
              onChange={event => setMemberSearch(event.target.value)}
            />
            <MembershipSelector
              memberType={memberType}
              contacts={contacts}
              businesses={businesses}
              selectedIds={selectedMemberIds}
              search={memberSearch}
              onToggle={id => setSelectedMemberIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.7rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{selectedMemberIds.length} selected</span>
              <button disabled={saving} onClick={saveMembership} style={primaryButton}>Save {memberType} membership</button>
            </div>
          </>
        )}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>WhatsApp group campaign</h2>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 0 }}>
            Sends the text through the approved CRM WhatsApp template, only to opted-in contact members. Campaigns are paced in batches of five.
          </p>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} maxLength={900} value={campaignText} onChange={event => setCampaignText(event.target.value)} placeholder="Message text inserted into the approved template…" />
          <button disabled={saving || !selectedGroupId || !campaignText.trim()} onClick={createCampaign} style={{ ...primaryButton, marginTop: '0.55rem' }}>
            Queue consent-based campaign
          </button>
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.8rem' }}>
            {campaigns.slice(0, 8).map(campaign => (
              <div key={campaign.id} style={{ background: '#f8fafc', borderRadius: 9, padding: '0.65rem', fontSize: '0.76rem' }}>
                <strong>{campaign.group_name}</strong> · {campaign.status} · sent {campaign.sent_count}/{campaign.recipient_count} · delivered {campaign.delivered_count} · read {campaign.read_count} · failed {campaign.failed_count} · skipped {campaign.skipped_count}
                {Number(campaign.pending_count) > 0 && (
                  <button disabled={saving} onClick={() => sendCampaignBatch(campaign.id)} style={{ ...secondaryButton, marginLeft: 8 }}>Send next 5</button>
                )}
              </div>
            ))}
            {campaigns.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Campaign history will appear here.</div>}
          </div>
        </div>

        <form onSubmit={publishAnnouncement} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.55rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Publish to vendor ribbon or news</h2>
          <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>Only registered vendor members of the selected group will see this item in their mobile dashboard.</p>
          <select style={inputStyle} value={announcementKind} onChange={event => setAnnouncementKind(event.target.value as 'ribbon' | 'news')}>
            <option value="ribbon">Dashboard ribbon</option>
            <option value="news">Dashboard news</option>
          </select>
          <input style={inputStyle} placeholder="Arabic title (required)" value={titleAr} onChange={event => setTitleAr(event.target.value)} required maxLength={255} />
          <textarea style={{ ...inputStyle, minHeight: 72 }} placeholder="Arabic message (required)" value={bodyAr} onChange={event => setBodyAr(event.target.value)} required maxLength={10000} />
          <input style={inputStyle} placeholder="English title (optional)" value={titleEn} onChange={event => setTitleEn(event.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="English message (optional)" value={bodyEn} onChange={event => setBodyEn(event.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <input style={inputStyle} placeholder="Arabic CTA label" value={ctaTextAr} onChange={event => setCtaTextAr(event.target.value)} />
            <input style={inputStyle} placeholder="English CTA label" value={ctaTextEn} onChange={event => setCtaTextEn(event.target.value)} />
          </div>
          <input style={inputStyle} placeholder="CTA URL (optional)" value={ctaUrl} onChange={event => setCtaUrl(event.target.value)} />
          <label style={{ fontSize: '0.75rem', color: '#475569' }}>Optional expiry <input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} /></label>
          <button disabled={saving || !groupBusinessIds.length} style={primaryButton}>
            {saving ? 'Publishing…' : `Publish to ${groupBusinessIds.length} vendors`}
          </button>
          {!groupBusinessIds.length && <small style={{ color: '#b45309' }}>Add registered vendors to this group to publish dashboard content.</small>}
        </form>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem' }}>Contacts ({contacts.length})</h2>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {contacts.map(contact => (
              <div key={contact.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '0.55rem 0', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: '0.8rem' }}>{contact.full_name}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{contact.phone}{contact.email ? ` · ${contact.email}` : ''}</div>
                </div>
                <label style={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                  <input type="checkbox" checked={Boolean(contact.whatsapp_opt_in)} onChange={event => setOptIn(contact, event.target.checked)} />
                  WhatsApp opt-in
                </label>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem' }}>Ribbon & news history</h2>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {announcements.map(announcement => (
              <div key={announcement.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '0.65rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: '0.8rem' }}>{announcement.title_ar}</strong>
                  {announcement.status === 'published' && <button onClick={() => archiveAnnouncement(announcement.id)} style={textButton}>Archive</button>}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{announcement.kind} · {announcement.group_name} · {announcement.status}</div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: '#334155' }}>{announcement.body_ar}</p>
              </div>
            ))}
            {announcements.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No announcements yet.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function MembershipSelector({
  memberType,
  contacts,
  businesses,
  selectedIds,
  search,
  onToggle,
}: {
  memberType: 'contact' | 'business';
  contacts: CRMContact[];
  businesses: { id: string; name: string; slug: string }[];
  selectedIds: string[];
  search: string;
  onToggle: (id: string) => void;
}) {
  const rows = (memberType === 'contact'
    ? contacts.map(contact => ({ id: contact.id, label: `${contact.full_name} · ${contact.phone}` }))
    : businesses.map(business => ({ id: business.id, label: `${business.name} · /${business.slug}` }))
  ).filter(row => row.label.toLowerCase().includes(search.toLowerCase()));
  const visibleRows = rows.slice(0, 100);
  return (
    <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.65rem' }}>
      {visibleRows.map(row => (
        <label key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.25rem 0', fontSize: '0.78rem' }}>
          <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} />
          <span>{row.label}</span>
        </label>
      ))}
      {rows.length > 100 && <div style={{ padding: '0.4rem', color: '#64748b', fontSize: '0.72rem' }}>Showing 100 of {rows.length}; filter to find more members.</div>}
      {rows.length === 0 && <div style={{ padding: '0.4rem', color: '#94a3b8', fontSize: '0.75rem' }}>No members available.</div>}
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  padding: '0.65rem 0.9rem',
  border: 0,
  borderRadius: 8,
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '0.35rem 0.55rem',
  border: '1px solid #cbd5e1',
  borderRadius: 7,
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const textButton: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#b91c1c',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: '0.72rem',
};

function memberTypeButton(active: boolean): React.CSSProperties {
  return {
    padding: '0.45rem 0.65rem',
    borderRadius: 8,
    border: `1px solid ${active ? '#d4af37' : '#cbd5e1'}`,
    background: active ? '#fffbeb' : '#fff',
    color: '#334155',
    fontSize: '0.76rem',
    fontWeight: 800,
    cursor: 'pointer',
  };
}
