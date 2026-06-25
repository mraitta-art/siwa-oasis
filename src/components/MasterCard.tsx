'use client';

import React from 'react';

interface CardLink {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  icon?: string;
}

interface MasterCardProps {
  title: string;
  description: string;
  image: string;
  tag?: string;
  variant?: 'vertical' | 'horizontal';
  onCardClick?: () => void;
  links?: CardLink[];
}

/**
 * MasterCard - A cinematic, high-end card component.
 * Features:
 * - Whole-card click action
 * - Independent text-link actions (using stopPropagation)
 * - Premium hover effects and cinematic styling
 */
export default function MasterCard({
  title,
  description,
  image,
  tag,
  variant = 'vertical',
  onCardClick,
  links = []
}: MasterCardProps) {
  return (
    <div 
      className={`master-card ${variant} animate-in fade-in`} 
      onClick={onCardClick}
    >
      {/* Visual Header */}
      <div className="master-card-image-wrapper">
        <img src={image} alt={title} className="master-card-image" />
        <div className="master-card-overlay"></div>
      </div>

      {/* Card Content */}
      <div className="master-card-content">
        {tag && typeof tag === 'string' && <div className="master-card-tag">{tag.toUpperCase()}</div>}
        
        <h3 className="master-card-title">{title}</h3>
        <p className="master-card-description">{description}</p>

        {/* Action Links */}
        {links.length > 0 && (
          <div className="master-card-actions">
            {links.map((link, idx) => (
              <a
                key={idx}
                href="#"
                className="master-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevents triggering onCardClick
                  link.onClick(e);
                }}
              >
                {link.icon && <i className={`fas ${link.icon}`}></i>}
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
