import Link from 'next/link';
import {
  ArrowUpRight,
  BadgePercent,
  Boxes,
  CircleAlert,
  Compass,
  Eye,
  FileCheck2,
  MapPinned,
  Package,
  Route,
  Tags,
  UsersRound,
} from 'lucide-react';

const workspaces = [
  {
    title: 'Visitor Journeys',
    description: 'Shape visitor choices, reusable trip templates, and incoming journey requests.',
    icon: Compass,
    tools: [
      { label: 'Journey catalog & request center', detail: 'Edit visible options, prices, bilingual content, and vendor routing.', href: '/jana/requests', icon: Route },
      { label: 'Journey templates', detail: 'Manage featured multi-day itineraries shown in the visitor planner.', href: '/jana/journey-templates-manager', icon: MapPinned },
      { label: 'Visitor journey requests', detail: 'Review requests and coordinate responses.', href: '/admin/journey-requests', icon: FileCheck2 },
      { label: 'Preview visitor journey', detail: 'Open the public journey builder preview.', href: '/customize-journey', icon: Eye, external: true },
    ],
  },
  {
    title: 'Business Products & Offers',
    description: 'Open the existing tools for packages, custom tours, offers, and discounts.',
    icon: Package,
    tools: [
      { label: 'Custom visitor packages', detail: 'Compose multi-stop tour products from business listings.', href: '/jana/tour-builder', icon: Boxes },
      { label: 'Package management', detail: 'Manage marketplace package records.', href: '/admin/packages', icon: Package },
      { label: 'Offer management', detail: 'Open the current offer setup workspace.', href: '/admin/offers', icon: Tags },
      { label: 'Discount controls', detail: 'Open the current discount workspace.', href: '/admin/discounts', icon: BadgePercent },
    ],
  },
  {
    title: 'Approvals & Dispatch',
    description: 'Coordinate business access and follow journey requests through to vendors.',
    icon: UsersRound,
    tools: [
      { label: 'Vendor approvals', detail: 'Review vendor account approval status.', href: '/jana/vendor-approvals', icon: FileCheck2 },
      { label: 'Vendor directory', detail: 'Open business and vendor records.', href: '/jana/vendors', icon: UsersRound },
      { label: 'Dispatch engine', detail: 'Manage operational dispatch workflows.', href: '/jana/dispatch', icon: Route },
    ],
  },
];

export default function JourneyCommerceCenterPage() {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-7 sm:py-9 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-800" />
              Private admin workspace
            </div>
            <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">Journey &amp; Commerce Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              A single starting point for visitor journeys, business products, approvals, and dispatch.
            </p>
          </div>
          <Link
            href="/jana/requests"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Open journey control <ArrowUpRight size={16} />
          </Link>
        </header>

        <section aria-label="Workspace status" className="my-6 grid gap-3 md:grid-cols-2">
          <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <Eye className="mt-0.5 shrink-0 text-slate-700" size={18} />
            <div>
              <h2 className="text-sm font-extrabold">Private access</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">This workspace is under the protected Jana admin area. Public visitors only reach the journey preview and published content.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <CircleAlert className="mt-0.5 shrink-0 text-amber-800" size={18} />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Catalogs are not fully unified yet</h2>
              <p className="mt-1 text-xs leading-5 text-slate-700">Journey templates, visitor options, and business packages/offers still use separate workflows. Changes made in one tool may not appear in the others automatically.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          {workspaces.map((workspace) => {
            const GroupIcon = workspace.icon;
            return (
              <section key={workspace.title} className="rounded-lg border border-slate-200 bg-white px-4 sm:px-5">
                <div className="flex items-start gap-3 border-b border-slate-100 py-5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
                    <GroupIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{workspace.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{workspace.description}</p>
                  </div>
                </div>
                <nav aria-label={workspace.title}>
                  {workspace.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        target={tool.external ? '_blank' : undefined}
                        rel={tool.external ? 'noreferrer' : undefined}
                        className="group flex min-h-[68px] items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 hover:bg-slate-50"
                      >
                        <ToolIcon className="shrink-0 text-slate-500 group-hover:text-slate-900" size={17} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-800">{tool.label}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{tool.detail}</span>
                        </span>
                        <ArrowUpRight className="shrink-0 text-slate-400 group-hover:text-slate-900" size={15} />
                      </Link>
                    );
                  })}
                </nav>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}