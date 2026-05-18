import { Recommendation, EventBucket, EventStage, ApprovalStatus, RiskLevel, ConfidenceLevel, ROIStatus } from '@/lib/types';

const RECOMMENDATION_STYLES: Record<Recommendation, string> = {
  'go': 'bg-green-100 text-green-800 border border-green-200',
  'conditional-go': 'bg-amber-100 text-amber-800 border border-amber-200',
  'no-go': 'bg-red-100 text-red-800 border border-red-200',
  'strategic-approval-required': 'bg-purple-100 text-purple-800 border border-purple-200',
};

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  'go': 'Go',
  'conditional-go': 'Conditional Go',
  'no-go': 'No-Go',
  'strategic-approval-required': 'Strategic Approval Required',
};

const BUCKET_STYLES: Record<EventBucket, string> = {
  'low-cost': 'bg-slate-100 text-slate-700 border border-slate-200',
  micro: 'bg-blue-100 text-blue-700 border border-blue-200',
  mini: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  major: 'bg-orange-100 text-orange-700 border border-orange-200',
  strategic: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const BUCKET_LABELS: Record<EventBucket, string> = {
  'low-cost': 'Low-cost',
  micro: 'Micro',
  mini: 'Mini',
  major: 'Major',
  strategic: 'Strategic',
};

const STAGE_STYLES: Record<EventStage, string> = {
  draft: 'bg-slate-100 text-slate-600',
  proposed: 'bg-slate-100 text-slate-700',
  'under-evaluation': 'bg-blue-100 text-blue-700',
  scored: 'bg-indigo-100 text-indigo-700',
  'awaiting-approval': 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  planning: 'bg-teal-100 text-teal-700',
  live: 'bg-green-200 text-green-800',
  attended: 'bg-slate-200 text-slate-700',
  'post-follow-up': 'bg-purple-100 text-purple-700',
  'roi-review': 'bg-orange-100 text-orange-700',
  archived: 'bg-slate-100 text-slate-500',
};

const STAGE_LABELS: Record<EventStage, string> = {
  draft: 'Draft', proposed: 'Proposed', 'under-evaluation': 'Under Evaluation', scored: 'Scored',
  'awaiting-approval': 'Awaiting Approval', approved: 'Approved', rejected: 'Rejected',
  planning: 'Planning', live: 'Live', attended: 'Attended', 'post-follow-up': 'Post Follow-up',
  'roi-review': 'ROI Review', archived: 'Archived',
};

const RISK_STYLES: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

const ROI_STYLES: Record<ROIStatus, string> = {
  strong: 'bg-green-100 text-green-700',
  moderate: 'bg-blue-100 text-blue-700',
  weak: 'bg-orange-100 text-orange-700',
  strategic: 'bg-purple-100 text-purple-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
};

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

function base(size: 'sm' | 'md' = 'md') {
  return size === 'sm'
    ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
    : 'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold';
}

export function RecommendationBadge({ value, size = 'md', className = '' }: { value: Recommendation } & BadgeProps) {
  return <span className={`${base(size)} ${RECOMMENDATION_STYLES[value]} ${className}`}>{RECOMMENDATION_LABELS[value]}</span>;
}

export function BucketBadge({ value, size = 'md', className = '' }: { value: EventBucket } & BadgeProps) {
  return <span className={`${base(size)} ${BUCKET_STYLES[value]} ${className}`}>{BUCKET_LABELS[value]}</span>;
}

export function StageBadge({ value, size = 'md', className = '' }: { value: EventStage } & BadgeProps) {
  return <span className={`${base(size)} ${STAGE_STYLES[value]} ${className}`}>{STAGE_LABELS[value]}</span>;
}

export function RiskBadge({ value, size = 'md', className = '' }: { value: RiskLevel } & BadgeProps) {
  return <span className={`${base(size)} ${RISK_STYLES[value]} ${className}`}>{value.charAt(0).toUpperCase() + value.slice(1)} Risk</span>;
}

export function ConfidenceBadge({ value, size = 'md', className = '' }: { value: ConfidenceLevel } & BadgeProps) {
  return <span className={`${base(size)} ${CONFIDENCE_STYLES[value]} ${className}`}>{value.charAt(0).toUpperCase() + value.slice(1)} Confidence</span>;
}

export function ROIBadge({ value, size = 'md', className = '' }: { value: ROIStatus } & BadgeProps) {
  const labels: Record<ROIStatus, string> = { strong: 'Strong ROI', moderate: 'Moderate ROI', weak: 'Weak ROI', strategic: 'Strategic ROI', failed: 'Failed', pending: 'Pending Review' };
  return <span className={`${base(size)} ${ROI_STYLES[value]} ${className}`}>{labels[value]}</span>;
}
