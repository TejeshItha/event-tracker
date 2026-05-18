export type EventBucket = 'low-cost' | 'micro' | 'mini' | 'major' | 'strategic';

export type EventStage =
  | 'draft'
  | 'proposed'
  | 'under-evaluation'
  | 'scored'
  | 'awaiting-approval'
  | 'approved'
  | 'rejected'
  | 'planning'
  | 'live'
  | 'attended'
  | 'post-follow-up'
  | 'roi-review'
  | 'archived';

export type Recommendation = 'go' | 'conditional-go' | 'no-go' | 'strategic-approval-required';

export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'needs-info'
  | 'approved-with-conditions'
  | 'overridden';

export type EventFormat =
  | 'meetup'
  | 'webinar'
  | 'conference'
  | 'trade-show'
  | 'roundtable'
  | 'summit'
  | 'partner-event'
  | 'government-event'
  | 'analyst-event'
  | 'customer-event'
  | 'industry-association-event'
  | 'workshop'
  | 'product-demo-event'
  | 'college-talent-event'
  | 'other';

export type EventObjective =
  | 'brand-visibility'
  | 'saas-registrations'
  | 'lead-generation'
  | 'enterprise-pipeline'
  | 'deal-acceleration'
  | 'partnerships'
  | 'thought-leadership'
  | 'customer-engagement'
  | 'market-intelligence'
  | 'product-feedback'
  | 'analyst-media-visibility'
  | 'content-creation'
  | 'employer-branding'
  | 'new-market-entry'
  | 'new-vertical-exploration'
  | 'competitor-intelligence'
  | 'community-building';

export type AudienceFit = 'strong' | 'moderate' | 'weak';
export type SalesReadiness = 'ready' | 'partially-ready' | 'not-ready';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ROIStatus = 'strong' | 'moderate' | 'weak' | 'strategic' | 'failed' | 'pending';
export type RepeatDecision =
  | 'repeat'
  | 'repeat-higher'
  | 'repeat-lower'
  | 'speak-only'
  | 'target-accounts-only'
  | 'do-not-repeat'
  | 're-evaluate';

export interface BudgetDetails {
  sponsorshipCost: number;
  boothCost: number;
  travelCost: number;
  stayCost: number;
  localTransportCost: number;
  teamCost: number;
  boothMaterialCost: number;
  merchandiseCost: number;
  brochureCost: number;
  contentProductionCost: number;
  photographyCost: number;
  paidPromotionCost: number;
  miscCost: number;
  totalEstimatedCost: number;
  actualTotalCost?: number;
  budgetOwner: string;
  paymentDeadline?: string;
  isCostNegotiable: boolean;
  isSponsorshipConfirmed: boolean;
}

export interface PackageAssets {
  // Visibility
  logoPlacement: boolean;
  websiteListing: boolean;
  bannerPlacement: boolean;
  socialMediaMentions: boolean;
  sponsorMention: boolean;
  // Engagement
  booth: boolean;
  demoTable: boolean;
  networkingAccess: boolean;
  vipLoungeAccess: boolean;
  workshop: boolean;
  roundtable: boolean;
  // Data
  attendeeList: boolean;
  leadScanner: boolean;
  registrationsAccess: boolean;
  sponsorDatabase: boolean;
  eventAppLeads: boolean;
  // Authority
  speakingSlot: boolean;
  keynote: boolean;
  panelParticipation: boolean;
  firesideChatModerator: boolean;
  analystMeeting: boolean;
  // Follow-up
  emailCampaignInclusion: boolean;
  meetingSchedulerAccess: boolean;
  hostedBuyerMeetings: boolean;
  postEventReport: boolean;
  retargetingAccess: boolean;
  // Content
  photographyRights: boolean;
  videoRights: boolean;
  sessionRecording: boolean;
  mediaInterview: boolean;
  oneonOneMeetings: boolean;
}

export interface AudienceDetails {
  expectedAttendees: number;
  icpPercentage: number;
  industries: string[];
  companySizes: string[];
  personas: string[];
  audienceSeniority: 'executive' | 'senior' | 'mid' | 'junior' | 'mixed' | 'unknown';
  decisionMakersPresent: boolean;
  namedTargetAccounts: number;
  existingCustomersPresent: boolean;
  partnersPresent: boolean;
  analystsPresent: boolean;
  mediaPresent: boolean;
  competitorsPresent: boolean;
  audienceType: 'paid' | 'invited' | 'free' | 'open' | 'mixed';
  isCurated: boolean;
  attendeeListAvailable: boolean;
  designationListAvailable: boolean;
  audienceInfoConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  audienceFit: AudienceFit;
}

