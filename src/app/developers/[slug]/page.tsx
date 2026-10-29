import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pathLocale } from '@/lib/site-locale';
import { getDeveloperBySlug } from '@/lib/developers';
import DeveloperPortfolio from '@/components/development/DeveloperPortfolio';

/**
 * The rule-based developer page: /developers/{slug}.
 *
 * The portfolio itself lives in DeveloperPortfolio, shared with an admin-chosen
 * root vanity. This route only decides the language and the metadata; it exists
 * in both languages because middleware negotiates the locale into a header, so
 * /ar/developers/sodic and /developers/sodic are the same page.
 */

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ar = (await pathLocale()) !== 'en';
  const developer = await getDeveloperBySlug(slug);
  const name = developer ? (ar ? developer.nameAr || developer.name : developer.name) : slug;
  return {
    title: ar ? `${name} | مشروعات المطوّر` : `${name} | Developer projects`,
    description: ar
      ? `كل مشروعات ${name} في مكان واحد مع إمكانية المقارنة.`
      : `Every ${name} project in one place, ready to compare.`,
  };
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ar = (await pathLocale()) !== 'en';
  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();
  return <DeveloperPortfolio slug={slug} ar={ar} />;
}
