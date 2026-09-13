'use client';

import React, { useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Heading1, Heading2,
  Heading3, Image as ImageIcon, Link2, Quote, Undo, Redo, Palette,
  Highlighter, Sparkles, Upload, Eye, Code, Type
} from 'lucide-react';

interface RichBlogEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: string;
  placeholder?: string;
}

export default function RichBlogEditor({
  value,
  onChange,
  minHeight = '420px',
  placeholder = 'Write your rich blog content here...'
}: RichBlogEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewSource, setViewSource] = useState(false);
  const [fontColor, setFontColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [fontSize, setFontSize] = useState('3'); // HTML execCommand font size 1-7
  const [uploading, setUploading] = useState(false);

  // Sync editor content to parent
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execute = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleLink = () => {
    const url = prompt('Enter link URL:');
    if (url) execute('createLink', url);
  };

  // Image upload handler (uploads via /api/jana/media/upload or accepts URL)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sectionName', 'blog');

    try {
      const res = await fetch('/api/jana/media/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.url || data.localUrl;
        if (imageUrl) {
          execute('insertHTML', `<div style="margin: 1.5rem 0; text-align: center;"><img src="${imageUrl}" alt="Blog Image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 0 auto; display: inline-block;" /><p style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem; font-style: italic;">Caption</p></div><p><br></p>`);
        }
      } else {
        const err = await res.json();
        alert('Upload failed: ' + (err.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageUrlPrompt = () => {
    const url = prompt('Enter Image URL:');
    if (url) {
      execute('insertHTML', `<div style="margin: 1.5rem 0; text-align: center;"><img src="${url}" alt="Blog Image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" /></div><p><br></p>`);
    }
  };

  // Apply custom callout/styled block
  const insertCallout = (type: 'info' | 'quote' | 'highlight') => {
    if (type === 'info') {
      execute('insertHTML', `<div style="background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02)); border-left: 4px solid #D4AF37; padding: 1.25rem 1.5rem; border-radius: 0 12px 12px 0; margin: 1.5rem 0;"><strong style="color: #D4AF37; font-size: 0.95rem; display: block; margin-bottom: 0.4rem;">💡 Oasis Tip</strong><p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #334155;">Write key advice, visitor guideline, or local recommendation here...</p></div><p><br></p>`);
    } else if (type === 'quote') {
      execute('insertHTML', `<blockquote style="border-left: 4px solid #3b82f6; margin: 1.5rem 0; padding: 1rem 1.5rem; background: #f8fafc; border-radius: 0 8px 8px 0; font-style: italic; font-size: 1.1rem; color: #1e293b;">"Siwa is not just a place, it is a timeless sanctuary where salt, springs, and desert tell stories."<cite style="display: block; text-align: right; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; font-style: normal;">— Local Guide</cite></blockquote><p><br></p>`);
    } else if (type === 'highlight') {
      execute('insertHTML', `<div style="background: #fef08a; padding: 0.2rem 0.6rem; border-radius: 4px; display: inline-block; font-weight: bold; color: #854d0e;">Important highlight</div>&nbsp;`);
    }
  };

  return (
    <div style={{
      border: '1px solid #cbd5e1',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}>
      {/* ── TOOLBAR ── */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.6rem 0.8rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        alignItems: 'center'
      }}>
        {/* Undo/Redo */}
        <button type="button" onClick={() => execute('undo')} title="Undo" style={btnStyle}><Undo size={15} /></button>
        <button type="button" onClick={() => execute('redo')} title="Redo" style={btnStyle}><Redo size={15} /></button>

        <div style={separatorStyle} />

        {/* Font Family Selector */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            execute('fontName', e.target.value);
          }}
          style={selectStyle}
          title="Font Family"
        >
          <option value="'Inter', sans-serif">Inter (Modern)</option>
          <option value="'Outfit', sans-serif">Outfit (Editorial)</option>
          <option value="'Georgia', serif">Georgia (Classic Serif)</option>
          <option value="'Merriweather', serif">Merriweather (Literary)</option>
          <option value="'Courier New', monospace">Courier (Code)</option>
        </select>

        {/* Font Size Selector */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            execute('fontSize', e.target.value);
          }}
          style={{ ...selectStyle, width: '70px' }}
          title="Font Size"
        >
          <option value="1">XS (10px)</option>
          <option value="2">SM (12px)</option>
          <option value="3">Base (14px)</option>
          <option value="4">MD (16px)</option>
          <option value="5">LG (18px)</option>
          <option value="6">XL (24px)</option>
          <option value="7">2XL (32px)</option>
        </select>

        <div style={separatorStyle} />

        {/* Headings */}
        <button type="button" onClick={() => execute('formatBlock', '<h1>')} title="Heading 1" style={btnStyle}><Heading1 size={16} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<h2>')} title="Heading 2" style={btnStyle}><Heading2 size={16} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<h3>')} title="Heading 3" style={btnStyle}><Heading3 size={16} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<p>')} title="Paragraph" style={btnStyle}><Type size={16} /></button>

        <div style={separatorStyle} />

        {/* Formatting */}
        <button type="button" onClick={() => execute('bold')} title="Bold" style={btnStyle}><Bold size={15} /></button>
        <button type="button" onClick={() => execute('italic')} title="Italic" style={btnStyle}><Italic size={15} /></button>
        <button type="button" onClick={() => execute('underline')} title="Underline" style={btnStyle}><Underline size={15} /></button>
        <button type="button" onClick={() => execute('strikeThrough')} title="Strikethrough" style={btnStyle}><Strikethrough size={15} /></button>

        <div style={separatorStyle} />

        {/* Font Color Picker */}
        <label title="Font Color" style={{ ...btnStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          <Palette size={15} style={{ color: fontColor }} />
          <input
            type="color"
            value={fontColor}
            onChange={(e) => {
              setFontColor(e.target.value);
              execute('foreColor', e.target.value);
            }}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          />
        </label>

        {/* Background Highlight Picker */}
        <label title="Text Background Color" style={{ ...btnStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          <Highlighter size={15} style={{ color: bgColor === '#ffffff' ? '#ca8a04' : bgColor }} />
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              execute('hiliteColor', e.target.value);
            }}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          />
        </label>

        <div style={separatorStyle} />

        {/* Alignment */}
        <button type="button" onClick={() => execute('justifyLeft')} title="Align Left" style={btnStyle}><AlignLeft size={15} /></button>
        <button type="button" onClick={() => execute('justifyCenter')} title="Align Center" style={btnStyle}><AlignCenter size={15} /></button>
        <button type="button" onClick={() => execute('justifyRight')} title="Align Right" style={btnStyle}><AlignRight size={15} /></button>
        <button type="button" onClick={() => execute('justifyFull')} title="Justify" style={btnStyle}><AlignJustify size={15} /></button>

        <div style={separatorStyle} />

        {/* Lists & Quotes */}
        <button type="button" onClick={() => execute('insertUnorderedList')} title="Bullet List" style={btnStyle}><List size={15} /></button>
        <button type="button" onClick={() => execute('insertOrderedList')} title="Numbered List" style={btnStyle}><ListOrdered size={15} /></button>
        <button type="button" onClick={handleLink} title="Insert Link" style={btnStyle}><Link2 size={15} /></button>

        <div style={separatorStyle} />

        {/* Media & Upload */}
        <label title="Upload Image From Device" style={{ ...btnStyle, cursor: 'pointer', background: uploading ? '#dbeafe' : 'transparent' }}>
          <Upload size={15} className={uploading ? 'animate-bounce text-blue-600' : ''} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <button type="button" onClick={handleImageUrlPrompt} title="Insert Image via URL" style={btnStyle}><ImageIcon size={15} /></button>

        <div style={separatorStyle} />

        {/* Styled Blocks */}
        <button type="button" onClick={() => insertCallout('info')} title="Add Oasis Callout Box" style={{ ...btnStyle, color: '#D4AF37', fontWeight: 800 }}>
          <Sparkles size={14} /> Callout
        </button>
        <button type="button" onClick={() => insertCallout('quote')} title="Add Blockquote" style={btnStyle}><Quote size={15} /></button>

        {/* View HTML Code toggle */}
        <button
          type="button"
          onClick={() => setViewSource(!viewSource)}
          title="Toggle HTML Source"
          style={{ ...btnStyle, marginLeft: 'auto', background: viewSource ? '#0f172a' : 'transparent', color: viewSource ? '#fff' : '#475569' }}
        >
          <Code size={15} />
        </button>
      </div>

      {/* ── CONTENT AREA ── */}
      {viewSource ? (
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (editorRef.current) editorRef.current.innerHTML = e.target.value;
          }}
          style={{
            width: '100%',
            minHeight,
            padding: '1.5rem',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            border: 'none',
            outline: 'none',
            background: '#090e17',
            color: '#38bdf8',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value }}
          style={{
            minHeight,
            padding: '1.5rem',
            outline: 'none',
            fontSize: '1rem',
            lineHeight: '1.8',
            color: '#1e293b',
            fontFamily: fontFamily,
            overflowY: 'auto'
          }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  padding: '0.4rem 0.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  fontSize: '0.8rem',
};

const selectStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  padding: '0.3rem 0.5rem',
  fontSize: '0.78rem',
  color: '#334155',
  outline: 'none',
  cursor: 'pointer'
};

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '20px',
  background: '#e2e8f0',
  margin: '0 0.2rem'
};