export interface ExpectedMetrics {
  leads: number;
  icpLeads: number;
  mqls: number;
  sqls: number;
  meetings: number;
  demos: number;
  opportunities: number;
  pipeline: number;
  partnerConversations: number;
  customerMeetings: number;
  contentAssets: number;
  brandVisibility: string;
  thoughtLeadershipValue: string;
  socialPosts: number;
  videos: number;
  blogs: number;
}

export interface ActualMetrics {
  leads: number;
  icpLeads: number;
  mqls: number;
  sqls: number;
  meetings: number;
  demos: number;
  opportunities: number;
  pipeline: number;
  partnerConversations: number;
  customerMeetings: number;
  contentAssets: number;
  actualCost: number;
  followUpCompletionPercent: number;
  notes: string;
}

export interface SalesReadinessDetails {
  eventOwnerAssigned: boolean;
  salesOwnerAssigned: boolean;
  marketingOwnerAssigned: boolean;
  leadershipSponsorAssigned: boolean;
  salesInvolvedBeforeEvent: boolean;
  targetAccountListPrepared: boolean;
  preEventOutreachStarted: boolean;
  preEventMeetingsBeingBooked: boolean;
  demoReady: boolean;
  pitchDeckReady: boolean;
  pitchCustomized: boolean;
  qualificationQuestionsReady: boolean;
  leadCaptureReady: boolean;
  crmCampaignSetUp: boolean;
  leadSourceTrackingSetUp: boolean;
  utmTrackingSetUp: boolean;
  qrCodeTrackingSetUp: boolean;
  postEventEmailSequenceReady: boolean;
  linkedInFollowUpReady: boolean;
  salesFollowUpSLADefined: boolean;
  contentPlanReady: boolean;
  postEventReviewScheduled: boolean;
  readinessLevel: SalesReadiness;
}

export interface RiskDetails {
  organizerCredible: boolean;
  audienceQualityVerified: boolean;
  attendeeDataGuaranteed: boolean;
  riskOfPoorFootfall: boolean;
  riskOfLowICPFit: boolean;
  riskOfVendorHeavyAudience: boolean;
  riskOfGenericAudience: boolean;
  teamBandwidthAvailable: boolean;
  dateConflict: boolean;
  campaignConflict: boolean;
  packageOverpriced: boolean;
  dependencyOnUnverifiedPromises: boolean;
  isNewEvent: boolean;
  audienceOverlapWithOtherEvent: boolean;
  attendedBefore: boolean;
  previousROIPositive: boolean;
  competitorsHeavilyPresent: boolean;
  poorBoothLocation: boolean;
  poorSpeakingSlotTiming: boolean;
  attendeeListUnavailable: boolean;
  noFollowUpAccess: boolean;
  noInternalOwner: boolean;
  noPostEventPlan: boolean;
  riskLevel: RiskLevel;
}

export interface ConfidenceDetails {
  audienceSizeConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  audienceSeniorityConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  icpPercentageConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  namedAccountsConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  attendeeListConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  leadScannerConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  speakingSlotConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  boothLocationConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  meetingSchedulerConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  costConfidence: 'confirmed' | 'verbal' | 'organizer-estimate' | 'internal-estimate' | 'unknown';
  overallConfidence: ConfidenceLevel;
}

export interface ScoreBreakdown {
  icpFit: number;
  businessValue: number;
  packageQuality: number;
  strategicValue: number;
  salesReadiness: number;
  costEfficiency: number;
  riskPenalty: number;
  confidenceAdjustment: number;
  totalScore: number;
}

export interface ConditionalGoRequirement {
  condition: string;
  status: 'pending' | 'met';
}

export interface ApprovalRecord {
  approverName: string;
  approverRole: string;
  status: 'approved' | 'rejected' | 'needs-info' | 'overridden';
  date: string;
  notes: string;
  overrideReason?: string;
  expectedStrategicValue?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  phase: 'pre-event' | 'during-event' | 'post-event';
  completed: boolean;
  completedDate?: string;
  assignee?: string;
}

export interface PostEventReview {
  roiStatus: ROIStatus;
  repeatDecision: RepeatDecision;
  lessonsLearned: string;
  whatWorkedWell: string;
  whatToImprove: string;
  reviewedBy: string;
  reviewDate: string;
}

