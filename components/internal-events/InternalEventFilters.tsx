'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { INTERNAL_FORMAT_LABELS, INTERNAL_STAGE_LABELS, InternalEventFormat, InternalEventStage } from '@/lib/internal-types';

const STAGE_FILTERS: { label: string; value: InternalEventStage }[] = [
  { label: 'Planning', value: 'planning' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Invites Sent', value: 'invites-sent' },
  { label: 'Registrations Open', value: 'registrations-open' },
  { label: 'Live', value: 'live' },
  { label: 'Completed', value: 'completed' },
  { label: 'Post Follow-up', value: 'post-follow-up' },
  { label: 'Archived', value: 'archived' },
];

const FORMAT_FILTERS: { label: string; value: InternalEventFormat }[] = [
  { label: 'Fireside Chat', value: 'fireside-chat' },
  { label: 'CXO Roundtable', value: 'cxo-roundtable' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Podcast', value: 'podcast-session' },
  { label: 'Virtual Summit', value: 'virtual-summit' },
  { label: 'Networking Dinner', value: 'networking-dinner' },
  { label: 'Demo Day', value: 'demo-day' },
  { label: 'Partner Day', value: 'partner-day' },
];

function buildHref(base: string, current: Record<string, string | undefined>, key: string, value: string) {
  const params = new URLSearchParams();
  Object.entries(current).forEach(([k, v]) => { if (v && k !== key) params.set(k, v); });
  if (current[key] !== value) params.set(key, value);
  const qs = params.toString();
  return `${base}${qs ? '?' + qs : ''}`;
}

export default function InternalEventFilters({ current }: { current: Record<string, string | undefined> }) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      {/* Stage */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-medium w-12">Stage</span>
        <Link
          href={pathname}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!current.stage ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All
        </Link>
        {STAGE_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref(pathname, current, 'stage', f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${current.stage === f.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {/* Format */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-medium w-12">Format</span>
        {FORMAT_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref(pathname, current, 'format', f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${current.format === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
