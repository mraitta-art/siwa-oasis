'use client';

import React, { useState } from 'react';
import { Tabs } from '@heroui/react';

/**
 * PillarTabs — the reusable HeroUI tab band that switches between platform
 * sections (pillar pages and the homepage gateway).
 *
 * Two rules shape it:
 * - Panels are plain mounted nodes toggled with the `hidden` attribute, never
 *   unmounted. Content handed to an inactive tab still ships in the server
 *   HTML, so the tabs reorganise the page without hiding it from crawlers.
 * - It is the only client island a pillar page needs: the page keeps full SSR
 *   and hands its server-fetched body down as React nodes.
 */

export interface PillarTab {
  id: string;
  label: string;
  icon?: string;
  /** Panel body — any server-rendered markup handed down by the page. */
  content: React.ReactNode;
}

export default function PillarTabs({
  ar,
  accent,
  tabs,
  defaultTab,
  ariaLabel,
}: {
  ar: boolean;
  accent: string;
  tabs: PillarTab[];
  defaultTab?: string;
  ariaLabel?: string;
}) {
  const [selected, setSelected] = useState(defaultTab ?? tabs[0]?.id ?? '');

  return (
    <div dir={ar ? 'rtl' : 'ltr'}>
      <Tabs.Root
        aria-label={ariaLabel}
        variant="secondary"
        selectedKey={selected}
        onSelectionChange={key => setSelected(String(key))}
      >
        <Tabs.ListContainer>
          <Tabs.List>
            {tabs.map(t => (
              <Tabs.Tab key={t.id} id={t.id}>
                {/* HeroUI's indicator is React Aria's SelectionIndicator: an empty
                    absolutely-positioned element (the underline in the secondary
                    variant) that reads the item it lives in, so it sits inside the
                    tab next to the label rather than wrapping it. */}
                <Tabs.Indicator />
                {t.icon && (
                  <i
                    className={`fas ${t.icon}`}
                    aria-hidden="true"
                    style={{
                      color: selected === t.id ? accent : 'var(--text-light)',
                      marginInlineEnd: '0.45rem',
                    }}
                  />
                )}
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {tabs.map(t => (
          <div key={t.id} role="tabpanel" hidden={selected !== t.id} style={{ paddingTop: '1.5rem' }}>
            {t.content}
          </div>
        ))}
      </Tabs.Root>
    </div>
  );
}