export interface Event {
  id: string;
  // Profile
  name: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  country: string;
  mode: 'online' | 'offline' | 'hybrid';
  format: EventFormat;
  theme: string;
  websiteLink: string;
  eventBrochure?: string;
  expectedAudienceSize: number;
  hasPastEdition: boolean;
  previousYearAttendance?: number;
  organizerCredibilityNotes: string;
  // Lifecycle
  stage: EventStage;
  bucket: EventBucket;
  // Objectives
  primaryObjective: EventObjective;
  secondaryObjective?: EventObjective;
  tertiaryObjective?: EventObjective;
  // Details
  budget: BudgetDetails;
  audience: AudienceDetails;
  package: PackageAssets;
  expectedMetrics: ExpectedMetrics;
  actualMetrics?: ActualMetrics;
  salesReadiness: SalesReadinessDetails;
  risk: RiskDetails;
  confidence: ConfidenceDetails;
  // Scoring
  scoreBreakdown: ScoreBreakdown;
  recommendation: Recommendation;
  recommendationReasons: string[];
  conditionalGoRequirements: ConditionalGoRequirement[];
  // Approval
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  eventOwner: string;
  salesOwner: string;
  marketingOwner: string;
  // Planning
  checklist: ChecklistItem[];
  // Post-event
  postEventReview?: PostEventReview;
  // Meta
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface AppSettings {
  annualBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  currentQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  currentYear: number;
  companyName: string;
  scoringWeights: {
    [bucket in EventBucket]: {
      icpFit: number;
      businessValue: number;
      packageQuality: number;
      strategicValue: number;
      salesReadiness: number;
      costEfficiency: number;
    };
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  annualBudget: 5000000,
  q1Budget: 1000000,
  q2Budget: 1500000,
  q3Budget: 1500000,
  q4Budget: 1000000,
  currentQuarter: 'Q2',
  currentYear: 2026,
  companyName: 'My Company',
  scoringWeights: {
    'low-cost': { icpFit: 20, businessValue: 10, packageQuality: 10, strategicValue: 25, salesReadiness: 5, costEfficiency: 20 },
    micro: { icpFit: 25, businessValue: 15, packageQuality: 15, strategicValue: 20, salesReadiness: 10, costEfficiency: 15 },
    mini: { icpFit: 25, businessValue: 25, packageQuality: 15, strategicValue: 15, salesReadiness: 10, costEfficiency: 10 },
    major: { icpFit: 25, businessValue: 30, packageQuality: 15, strategicValue: 10, salesReadiness: 15, costEfficiency: 5 },
    strategic: { icpFit: 20, businessValue: 25, packageQuality: 15, strategicValue: 20, salesReadiness: 15, costEfficiency: 5 },
  },
};

export const BUCKET_RANGES: Record<EventBucket, { min: number; max: number; label: string }> = {
  'low-cost': { min: 0, max: 39999, label: 'Low-cost / Experimental' },
  micro: { min: 40000, max: 99999, label: 'Micro Event' },
  mini: { min: 100000, max: 299999, label: 'Mini Event' },
  major: { min: 300000, max: 600000, label: 'Major Event' },
  strategic: { min: 600001, max: Infinity, label: 'Strategic Event' },
};

export const OBJECTIVE_LABELS: Record<EventObjective, string> = {
  'brand-visibility': 'Brand Visibility',
  'saas-registrations': 'SaaS Registrations',
  'lead-generation': 'Lead Generation',
  'enterprise-pipeline': 'Enterprise Pipeline',
  'deal-acceleration': 'Deal Acceleration',
  partnerships: 'Partnerships',
  'thought-leadership': 'Thought Leadership',
  'customer-engagement': 'Customer Engagement',
  'market-intelligence': 'Market Intelligence',
  'product-feedback': 'Product Feedback',
  'analyst-media-visibility': 'Analyst / Media Visibility',
  'content-creation': 'Content Creation',
  'employer-branding': 'Employer Branding',
  'new-market-entry': 'New Market Entry',
  'new-vertical-exploration': 'New Vertical Exploration',
  'competitor-intelligence': 'Competitor Intelligence',
  'community-building': 'Community Building',
};

export const FORMAT_LABELS: Record<EventFormat, string> = {
  meetup: 'Meetup',
  webinar: 'Webinar',
  conference: 'Conference',
  'trade-show': 'Trade Show',
  roundtable: 'Roundtable',
  summit: 'Summit',
  'partner-event': 'Partner Event',
  'government-event': 'Government Event',
  'analyst-event': 'Analyst / Media Event',
  'customer-event': 'Customer Event',
  'industry-association-event': 'Industry Association Event',
  workshop: 'Workshop',
  'product-demo-event': 'Product Demo Event',
  'college-talent-event': 'College / Talent Event',
  other: 'Other',
};
