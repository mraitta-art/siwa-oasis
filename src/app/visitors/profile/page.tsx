'use client';

import React, { useState } from 'react';

interface Profile {
  id: string;
  primary_name?: string | null;
  emails: string[];
  phones: string[];
  metadata?: any;
}

export default function VisitorProfilePage() {
  const [searchType, setSearchType] = useState('email');
  const [searchValue, setSearchValue] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');

  async function searchProfile() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set(searchType, searchValue);
    const res = await fetch(`/api/visitors/profile?${params}`);
    const data = await res.json();
    setProfile(data.profile);
    setLoading(false);
    if (!data.profile) setMessage('Profile not found');
  }

  async function requestOtp() {
    const contact = searchType === 'email' ? searchValue : searchValue;
    const res = await fetch('/api/visitors/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', [searchType]: searchValue })
    });
    const data = await res.json();
    if (data.ok) {
      setOtpSent(true);
      setMessage(`OTP sent to ${searchValue}. Check email/SMS. (Dev: ${data.otp})`);
    } else {
      setMessage('Error sending OTP');
    }
  }

  async function verifyOtp() {
    const res = await fetch('/api/visitors/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', [searchType]: searchValue, code: otp })
    });
    const data = await res.json();
    if (data.ok) {
      setVerified(true);
      setMessage('Verified! You can now edit your profile.');
    } else {
      setMessage('Invalid OTP');
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 20 }}>
      <h1>Your Visitor Profile</h1>
      {message && <div style={{ backgroundColor: '#f0f0f0', padding: 10, marginBottom: 10 }}>{message}</div>}

      {!profile && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <label>
              Search by{' '}
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="id">ID</option>
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder={`Enter your ${searchType}`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button onClick={searchProfile} disabled={loading}>
            {loading ? 'Searching...' : 'Search Profile'}
          </button>
        </div>
      )}

      {profile && (
        <div>
          <div style={{ marginBottom: 15 }}>
            <h2>Your Profile</h2>
            <div>
              <strong>ID:</strong> {profile.id}
            </div>
            <div>
              <strong>Name:</strong> {profile.primary_name || '(not set)'}
            </div>
            <div>
              <strong>Emails:</strong> {profile.emails.join(', ') || '(none)'}
            </div>
            <div>
              <strong>Phones:</strong> {profile.phones.join(', ') || '(none)'}
            </div>
          </div>

          {!verified && (
            <div style={{ backgroundColor: '#fff3cd', padding: 10, marginBottom: 10 }}>
              <p>Verify your identity to edit.</p>
              {!otpSent ? (
                <button onClick={requestOtp}>Request OTP</button>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ width: '100%', padding: 8, marginBottom: 8 }}
                  />
                  <button onClick={verifyOtp}>Verify OTP</button>
                </div>
              )}
            </div>
          )}

          {verified && (
            <div style={{ backgroundColor: '#d4edda', padding: 10 }}>
              <p>✓ You can edit your profile here (form builder coming soon).</p>
            </div>
          )}

          <button onClick={() => { setProfile(null); setVerified(false); setOtpSent(false); setOtp(''); }}>
            Search Another
          </button>
        </div>
      )}
    </div>
  );
}
