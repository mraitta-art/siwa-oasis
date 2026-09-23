'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Heading1, Heading2,
  Heading3, Image as ImageIcon, Link2, Quote, Undo, Redo, Palette,
  Highlighter, Sparkles, Upload, Code, Type, AlignHorizontalDistributeCenter
} from 'lucide-react';

interface RichBlogEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: string;
  placeholder?: string;
  businessName?: string;
  sectionName?: string;
  dir?: 'ltr' | 'rtl';
}

export default function RichBlogEditor({
  value,
  onChange,
  minHeight = '360px',
  placeholder = 'Write your rich blog content here...',
  businessName = 'General',
  sectionName = 'blog',
  dir = 'ltr'
}: RichBlogEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef<boolean>(false);
  const [viewSource, setViewSource] = useState(false);
  const [currentDir, setCurrentDir] = useState<'ltr' | 'rtl'>(dir);
  const [fontColor, setFontColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [blockColor, setBlockColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState(
    dir === 'rtl' ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', sans-serif"
  );
  const [fontSize, setFontSize] = useState('3');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Keep dir in sync if parent changes it
  useEffect(() => {
    setCurrentDir(dir);
    if (dir === 'rtl' && fontFamily.includes('Inter')) {
      setFontFamily("'Cairo', 'Tajawal', 'Segoe UI', sans-serif");
    }
  }, [dir]);

  // Sync external value to editor without losing cursor position
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const editorFontSize = ({
    '1': '0.75rem',
    '2': '0.875rem',
    '3': '1rem',
    '4': '1.125rem',
    '5': '1.35rem',
    '6': '1.75rem',
    '7': '2.25rem',
  } as Record<string, string>)[fontSize] || '1rem';

  // Save selection inside editor whenever user clicks, types, or moves cursor
  const updateSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      onChange(editorRef.current.innerHTML);
    }
    updateSelection();
  };

  const execute = (command: string, cmdValue: string | undefined = undefined) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    // Restore selection if lost
    if (lastRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(lastRangeRef.current);
      }
    }

    document.execCommand(command, false, cmdValue);
    handleInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const sel = window.getSelection();
    let range: Range | null = null;

    if (lastRangeRef.current && editor.contains(lastRangeRef.current.commonAncestorContainer)) {
      range = lastRangeRef.current;
    } else if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    }

    if (range) {
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      let lastNode: ChildNode | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      // Place cursor after inserted content
      if (lastNode && sel) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        lastRangeRef.current = newRange;
      }
    } else {
      // Fallback: append at end
      editor.innerHTML += html;
    }

    handleInput();
  };

  const handleLink = () => {
    const url = prompt(currentDir === 'rtl' ? 'أدخل رابط URL:' : 'Enter link URL:');
    if (url) execute('createLink', url);
  };

  // Upload image/video directly from device
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('businessName', businessName || 'general');
    formData.append('sectionName', sectionName || 'blog');

    try {
      const res = await fetch('/api/jana/media/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && (data.url || data.localUrl)) {
        const imageUrl = data.url || data.localUrl;
        const isVideo = file.type.startsWith('video/');
        const mediaMarkup = isVideo
          ? `<div style="margin: 1.5rem 0; text-align: center;"><video src="${imageUrl}" controls style="max-width: 100%; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); display: inline-block;"></video></div><p><br></p>`
          : `<div style="margin: 1.5rem 0; text-align: center;"><img src="${imageUrl}" alt="Story Media" style="max-width: 100%; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); display: inline-block;" /><p style="font-size: 0.8rem; color: #64748b; margin-top: 0.4rem; font-style: italic;">${file.name.replace(/\.[^/.]+$/, '')}</p></div><p><br></p>`;
        
        insertHtmlAtCursor(mediaMarkup);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageUrlPrompt = () => {
    const url = prompt(currentDir === 'rtl' ? 'أدخل رابط الصورة (URL):' : 'Enter Image URL:');
    if (url) {
      insertHtmlAtCursor(`<div style="margin: 1.5rem 0; text-align: center;"><img src="${url}" alt="Story image" style="max-width: 100%; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); display: inline-block;" /></div><p><br></p>`);
    }
  };

  // Styled Callout Blocks
  const insertCallout = (type: 'info' | 'quote' | 'highlight') => {
    if (type === 'info') {
      const title = currentDir === 'rtl' ? '💡 نصيحة واحة سيوة' : '💡 Oasis Tip';
      const text = currentDir === 'rtl' ? 'اكتب النصيحة أو الإرشاد السياحي هنا...' : 'Write key advice, visitor guideline, or local recommendation here...';
      insertHtmlAtCursor(`<div style="background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.02)); border-${currentDir === 'rtl' ? 'right' : 'left'}: 4px solid #D4AF37; padding: 1.25rem 1.5rem; border-radius: ${currentDir === 'rtl' ? '12px 0 0 12px' : '0 12px 12px 0'}; margin: 1.5rem 0;"><strong style="color: #D4AF37; font-size: 0.95rem; display: block; margin-bottom: 0.4rem;">${title}</strong><p style="margin: 0; font-size: 0.95rem; line-height: 1.7; color: #334155;">${text}</p></div><p><br></p>`);
    } else if (type === 'quote') {
      const quoteText = currentDir === 'rtl' ? '«سيوة ليست مجرد واحة، بل هي ملاذ خالد تحكي فيه عيون الماء والكثبان أسرار الطبيعة.»' : '"Siwa is not just an oasis, but a timeless sanctuary where salt lakes, springs, and dunes tell ancient stories."';
      const author = currentDir === 'rtl' ? '— دليل محلي' : '— Local Guide';
      insertHtmlAtCursor(`<blockquote style="border-${currentDir === 'rtl' ? 'right' : 'left'}: 4px solid #3b82f6; margin: 1.5rem 0; padding: 1rem 1.5rem; background: #f8fafc; border-radius: 8px; font-style: italic; font-size: 1.05rem; color: #1e293b; line-height: 1.8;">${quoteText}<cite style="display: block; text-align: ${currentDir === 'rtl' ? 'left' : 'right'}; font-size: 0.82rem; color: #64748b; margin-top: 0.5rem; font-style: normal;">${author}</cite></blockquote><p><br></p>`);
    } else if (type === 'highlight') {
      insertHtmlAtCursor(`<span style="background: #fef08a; color: #854d0e; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">${currentDir === 'rtl' ? 'نص مميز' : 'Highlighted key point'}</span>&nbsp;`);
    }
  };

  return (
    <div style={{
      border: '1.5px solid #cbd5e1',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      {/* ── TOOLBAR ── */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.6rem 0.8rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        alignItems: 'center',
        direction: 'ltr' // Keep toolbar buttons consistently laid out
      }}>
        {/* Undo / Redo */}
        <button type="button" onClick={() => execute('undo')} title="Undo" style={btnStyle}><Undo size={14} /></button>
        <button type="button" onClick={() => execute('redo')} title="Redo" style={btnStyle}><Redo size={14} /></button>

        <div style={separatorStyle} />

        {/* Direction Switcher (LTR / RTL) */}
        <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
          <button
            type="button"
            onClick={() => setCurrentDir('ltr')}
            title="Left to Right (English)"
            style={{
              ...btnStyle,
              padding: '2px 7px',
              fontSize: '0.65rem',
              fontWeight: 800,
              background: currentDir === 'ltr' ? '#0f172a' : 'transparent',
              color: currentDir === 'ltr' ? '#fff' : '#64748b',
              borderRadius: '4px'
            }}
          >
            LTR
          </button>
          <button
            type="button"
            onClick={() => setCurrentDir('rtl')}
            title="Right to Left (العربية)"
            style={{
              ...btnStyle,
              padding: '2px 7px',
              fontSize: '0.65rem',
              fontWeight: 800,
              background: currentDir === 'rtl' ? '#D4AF37' : 'transparent',
              color: currentDir === 'rtl' ? '#1a1000' : '#64748b',
              borderRadius: '4px'
            }}
          >
            عربي RTL
          </button>
        </div>

        <div style={separatorStyle} />

        {/* Font Family Selector (includes Arabic-friendly fonts) */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            execute('fontName', e.target.value);
          }}
          style={selectStyle}
          title="Font Family"
        >
          <option value="'Cairo', 'Tajawal', sans-serif">Cairo / Tajawal (Arabic Modern)</option>
          <option value="'Amiri', serif">Amiri (Arabic Classical)</option>
          <option value="'Inter', sans-serif">Inter (English Modern)</option>
          <option value="'Outfit', sans-serif">Outfit (Editorial)</option>
          <option value="'Georgia', serif">Georgia (Classic Serif)</option>
          <option value="'Courier New', monospace">Monospace</option>
        </select>

        {/* Font Size Selector */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            execute('fontSize', e.target.value);
          }}
          style={{ ...selectStyle, width: '65px' }}
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
        <button type="button" onClick={() => execute('formatBlock', '<h1>')} title="Heading 1" style={btnStyle}><Heading1 size={15} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<h2>')} title="Heading 2" style={btnStyle}><Heading2 size={15} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<h3>')} title="Heading 3" style={btnStyle}><Heading3 size={15} /></button>
        <button type="button" onClick={() => execute('formatBlock', '<p>')} title="Paragraph" style={btnStyle}><Type size={15} /></button>

        <div style={separatorStyle} />

        {/* Text Style */}
        <button type="button" onClick={() => execute('bold')} title="Bold" style={btnStyle}><Bold size={14} /></button>
        <button type="button" onClick={() => execute('italic')} title="Italic" style={btnStyle}><Italic size={14} /></button>
        <button type="button" onClick={() => execute('underline')} title="Underline" style={btnStyle}><Underline size={14} /></button>
        <button type="button" onClick={() => execute('strikeThrough')} title="Strikethrough" style={btnStyle}><Strikethrough size={14} /></button>

        <div style={separatorStyle} />

        {/* Font Color */}
        <label title="Font Color" style={{ ...btnStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          <Palette size={14} style={{ color: fontColor }} />
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

        {/* Text Highlight Color */}
        <label title="Text Highlight" style={{ ...btnStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          <Highlighter size={14} style={{ color: bgColor === '#ffffff' ? '#ca8a04' : bgColor }} />
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
        <button type="button" onClick={() => execute('justifyLeft')} title="Align Left" style={btnStyle}><AlignLeft size={14} /></button>
        <button type="button" onClick={() => execute('justifyCenter')} title="Align Center" style={btnStyle}><AlignCenter size={14} /></button>
        <button type="button" onClick={() => execute('justifyRight')} title="Align Right" style={btnStyle}><AlignRight size={14} /></button>
        <button type="button" onClick={() => execute('justifyFull')} title="Justify" style={btnStyle}><AlignJustify size={14} /></button>

        <div style={separatorStyle} />

        {/* Lists & Links */}
        <button type="button" onClick={() => execute('insertUnorderedList')} title="Bullet List" style={btnStyle}><List size={14} /></button>
        <button type="button" onClick={() => execute('insertOrderedList')} title="Numbered List" style={btnStyle}><ListOrdered size={14} /></button>
        <button type="button" onClick={handleLink} title="Insert Link" style={btnStyle}><Link2 size={14} /></button>

        <div style={separatorStyle} />

        {/* Media & Upload from Device */}
        <label
          title="Upload image or video into story"
          style={{
            ...btnStyle,
            cursor: uploading ? 'wait' : 'pointer',
            background: uploading ? '#dbeafe' : '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            fontWeight: 800,
            fontSize: '0.72rem',
            gap: '4px'
          }}
        >
          <Upload size={13} className={uploading ? 'animate-bounce text-blue-600' : ''} />
          <span>{uploading ? 'Uploading...' : 'Insert Photo/Video'}</span>
          <input
            type="file"
            accept="image/*,video/*"
            onMouseDown={updateSelection}
            onChange={handleImageUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <button type="button" onClick={handleImageUrlPrompt} title="Insert Image via URL" style={btnStyle}><ImageIcon size={14} /></button>

        <div style={separatorStyle} />

        {/* Oasis Callouts */}
        <button type="button" onClick={() => insertCallout('info')} title="Add Oasis Callout Box" style={{ ...btnStyle, color: '#D4AF37', fontWeight: 800, fontSize: '0.72rem' }}>
          <Sparkles size={13} style={{ marginRight: '3px' }} /> Callout
        </button>
        <button type="button" onClick={() => insertCallout('quote')} title="Add Blockquote" style={btnStyle}><Quote size={14} /></button>
        <button type="button" onClick={() => insertCallout('highlight')} title="Add Highlight" style={{ ...btnStyle, fontSize: '0.72rem', fontWeight: 700 }}>Badge</button>

        {/* HTML Source Toggle */}
        <button
          type="button"
          onClick={() => setViewSource(!viewSource)}
          title="Toggle HTML Code"
          style={{ ...btnStyle, marginLeft: 'auto', background: viewSource ? '#0f172a' : 'transparent', color: viewSource ? '#fff' : '#475569' }}
        >
          <Code size={14} />
        </button>
      </div>

      {uploadError && (
        <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid #fee2e2' }}>
          ⚠️ Upload error: {uploadError}
        </div>
      )}

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
            boxSizing: 'border-box',
            direction: currentDir
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateSelection}
          onMouseUp={updateSelection}
          onFocus={updateSelection}
          onBlur={updateSelection}
          style={{
            minHeight,
            padding: '1.5rem',
            outline: 'none',
            fontSize: editorFontSize,
            lineHeight: currentDir === 'rtl' ? '1.9' : '1.75',
            color: fontColor,
            fontFamily: fontFamily,
            backgroundColor: blockColor,
            overflowY: 'auto',
            direction: currentDir,
            textAlign: currentDir === 'rtl' ? 'right' : 'left'
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
  padding: '0.35rem 0.45rem',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  fontSize: '0.75rem',
};

const selectStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  padding: '0.25rem 0.45rem',
  fontSize: '0.74rem',
  color: '#334155',
  outline: 'none',
  cursor: 'pointer'
};

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '18px',
  background: '#e2e8f0',
  margin: '0 0.15rem'
};
