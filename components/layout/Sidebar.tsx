'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, Calendar, CheckCircle2, XCircle, Clock,
  BarChart3, Settings, Target, IndianRupee, ListChecks, Mic, Plus,
} from 'lucide-react';

const externalItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/events/new', icon: PlusCircle, label: 'Add Event' },
  { href: '/events', icon: ListChecks, label: 'All Events' },
  { href: '/events?stage=approved', icon: Calendar, label: 'Upcoming Events' },
  { href: '/events?stage=attended', icon: CheckCircle2, label: 'Attended Events' },
  { href: '/events?recommendation=no-go', icon: XCircle, label: 'No-Go Events' },
  { href: '/events?approvalStatus=submitted', icon: Clock, label: 'Approval Queue' },
  { href: '/budget', icon: IndianRupee, label: 'Budget Tracker' },
  { href: '/reports', icon: BarChart3, label: 'ROI Reports' },
];

const internalItems = [
  { href: '/internal-events/new', icon: Plus, label: 'Host an Event' },
  { href: '/internal-events', icon: Mic, label: 'Hosted Events' },
  { href: '/internal-events?stage=planning', icon: Calendar, label: 'In Planning' },
  { href: '/internal-events?stage=completed', icon: CheckCircle2, label: 'Completed' },
];

const bottomItems = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  const base = href.split('?')[0];
  if (href === '/events/new' || href === '/internal-events/new') return pathname === href;
  if (href.includes('?')) return pathname === base && typeof window !== 'undefined'
    ? window.location.href.includes(href.split('?')[1] ?? '')
    : false;
  if (base === '/events') return pathname === '/events' || (pathname.startsWith('/events/') && !pathname.startsWith('/events/new'));
  if (base === '/internal-events') return pathname === '/internal-events' || (pathname.startsWith('/internal-events/') && !pathname.startsWith('/internal-events/new'));
  return pathname.startsWith(base);
}

function NavLink({ href, icon: Icon, label, isActive }: {
  href: string; icon: React.ElementType; label: string; isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  // For query-param based active matching, do it client-side simply:
  const search = typeof window !== 'undefined' ? window.location.search : '';

  function active(item: { href: string }): boolean {
    const base = item.href.split('?')[0];
    const qs = item.href.includes('?') ? item.href.split('?')[1] : null;
    if (item.href === '/') return pathname === '/';
    if (item.href === '/events/new') return pathname === '/events/new';
    if (item.href === '/internal-events/new') return pathname === '/internal-events/new';
    if (qs) return pathname === base && search.includes(qs);
    if (base === '/events') return pathname === '/events' || (pathname.startsWith('/events/') && pathname !== '/events/new');
    if (base === '/internal-events') return pathname === '/internal-events' || (pathname.startsWith('/internal-events/') && pathname !== '/internal-events/new');
    return pathname.startsWith(base);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-400" />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Event Decision</p>
            <p className="text-indigo-400 text-xs">Engine</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {/* External events */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">External Events</p>
          <div className="space-y-0.5">
            {externalItems.map((item) => (
              <NavLink key={item.href} {...item} isActive={active(item)} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Internal events */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">Hosted Events</p>
          <div className="space-y-0.5">
            {internalItems.map((item) => (
              <NavLink key={item.href} {...item} isActive={active(item)} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Bottom */}
        <div className="space-y-0.5">
          {bottomItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={active(item)} />
          ))}
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">B2B SaaS Event OS</p>
        <p className="text-slate-600 text-xs">v1.0 · India</p>
      </div>
    </aside>
  );
}
