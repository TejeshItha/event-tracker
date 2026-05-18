// ─── Enums / Union types ───────────────────────────────────────────────────────

export type InternalEventFormat =
  | 'fireside-chat'
  | 'cxo-roundtable'
  | 'podcast-session'
  | 'webinar'
  | 'virtual-summit'
  | 'customer-advisory-board'
  | 'partner-day'
  | 'demo-day'
  | 'networking-dinner'
  | 'thought-leadership-panel'
  | 'product-launch'
  | 'training-workshop'
  | 'community-meetup'
  | 'hackathon'
  | 'other';

export type InternalEventStage =
  | 'ideation'
  | 'planning'
  | 'confirmed'
  | 'invites-sent'
  | 'registrations-open'
  | 'live'
  | 'completed'
  | 'post-follow-up'
  | 'archived';

export type InternalEventMode = 'online' | 'offline' | 'hybrid';

export type InternalROIStatus = 'strong' | 'moderate' | 'weak' | 'pending';

export type InternalRepeatDecision =
  | 'repeat'
  | 'repeat-bigger'
  | 'repeat-smaller'
  | 'do-not-repeat'
  | 're-evaluate';

// ─── Sub-structures ────────────────────────────────────────────────────────────

export interface Speaker {
  id: string;
  name: string;
  designation: string;
  company: string;
  topic: string;
  confirmed: boolean;
  notes: string;
}

export interface InternalEventBudget {
  venueCost: number;
  avEquipmentCost: number;
  cateringCost: number;
  speakerFeeCost: number;
  travelCost: number;
  decorCost: number;
  photographyCost: number;
  marketingPromoCost: number;
  giftsSwagCost: number;
  platformToolsCost: number;
  miscCost: number;
  totalEstimatedCost: number;
  actualTotalCost?: number;
  budgetOwner: string;
}

export interface InternalTargetMetrics {
  targetInvites: number;
  targetRegistrations: number;
  targetAttendees: number;
  targetIcpAttendees: number;
  targetMeetings: number;
  targetPipeline: number;
  targetContentAssets: number;
  targetSocialPosts: number;
}

export interface InternalActualMetrics {
  invitesSent: number;
  registrations: number;
  actualAttendees: number;
  icpAttendees: number;
  customerAttendees: number;
  prospectAttendees: number;
  partnerAttendees: number;
  peakViewers: number;
  avgEngagementMinutes: number;
  meetings: number;
  followUpRequests: number;
  contentAssetsCreated: number;
  socialMentions: number;
  pipeline: number;
  npsScore: number;
  notes: string;
}

export interface InternalEventChecklistItem {
  id: string;
  task: string;
  phase: 'pre-event' | 'during-event' | 'post-event';
  completed: boolean;
  completedDate?: string;
  assignee?: string;
}

export interface InternalPostEventReview {
  roiStatus: InternalROIStatus;
  repeatDecision: InternalRepeatDecision;
  whatWorkedWell: string;
  whatToImprove: string;
  lessonsLearned: string;
  reviewedBy: string;
  reviewDate: string;
}

// ─── Main entity ───────────────────────────────────────────────────────────────

export interface InternalEvent {
  id: string;
  // Profile
  name: string;
  format: InternalEventFormat;
  theme: string;
  description: string;
  mode: InternalEventMode;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  platformLink: string;
  registrationLink: string;
  isInviteOnly: boolean;
  // Team
  eventOwner: string;
  marketingOwner: string;
  salesOwner: string;
  // Objectives & Audience
  primaryObjective: string;
  secondaryObjective: string;
  targetAudience: string;
  targetPersonas: string[];
  targetIndustries: string[];
  estimatedAudienceSize: number;
  // Stage
  stage: InternalEventStage;
  // Budget
  budget: InternalEventBudget;
  // Speakers
  speakers: Speaker[];
  // Metrics
  targetMetrics: InternalTargetMetrics;
  actualMetrics?: InternalActualMetrics;
  // Checklist
  checklist: InternalEventChecklistItem[];
  // Post-event
  postEventReview?: InternalPostEventReview;
  // Meta
  createdAt: string;
  updatedAt: string;
  notes: string;
}

// ─── Label maps ────────────────────────────────────────────────────────────────

export const INTERNAL_FORMAT_LABELS: Record<InternalEventFormat, string> = {
  'fireside-chat': 'Fireside Chat',
  'cxo-roundtable': 'CXO Roundtable',
  'podcast-session': 'Podcast Session',
  webinar: 'Webinar',
  'virtual-summit': 'Virtual Summit',
  'customer-advisory-board': 'Customer Advisory Board',
  'partner-day': 'Partner Day',
  'demo-day': 'Demo Day',
  'networking-dinner': 'Networking Dinner',
  'thought-leadership-panel': 'Thought Leadership Panel',
  'product-launch': 'Product Launch',
  'training-workshop': 'Training Workshop',
  'community-meetup': 'Community Meetup',
  hackathon: 'Hackathon',
  other: 'Other',
};

export const INTERNAL_STAGE_LABELS: Record<InternalEventStage, string> = {
  ideation: 'Ideation',
  planning: 'Planning',
  confirmed: 'Confirmed',
  'invites-sent': 'Invites Sent',
  'registrations-open': 'Registrations Open',
  live: 'Live',
  completed: 'Completed',
  'post-follow-up': 'Post Follow-up',
  archived: 'Archived',
};

