'use client';

import React, { useEffect, useState } from 'react';
export default function VisitorMergePage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => { 
    const saved = localStorage.getItem('admin_token')
    if (saved) setToken(saved)
  }, [])

  async function fetchGroups() {
    if (!token) { setMessage('Enter admin token first'); return }
    setLoading(true)
    const res = await fetch('/api/visitors/duplicates', { headers: { 'Authorization': `Bearer ${token}` } })
    const data = await res.json()
    if (res.status === 403) setMessage('Invalid token')
    else setGroups(data.duplicates || [])
    setLoading(false)
  }

  async function mergeAll(email: string) {
    setMessage('Merging...')
    const res = await fetch('/api/visitors/duplicates', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email }) })
    const data = await res.json()
    if (data.ok) setMessage('Merged into ' + data.targetId)
    else setMessage('Error: ' + (data.error || 'unknown'))
    fetchGroups()
  }

  return (
    <div style={{padding:20}}>
      <h1>Visitor Merge — Duplicate Emails</h1>
      <div style={{marginBottom: 15}}>
        <input type="password" placeholder="Admin token (ADMIN_SECRET)" value={token} onChange={(e) => { setToken(e.target.value); localStorage.setItem('admin_token', e.target.value) }} style={{padding: 8, width: 300}} />
        <button onClick={fetchGroups} style={{marginLeft: 10}}>Load Duplicates</button>
      </div>
      {message && <div style={{margin:'10px 0', padding: 10, backgroundColor: '#f0f0f0'}}>{message}</div>}
      {loading && <div>Loading...</div>}
      {!loading && groups.length === 0 && <div>No duplicate emails detected.</div>}
      <ul>
        {groups.map((g:any) => (
          <li key={g.email} style={{marginBottom:12}}>
            <strong>{g.email}</strong>
            <div>
              Profiles: {g.profiles && g.profiles.length ? g.profiles.map((p:any)=>p.id).join(', ') : 'none'}
            </div>
            <div style={{marginTop:6}}>
              <button onClick={() => mergeAll(g.email)}>Create profile and merge</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
