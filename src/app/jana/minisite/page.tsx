import { useEffect, useState } from 'react';

type MinisiteTemplate = {
  id: string;
  name: string;
  category_id?: string | null;
  tier?: string;
  // any other fields present in the DB
};

export default function MinisitePage() {
  const [templates, setTemplates] = useState<MinisiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jana/minisite-templates')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body?.error ?? 'Failed to load minisite templates');
        }
        return res.json();
      })
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">Loading minisite templates…</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Your Minisite Templates</h1>
      {templates.length === 0 ? (
        <p className="text-center">No templates found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <li key={tpl.id} className="bg-gray-800 rounded-lg shadow-lg p-6 hover:scale-105 transform transition">
              <h2 className="text-2xl font-semibold">{tpl.name}</h2>
              {tpl.category_id && <p className="text-sm opacity-75">Category: {tpl.category_id}</p>}
              <p className="mt-2">Tier: {tpl.tier ?? 'free'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
