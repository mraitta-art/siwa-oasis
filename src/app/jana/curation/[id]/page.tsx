import { redirect } from 'next/navigation';

export default async function CurationBusinessRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/jana/businesses/${id}/edit`);
}
