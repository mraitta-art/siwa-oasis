'use client';

import React, { useState } from 'react';

const SETUP_STEPS = [
  {
    id: 'db-verify',
    name: 'Database Schema Verification',
    description: 'Adds missing columns, creates required tables, verifies indexes, and seeds the anonymous vendor profile.',
    icon: 'fa-database',
    color: '#3b82f6',
    url: '/api/setup/database-verification',
  },
  {
    id: 'universal-sections',
    name: 'Universal Sections',
    description: 'Creates and registers universal sections (Vibe, Experience, Investment) that work across all business types.',
    icon: 'fa-table-cells',
    color: '#8b5cf6',
    url: '/api/setup/create-universal-sections',
  },
  {
    id: 'site-components',
    name: 'Site Components Registry',
    description: 'Seeds and initializes all page builder UI components into the component registry.',
    icon: 'fa-puzzle-piece',
    color: '#10b981',
    url: '/api/setup/init-site-components',
  },
];

type StepStatus = 'idle' | 'running' | 'success' | 'error';

export default function SetupPage() {
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function runStep(step: typeof SETUP_STEPS[0]) {
    setStatuses(s => ({ ...s, [step.id]: 'running' }));
    setResults(r => ({ ...r, [step.id]: null }));
    try {
      const res = await fetch(step.url, { method: 'POST' });
      const data = await res.json();
      setStatuses(s => ({ ...s, [step.id]: res.ok ? 'success' : 'error' }));
      setResults(r => ({ ...r, [step.id]: data }));
    } catch (e: any) {
      setStatuses(s => ({ ...s, [step.id]: 'error' }));
      setResults(r => ({ ...r, [step.id]: { error: e.message } }));
    }
  }

  async function runAll() {
    setRunningAll(true);
    for (const step of SETUP_STEPS) {
      await runStep(step);
    }
    setRunningAll(false);
  }

  const accent = '#D4AF37';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '24px', padding: '2rem 2.5rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-wrench" style={{ color: accent, fontSize: '1.1rem' }}></i>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>System Setup</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Run all migrations, seed defaults, and verify schema integrity
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={runningAll}
          style={{
            background: runningAll ? '#374151' : accent,
            color: runningAll ? '#9ca3af' : '#1a1a2e',
            border: 'none', borderRadius: '14px',
            padding: '0.85rem 2rem', fontWeight: 900,
            fontSize: '0.85rem', cursor: runningAll ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          <i className={`fas ${runningAll ? 'fa-spinner fa-spin' : 'fa-rocket'}`}></i>
          {runningAll ? 'Running All…' : 'Run All Steps'}
        </button>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SETUP_STEPS.map(step => {
          const status = statuses[step.id] || 'idle';
          const result = results[step.id];
          const isRunning = status === 'running';
          const isSuccess = status === 'success';
          const isError = status === 'error';

          return (
            <div key={step.id} style={{
              background: '#fff', borderRadius: '20px', border: '1px solid',
              borderColor: isSuccess ? '#10b98130' : isError ? '#ef444430' : '#e2e8f0',
              boxShadow: isSuccess ? '0 4px 20px #10b98110' : isError ? '0 4px 20px #ef444410' : 'none',
              overflow: 'hidden', transition: 'all 0.3s',
            }}>
              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
                  background: `${step.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`fas ${step.icon}`} style={{ color: step.color, fontSize: '1.2rem' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>{step.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>{step.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {/* Status badge */}
                  {status !== 'idle' && (
                    <div style={{
                      padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900,
                      letterSpacing: '0.5px',
                      background: isRunning ? '#f59e0b20' : isSuccess ? '#10b98120' : '#ef444420',
                      color: isRunning ? '#d97706' : isSuccess ? '#059669' : '#dc2626',
                    }}>
                      {isRunning ? '⟳ RUNNING' : isSuccess ? '✓ DONE' : '✕ ERROR'}
                    </div>
                  )}
                  <button
                    onClick={() => runStep(step)}
                    disabled={isRunning || runningAll}
                    style={{
                      background: isRunning || runningAll ? '#f1f5f9' : '#1e293b',
                      color: isRunning || runningAll ? '#94a3b8' : '#fff',
                      border: 'none', borderRadius: '10px',
                      padding: '0.6rem 1.25rem', fontWeight: 800,
                      fontSize: '0.75rem', cursor: isRunning || runningAll ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    <i className={`fas ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                    {isRunning ? 'Running…' : 'Run'}
                  </button>
                </div>
              </div>

              {/* Result panel */}
              {result && (
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  padding: '1rem 1.5rem',
                  background: isError ? '#fef2f2' : '#f8fafc',
                }}>
                  {isError ? (
                    <div style={{ color: '#dc2626', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      ❌ {result.error || JSON.stringify(result)}
                    </div>
                  ) : (
                    <div>
                      {result.summary && (
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: result.checks ? '0.75rem' : 0 }}>
                          {[
                            { label: 'Total', value: result.summary.total, color: '#64748b' },
                            { label: 'Added', value: result.summary.added, color: '#10b981' },
                            { label: 'Existing', value: result.summary.exists, color: '#3b82f6' },
                            { label: 'Errors', value: result.summary.errors, color: '#ef4444' },
                          ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>{s.label.toUpperCase()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {result.checks && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {result.checks.map((c: any, i: number) => (
                            <span key={i} style={{
                              padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700,
                              background: c.status === 'ERROR' ? '#fecaca' : c.status === 'ADDED' ? '#d1fae5' : '#e0f2fe',
                              color: c.status === 'ERROR' ? '#dc2626' : c.status === 'ADDED' ? '#059669' : '#0284c7',
                            }}>
                              {c.check}: {c.status}
                            </span>
                          ))}
                        </div>
                      )}
                      {!result.summary && !result.checks && (
                        <pre style={{ fontSize: '0.72rem', color: '#475569', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div style={{ marginTop: '2rem', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a', marginBottom: '1rem' }}>
          <i className="fas fa-link" style={{ marginRight: '0.5rem', color: '#94a3b8' }}></i>
          Direct Browser Links
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {SETUP_STEPS.map(step => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className={`fas ${step.icon}`} style={{ width: 16, textAlign: 'center', color: step.color, fontSize: '0.8rem' }}></i>
              <a href={step.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.78rem', fontFamily: 'monospace', textDecoration: 'none' }}>
                {`https://www.siwa.today${step.url}`}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
