'use client';

import React, { useState } from 'react';

export default function SearchPagesPage() {
  const [pages, setPages] = useState<any[]>([
    { id: '1', title: 'Top Rated Hotels', slug: 'top-rated-hotels', target_type: 'accommodation', target_id: 'hotel' },
    { id: '2', title: 'Desert Adventures', slug: 'desert-tours', target_type: 'activities', target_id: 'safari' }
  ]);

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-route"></i> Custom Landing Pages (SEO Slugs)</h3>
        <button className="btn btn-primary btn-sm"><i className="fas fa-plus"></i> New URL Slug</button>
      </div>

      <div className="notification-banner">
        <i className="fas fa-link"></i> Map clean URL paths (like <code>/search/best-hotels</code>) to specific categories and search engine filters.
      </div>

      <table>
        <thead>
          <tr>
            <th>Page Title</th>
            <th>Public URL Path (Slug)</th>
            <th>Target Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(p => (
            <tr key={p.id}>
              <td><strong>{p.title}</strong></td>
              <td><code>/search/{p.slug}</code></td>
              <td><span className="badge badge-info">{p.target_id}</span></td>
              <td><span className="badge badge-success">Live</span></td>
              <td>
                <button className="btn btn-xs btn-outline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
