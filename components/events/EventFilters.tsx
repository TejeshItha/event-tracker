'use client';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const RECOMMENDATION_FILTERS = [
  { value: '', label: 'All' },
  { value: 'go', label: 'Go' },
  { value: 'conditional-go', label: 'Conditional Go' },
  { value: 'no-go', label: 'No-Go' },
];

const BUCKET_FILTERS = [
  { value: '', label: 'All Buckets' },
  { value: 'low-cost', label: 'Low-cost' },
  { value: 'micro', label: 'Micro' },
  { value: 'mini', label: 'Mini' },
  { value: 'major', label: 'Major' },
  { value: 'strategic', label: 'Strategic' },
];

const STAGE_FILTERS = [
  { value: '', label: 'All Stages' },
  { value: 'draft', label: 'Draft' },
  { value: 'scored', label: 'Scored' },
  { value: 'awaiting-approval', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'planning', label: 'Planning' },
  { value: 'attended', label: 'Attended' },
  { value: 'roi-review', label: 'ROI Review' },
];

export default function EventFilters({ current }: { current: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    const merged = { ...current, [key]: value };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 flex-wrap">
      <div>
        <span className="text-xs font-medium text-slate-500 mr-2">Decision:</span>
        {RECOMMENDATION_FILTERS.map((f) => (
          <Link key={f.value} href={buildUrl('recommendation', f.value)}
            className={`text-xs px-2.5 py-1 rounded-full mr-1 transition-colors ${
              (current.recommendation || '') === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {f.label}
          </Link>
        ))}
      </div>
      <div>
        <span className="text-xs font-medium text-slate-500 mr-2">Bucket:</span>
        {BUCKET_FILTERS.map((f) => (
          <Link key={f.value} href={buildUrl('bucket', f.value)}
            className={`text-xs px-2.5 py-1 rounded-full mr-1 transition-colors ${
              (current.bucket || '') === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {f.label}
          </Link>
        ))}
      </div>
      <div>
        <span className="text-xs font-medium text-slate-500 mr-2">Stage:</span>
        {STAGE_FILTERS.map((f) => (
          <Link key={f.value} href={buildUrl('stage', f.value)}
            className={`text-xs px-2.5 py-1 rounded-full mr-1 transition-colors ${
              (current.stage || '') === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
