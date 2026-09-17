'use client';

import Link from 'next/link';
import { useLang } from '@/context/LangContext';

export default function MinisiteBuilderEntry() {
  const { isRTL } = useLang();
  const copy = isRTL ? {
    eyebrow: 'بناء المواقع المصغرة', title: 'بناء مواقع الأنشطة التجارية', description: 'أنشئ قالباً قابلاً لإعادة الاستخدام، واربط الأقسام، وأضف المحتوى، ثم انشر موقع كل نشاط تلقائياً.', templates: 'قوالب الموقع المصغر', templatesText: 'إنشاء وإدارة تخطيطات قابلة لإعادة الاستخدام حسب نوع النشاط.', forms: 'النماذج والأقسام', formsText: 'اختيار البيانات والأقسام الموروثة وتهيئة محتوى النشاط.', content: 'محتوى النشاط التجاري', contentText: 'إضافة بيانات الأقسام والصور والقصص وإعدادات النشر باللغتين.', carousel: 'صور الموقع المصغر', carouselText: 'إدارة الشرائح والصور الرئيسية والتعليقات والترتيب.', create: 'إنشاء نشاط تجاري', createText: 'إنشاء نشاط وتوليد موقعه المصغر تلقائياً من النوع والقالب.'
  } : {
    eyebrow: 'MINISITE BUILDING', title: 'Build Business Minisites', description: 'Create a reusable template once, assign inherited sections, add business content, and publish each business minisite automatically.', templates: 'Minisite Templates', templatesText: 'Create and manage reusable minisite layouts for business types.', forms: 'Forms and Sections', formsText: 'Choose parent, child, or business data and configure inherited sections.', content: 'Business Content', contentText: 'Fill section data, galleries, section stories, and publication settings in both languages.', carousel: 'Minisite Carousel', carouselText: 'Manage slides, featured images, captions, and carousel order.', create: 'Create a Business', createText: 'Create a business and automatically generate its minisite from its type and template.'
  };
  const localizedTools = [
    { href: '/jana/page-builder/templates', icon: 'fa-layer-group', title: copy.templates, text: copy.templatesText },
    { href: '/jana/business-forms', icon: 'fa-file-signature', title: copy.forms, text: copy.formsText },
    { href: '/jana/content', icon: 'fa-photo-film', title: copy.content, text: copy.contentText },
    { href: '/jana/hero-carousel', icon: 'fa-images', title: copy.carousel, text: copy.carouselText },
    { href: '/jana/orchestrator', icon: 'fa-magic', title: copy.create, text: copy.createText },
  ];
  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem', textAlign: isRTL ? 'right' : 'left' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, letterSpacing: isRTL ? 0 : '1.5px' }}>{copy.eyebrow}</div>
        <h1 style={{ margin: '0.4rem 0', fontSize: '2.2rem', color: '#0f172a' }}>{copy.title}</h1>
        <p style={{ maxWidth: 720, color: '#64748b', lineHeight: 1.6 }}>{copy.description}</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {localizedTools.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ display: 'block', padding: '1.3rem', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#0f172a', textDecoration: 'none' }}>
            <i className={`fas ${tool.icon}`} style={{ color: '#D4AF37', fontSize: '1.3rem' }} />
            <h2 style={{ margin: '0.8rem 0 0.35rem', fontSize: '1rem' }}>{tool.title}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{tool.text}</p>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.2rem', borderRadius: 10, background: '#fffbeb', border: '1px solid #f5d77a', color: '#78350f', fontSize: '0.85rem' }}>
        Flow: <strong>Type and sections</strong> {'->'} <strong>Template</strong> {'->'} <strong>Business content</strong> {'->'} <strong>Carousel and blog</strong> {'->'} <strong>/{'{business-slug}'}</strong>
      </div>
    </main>
  );
}
