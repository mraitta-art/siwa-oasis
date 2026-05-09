'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function TagInput({
  value = [],
  onChange,
  placeholder = 'Type an option, press Enter...',
  label = 'PERMITTED OPTIONS',
  maxTags,
  disabled = false
}: TagInputProps) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = Array.isArray(value) ? value : [];

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) return;
    if (maxTags && tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setInputVal('');
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>
          {label}
        </label>
        <span style={{
          fontSize: '0.55rem', fontWeight: 900,
          background: tags.length > 0 ? 'rgba(212,175,55,0.1)' : '#f1f5f9',
          color: tags.length > 0 ? '#D4AF37' : '#94a3b8',
          padding: '2px 8px', borderRadius: '6px',
          border: tags.length > 0 ? '1px solid rgba(212,175,55,0.2)' : '1px solid #e2e8f0'
        }}>
          {tags.length} option{tags.length !== 1 ? 's' : ''} {maxTags ? `/ ${maxTags} max` : ''}
        </span>
      </div>

      {/* Tag cloud + input */}
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        style={{
          minHeight: '80px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '0.75rem',
          background: disabled ? '#f8fafc' : '#fff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignContent: 'flex-start',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => {}}
      >
        {/* Existing tags */}
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              color: '#fff',
              padding: '0.3rem 0.6rem 0.3rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '160px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tag}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.6rem',
                  flexShrink: 0,
                  lineHeight: 1,
                  padding: 0,
                }}
                title="Remove"
              >
                ✕
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        {!disabled && (!maxTags || tags.length < maxTags) && (
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKey}
            onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
            placeholder={tags.length === 0 ? placeholder : 'Add another...'}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#1e293b',
              minWidth: '140px',
              flex: 1,
              padding: '0.2rem 0.25rem',
            }}
          />
        )}
      </div>

      {/* Hint */}
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <i className="fas fa-shield-alt" style={{ color: '#D4AF37', fontSize: '0.55rem' }}></i>
        Admin-locked choices. Vendors can only select from these options.
        {!disabled && <span style={{ opacity: 0.6 }}> · Press Enter or comma to add.</span>}
      </div>
    </div>
  );
}