export const INTERNAL_STAGE_ORDER: InternalEventStage[] = [
  'ideation',
  'planning',
  'confirmed',
  'invites-sent',
  'registrations-open',
  'live',
  'completed',
  'post-follow-up',
  'archived',
];

export const INTERNAL_OBJECTIVES = [
  'Lead Generation',
  'Pipeline Acceleration',
  'Customer Engagement & Retention',
  'Brand & Thought Leadership',
  'Product Awareness & Education',
  'Partner Engagement',
  'Community Building',
  'Analyst / Media Visibility',
  'Content Creation',
  'Cross-sell / Upsell',
  'Market Intelligence',
  'Employer Branding',
];

export const PERSONA_OPTIONS = [
  'CXO / C-Suite',
  'CTO / VP Engineering',
  'CMO / VP Marketing',
  'CSO / VP Sales',
  'CISO / VP Security',
  'CFO / Finance Head',
  'CDO / Data Head',
  'Product Leaders',
  'IT Decision Makers',
  'Operations Heads',
  'Founders / Co-founders',
  'Senior Managers',
];

export const INDUSTRY_OPTIONS = [
  'BFSI',
  'Fintech',
  'SaaS / Tech',
  'Healthcare',
  'Manufacturing',
  'Retail / E-commerce',
  'Logistics',
  'Education / EdTech',
  'Government / PSU',
  'Media & Entertainment',
  'Real Estate',
  'Consulting',
  'Other',
];

// ─── Checklist generator ───────────────────────────────────────────────────────

export function generateInternalChecklist(
  format: InternalEventFormat,
  mode: InternalEventMode,
): InternalEventChecklistItem[] {
  const pre: string[] = [
    'Define event objectives and success metrics',
    'Confirm event date, time, and duration',
    'Set up registration / landing page',
    'Set up CRM campaign and UTM tracking',
    'Finalize speaker lineup and confirm speakers',
    'Prepare speaker briefing documents',
    'Conduct speaker dry run',
    'Create invitation list (target accounts)',
    'Send save-the-date / initial invitations',
    'Schedule reminder emails (1 week, 1 day, 1 hour before)',
    'Create event content and agenda',
    'Brief internal team and assign roles',
    'Set up lead capture / attendee tracking',
    'Schedule social media posts',
    'Prepare post-event follow-up email sequence',
  ];

  if (mode === 'online' || mode === 'hybrid') {
    pre.push(
      'Set up webinar / virtual platform',
      'Test platform with speakers and moderators',
      'Configure recording settings',
    );
  }
  if (mode === 'offline' || mode === 'hybrid') {
    pre.push(
      'Confirm venue booking',
      'Arrange AV equipment and on-site setup',
      'Arrange catering / refreshments',
      'Organize name badges and registration desk',
      'Arrange decor and signage',
    );
  }
  if (format === 'cxo-roundtable' || format === 'customer-advisory-board' || format === 'networking-dinner') {
    pre.push(
      'Prepare curated seating arrangement',
      'Create discussion guide / facilitation notes',
    );
  }
  if (format === 'podcast-session') {
    pre.push(
      'Prepare interview questions',
      'Set up recording studio / audio equipment',
      'Plan podcast distribution channels',
    );
  }
  if (format === 'demo-day' || format === 'product-launch') {
    pre.push(
      'Prepare product demo environment',
      'Test all demos end-to-end',
    );
  }

  const during: string[] = [
    'Track attendance / check-ins',
    'Start session recording',
    'Capture leads and interactions',
    'Post live social updates',
    'Collect real-time attendee feedback',
  ];

  if (mode === 'online' || mode === 'hybrid') {
    during.push('Monitor chat and Q&A, assign moderator');
  }

  const post: string[] = [
    'Send follow-up email to attendees within 24 hours',
    'Send follow-up email to no-shows',
    'Upload leads / contacts to CRM',
    'Sales team follow-up within 48 hours',
    'Edit and publish session recording',
    'Create blog / LinkedIn post from event',
    'Repurpose content (clips, quotes, summary)',
    'Update actual attendance and metrics in tracker',
    'Schedule post-event team review meeting',
    'Document lessons learned',
  ];

  const all = [
    ...pre.map((task, i) => ({ id: `pre-${i + 1}`, task, phase: 'pre-event' as const, completed: false })),
    ...during.map((task, i) => ({ id: `dur-${i + 1}`, task, phase: 'during-event' as const, completed: false })),
    ...post.map((task, i) => ({ id: `post-${i + 1}`, task, phase: 'post-event' as const, completed: false })),
  ];

  return all;
}

// ─── Budget helper ─────────────────────────────────────────────────────────────

export function calculateInternalTotalCost(b: Omit<InternalEventBudget, 'totalEstimatedCost' | 'actualTotalCost' | 'budgetOwner'>): number {
  return (
    (b.venueCost || 0) +
    (b.avEquipmentCost || 0) +
    (b.cateringCost || 0) +
    (b.speakerFeeCost || 0) +
    (b.travelCost || 0) +
    (b.decorCost || 0) +
    (b.photographyCost || 0) +
    (b.marketingPromoCost || 0) +
    (b.giftsSwagCost || 0) +
    (b.platformToolsCost || 0) +
    (b.miscCost || 0)
  );
}
