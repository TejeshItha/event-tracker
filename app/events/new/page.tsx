'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { classifyEventBucket, calculateTotalCost, formatINR } from '@/lib/classification';
import { EventBucket } from '@/lib/types';

const STEPS = [
  { id: 1, title: 'Event Profile', desc: 'Basic event details and organizer info' },
  { id: 2, title: 'Budget & Cost', desc: 'All cost components and classification' },
  { id: 3, title: 'Objectives', desc: 'Primary, secondary, and tertiary goals' },
  { id: 4, title: 'Audience Fit', desc: 'ICP match, personas, and seniority' },
  { id: 5, title: 'Package Quality', desc: 'What the sponsorship package includes' },
  { id: 6, title: 'Business Value', desc: 'Expected leads, pipeline, and content' },
  { id: 7, title: 'Sales Readiness', desc: 'Execution and follow-up readiness' },
  { id: 8, title: 'Risk Assessment', desc: 'Risks, flags, and mitigations' },
  { id: 9, title: 'Data Confidence', desc: 'How verified is the information?' },
  { id: 10, title: 'Review & Submit', desc: 'Score preview and final submission' },
];

const OBJECTIVES = [
  { value: 'brand-visibility', label: 'Brand Visibility' },
  { value: 'saas-registrations', label: 'SaaS Registrations' },
  { value: 'lead-generation', label: 'Lead Generation' },
  { value: 'enterprise-pipeline', label: 'Enterprise Pipeline' },
  { value: 'deal-acceleration', label: 'Deal Acceleration' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'thought-leadership', label: 'Thought Leadership' },
  { value: 'customer-engagement', label: 'Customer Engagement' },
  { value: 'market-intelligence', label: 'Market Intelligence' },
  { value: 'product-feedback', label: 'Product Feedback' },
  { value: 'analyst-media-visibility', label: 'Analyst / Media Visibility' },
  { value: 'content-creation', label: 'Content Creation' },
  { value: 'employer-branding', label: 'Employer Branding' },
  { value: 'new-market-entry', label: 'New Market Entry' },
  { value: 'new-vertical-exploration', label: 'New Vertical Exploration' },
  { value: 'competitor-intelligence', label: 'Competitor Intelligence' },
  { value: 'community-building', label: 'Community Building' },
];

const FORMATS = [
  'meetup', 'webinar', 'conference', 'trade-show', 'roundtable', 'summit',
  'partner-event', 'government-event', 'analyst-event', 'customer-event',
  'industry-association-event', 'workshop', 'product-demo-event', 'college-talent-event', 'other',
];

const FORMAT_LABELS: Record<string, string> = {
  meetup: 'Meetup', webinar: 'Webinar', conference: 'Conference', 'trade-show': 'Trade Show',
  roundtable: 'Roundtable', summit: 'Summit', 'partner-event': 'Partner Event',
  'government-event': 'Government Event', 'analyst-event': 'Analyst / Media Event',
  'customer-event': 'Customer Event', 'industry-association-event': 'Industry Association Event',
  workshop: 'Workshop', 'product-demo-event': 'Product Demo Event',
  'college-talent-event': 'College / Talent Event', other: 'Other',
};

const PERSONAS = [
  'CIO', 'CTO', 'CDO', 'VP Engineering', 'Head of QA / Testing', 'QA Director', 'QA Manager',
  'Automation Lead', 'DevOps Leader', 'Digital Transformation Leader', 'Product Engineering Leader',
  'Procurement Leader', 'SI / Consulting Partner', 'Technology Partner', 'Startup Founder',
  'Student', 'Generic Audience', 'Other',
];

const INDUSTRIES = [
  'BFSI', 'Healthcare', 'Retail & E-commerce', 'Manufacturing', 'IT Services / ITES',
  'Telecom', 'Education', 'Government / PSU', 'Logistics & Supply Chain',
  'Media & Entertainment', 'Real Estate', 'Automotive', 'Energy & Utilities', 'SaaS / Tech', 'Other',
];

const CONF_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed in writing' },
  { value: 'verbal', label: 'Verbally confirmed' },
  { value: 'organizer-estimate', label: 'Organizer estimate' },
  { value: 'internal-estimate', label: 'Internal estimate' },
  { value: 'unknown', label: 'Unknown' },
];

function InputField({ label, name, type = 'text', value, onChange, placeholder = '', required = false, className = '' }: {
  label: string; name: string; type?: string; value: string | number;
  onChange: (val: string) => void; placeholder?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type} name={name} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required = false, className = '' }: {
  label: string; name: string; value: string; onChange: (val: string) => void;
  options: { value: string; label: string }[]; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select
        name={name} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, name, value, onChange, prefix = '₹', className = '' }: {
  label: string; name: string; value: number; onChange: (val: number) => void;
  prefix?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        <input
          type="number" name={name} value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          min="0"
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, desc }: { label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className={`relative flex-shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => onChange(!checked)}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  );
}

/** Wraps a group of Toggle items with a section header + Select All / Deselect All */
function ToggleSection({
  title,
  fields,
  values,
  onChangeAll,
}: {
  title: string;
  fields: [string, string][];
  values: Record<string, boolean>;
  onChangeAll: (updates: Record<string, boolean>) => void;
}) {
  const allOn  = fields.every(([k]) => !!values[k]);
  const allOff = fields.every(([k]) => !values[k]);
  const onCount = fields.filter(([k]) => !!values[k]).length;

  const setAll = (val: boolean) => {
    const updates: Record<string, boolean> = {};
    fields.forEach(([k]) => { updates[k] = val; });
    onChangeAll(updates);
  };

  return (
    <div>
      {/* Section header row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{onCount}/{fields.length} on</span>
          <button
            type="button"
            onClick={() => setAll(true)}
            disabled={allOn}
            className="text-xs px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            All On
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            disabled={allOff}
            className="text-xs px-2.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            All Off
          </button>
        </div>
      </div>
      {/* Toggle grid */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={!!values[key]}
            onChange={(v) => onChangeAll({ [key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function CheckGroup({ items, selected, onChange, label }: { items: string[]; selected: string[]; onChange: (v: string[]) => void; label?: string }) {
  const allSelected = items.every((i) => selected.includes(i));
  const noneSelected = items.every((i) => !selected.includes(i));

  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter((i) => i !== item));
    else onChange([...selected, item]);
  };

  const selectAll = () => {
    const others = selected.filter((s) => !items.includes(s));
    onChange([...others, ...items]);
  };

  const clearAll = () => {
    onChange(selected.filter((s) => !items.includes(s)));
  };

  return (
    <div className="space-y-2">
      {/* Select All / Clear All bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{selected.filter((s) => items.includes(s)).length}/{items.length} selected</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={noneSelected}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
      {/* Item chips */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item} type="button" onClick={() => toggle(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected.includes(item) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

const BUCKET_COLORS: Record<EventBucket, string> = {
  'low-cost': 'bg-slate-100 text-slate-700 border-slate-300',
  micro: 'bg-blue-100 text-blue-700 border-blue-300',
  mini: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  major: 'bg-orange-100 text-orange-700 border-orange-300',
  strategic: 'bg-purple-100 text-purple-700 border-purple-300',
};
const BUCKET_LABELS_MAP: Record<EventBucket, string> = {
  'low-cost': 'Low-cost / Experimental', micro: 'Micro Event', mini: 'Mini Event', major: 'Major Event', strategic: 'Strategic Event',
};

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1
    name: '', organizer: '', startDate: '', endDate: '', location: '', city: '', state: '',
    country: 'India', mode: 'offline', format: 'conference', theme: '', websiteLink: '',
    expectedAudienceSize: 0, hasPastEdition: false, previousYearAttendance: 0,
    organizerCredibilityNotes: '', eventOwner: '', salesOwner: '', marketingOwner: '',
    // Step 2
    budget: {
      sponsorshipCost: 0, boothCost: 0, travelCost: 0, stayCost: 0, localTransportCost: 0,
      teamCost: 0, boothMaterialCost: 0, merchandiseCost: 0, brochureCost: 0,
      contentProductionCost: 0, photographyCost: 0, paidPromotionCost: 0, miscCost: 0,
      totalEstimatedCost: 0, budgetOwner: '', paymentDeadline: '',
      isCostNegotiable: false, isSponsorshipConfirmed: false,
    },
    // Step 3
    primaryObjective: '', secondaryObjective: '', tertiaryObjective: '',
    // Step 4
    audience: {
      expectedAttendees: 0, icpPercentage: 0, industries: [] as string[], companySizes: [] as string[],
      personas: [] as string[], audienceSeniority: 'mixed', decisionMakersPresent: false,
      namedTargetAccounts: 0, existingCustomersPresent: false, partnersPresent: false,
      analystsPresent: false, mediaPresent: false, competitorsPresent: false,
      audienceType: 'open', isCurated: false, attendeeListAvailable: false,
      designationListAvailable: false, audienceInfoConfidence: 'internal-estimate', audienceFit: 'moderate',
    },
    // Step 5
    package: {
      logoPlacement: false, websiteListing: false, bannerPlacement: false, socialMediaMentions: false,
      sponsorMention: false, booth: false, demoTable: false, networkingAccess: false,
      vipLoungeAccess: false, workshop: false, roundtable: false, attendeeList: false,
      leadScanner: false, registrationsAccess: false, sponsorDatabase: false, eventAppLeads: false,
      speakingSlot: false, keynote: false, panelParticipation: false, firesideChatModerator: false,
      analystMeeting: false, emailCampaignInclusion: false, meetingSchedulerAccess: false,
      hostedBuyerMeetings: false, postEventReport: false, retargetingAccess: false,
      photographyRights: false, videoRights: false, sessionRecording: false, mediaInterview: false,
      oneonOneMeetings: false,
    },
    // Step 6
    expectedMetrics: {
      leads: 0, icpLeads: 0, mqls: 0, sqls: 0, meetings: 0, demos: 0, opportunities: 0,
      pipeline: 0, partnerConversations: 0, customerMeetings: 0, contentAssets: 0,
      brandVisibility: '', thoughtLeadershipValue: '', socialPosts: 0, videos: 0, blogs: 0,
    },
    // Step 7
    salesReadiness: {
      eventOwnerAssigned: false, salesOwnerAssigned: false, marketingOwnerAssigned: false,
      leadershipSponsorAssigned: false, salesInvolvedBeforeEvent: false, targetAccountListPrepared: false,
      preEventOutreachStarted: false, preEventMeetingsBeingBooked: false, demoReady: false,
      pitchDeckReady: false, pitchCustomized: false, qualificationQuestionsReady: false,
      leadCaptureReady: false, crmCampaignSetUp: false, leadSourceTrackingSetUp: false,
      utmTrackingSetUp: false, qrCodeTrackingSetUp: false, postEventEmailSequenceReady: false,
      linkedInFollowUpReady: false, salesFollowUpSLADefined: false, contentPlanReady: false,
      postEventReviewScheduled: false, readinessLevel: 'not-ready',
    },
    // Step 8
    risk: {
      organizerCredible: true, audienceQualityVerified: false, attendeeDataGuaranteed: false,
      riskOfPoorFootfall: false, riskOfLowICPFit: false, riskOfVendorHeavyAudience: false,
      riskOfGenericAudience: false, teamBandwidthAvailable: true, dateConflict: false,
      campaignConflict: false, packageOverpriced: false, dependencyOnUnverifiedPromises: false,
      isNewEvent: true, audienceOverlapWithOtherEvent: false, attendedBefore: false,
      previousROIPositive: false, competitorsHeavilyPresent: false, poorBoothLocation: false,
      poorSpeakingSlotTiming: false, attendeeListUnavailable: false, noFollowUpAccess: false,
      noInternalOwner: false, noPostEventPlan: false, riskLevel: 'medium',
    },
    // Step 9
    confidence: {
      audienceSizeConfidence: 'internal-estimate', audienceSeniorityConfidence: 'internal-estimate',
      icpPercentageConfidence: 'internal-estimate', namedAccountsConfidence: 'unknown',
      attendeeListConfidence: 'unknown', leadScannerConfidence: 'unknown',
      speakingSlotConfidence: 'unknown', boothLocationConfidence: 'unknown',
      meetingSchedulerConfidence: 'unknown', costConfidence: 'verbal', overallConfidence: 'low',
    },
    notes: '',
  });

  const totalCost = calculateTotalCost(form.budget);
  const bucket = classifyEventBucket(totalCost);

  const setBudget = (field: string, val: number | boolean | string) =>
    setForm((f) => ({ ...f, budget: { ...f.budget, [field]: val } }));
  const setAudience = (field: string, val: unknown) =>
    setForm((f) => ({ ...f, audience: { ...f.audience, [field]: val } }));
  const setPkg = (field: string, val: boolean) =>
    setForm((f) => ({ ...f, package: { ...f.package, [field]: val } }));
  const setMetrics = (field: string, val: number | string) =>
    setForm((f) => ({ ...f, expectedMetrics: { ...f.expectedMetrics, [field]: val } }));
  const setSR = (field: string, val: boolean | string) =>
    setForm((f) => ({ ...f, salesReadiness: { ...f.salesReadiness, [field]: val } }));
  const setRisk = (field: string, val: boolean | string) =>
    setForm((f) => ({ ...f, risk: { ...f.risk, [field]: val } }));
  const setConf = (field: string, val: string) =>
    setForm((f) => ({ ...f, confidence: { ...f.confidence, [field]: val } }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        budget: { ...form.budget, totalEstimatedCost: totalCost },
        stage: 'scored',
        approvalStatus: 'draft',
      };
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create event');
      const event = await res.json();
      router.push(`/events/${event.id}`);
    } catch (e) {
      setError('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.startDate;
    if (step === 3) return form.primaryObjective;
    return true;
  };

  const srScore = Object.values(form.salesReadiness).filter((v) => v === true).length;
  const srTotal = Object.values(form.salesReadiness).filter((v) => typeof v === 'boolean').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add New Event</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the details to evaluate this event using the Go / Conditional Go / No-Go framework.</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  step === s.id ? 'bg-indigo-600 text-white' :
                  step > s.id ? 'bg-green-100 text-green-700 cursor-pointer' :
                  'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.id}</span>}
                <span className="hidden md:block">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">Step {step} of {STEPS.length} — <span className="font-medium text-slate-700">{STEPS[step - 1].desc}</span></p>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">

        {/* Step 1: Event Profile */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Event Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Event Name" name="name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required className="col-span-2" />
              <InputField label="Organizer" name="organizer" value={form.organizer} onChange={(v) => setForm((f) => ({ ...f, organizer: v }))} placeholder="Organization running the event" />
              <InputField label="Event Website" name="websiteLink" value={form.websiteLink} onChange={(v) => setForm((f) => ({ ...f, websiteLink: v }))} placeholder="https://" />
              <InputField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} required />
              <InputField label="End Date" name="endDate" type="date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
              <SelectField label="Mode" name="mode" value={form.mode} onChange={(v) => setForm((f) => ({ ...f, mode: v as 'online' | 'offline' | 'hybrid' }))} options={[{ value: 'offline', label: 'Offline / In-person' }, { value: 'online', label: 'Online / Virtual' }, { value: 'hybrid', label: 'Hybrid' }]} />
              <SelectField label="Event Format" name="format" value={form.format} onChange={(v) => setForm((f) => ({ ...f, format: v as any }))} options={FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))} />
              <InputField label="City" name="city" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
              <InputField label="State" name="state" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
              <InputField label="Event Theme / Focus" name="theme" value={form.theme} onChange={(v) => setForm((f) => ({ ...f, theme: v }))} placeholder="e.g. DevOps, QA, BFSI Tech..." className="col-span-2" />
              <InputField label="Expected Audience Size" name="expectedAudienceSize" type="number" value={form.expectedAudienceSize} onChange={(v) => setForm((f) => ({ ...f, expectedAudienceSize: Number(v) }))} />
              <InputField label="Event Owner" name="eventOwner" value={form.eventOwner} onChange={(v) => setForm((f) => ({ ...f, eventOwner: v }))} placeholder="Who owns this event?" />
              <InputField label="Sales Owner" name="salesOwner" value={form.salesOwner} onChange={(v) => setForm((f) => ({ ...f, salesOwner: v }))} placeholder="Who owns sales follow-up?" />
              <InputField label="Marketing Owner" name="marketingOwner" value={form.marketingOwner} onChange={(v) => setForm((f) => ({ ...f, marketingOwner: v }))} placeholder="Who owns marketing execution?" />
            </div>
            <div className="space-y-3">
              <Toggle label="Has Past Edition?" checked={form.hasPastEdition} onChange={(v) => setForm((f) => ({ ...f, hasPastEdition: v }))} desc="Has this event been conducted before?" />
              {form.hasPastEdition && (
                <InputField label="Previous Year Attendance" name="previousYearAttendance" type="number" value={form.previousYearAttendance} onChange={(v) => setForm((f) => ({ ...f, previousYearAttendance: Number(v) }))} className="max-w-xs" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organizer Credibility Notes</label>
              <textarea rows={2} value={form.organizerCredibilityNotes} onChange={(e) => setForm((f) => ({ ...f, organizerCredibilityNotes: e.target.value }))} placeholder="Any notes about the organizer quality, past events, reputation..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Budget & Cost Details</h2>
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${BUCKET_COLORS[bucket]}`}>
                {BUCKET_LABELS_MAP[bucket]} · {formatINR(totalCost)}
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700">
              Enter all cost components. Total cost (not just sponsorship) determines the event bucket and classification.
            </div>
            <div className="grid grid-cols-3 gap-4">
              <NumberField label="Sponsorship Fee" name="sponsorshipCost" value={form.budget.sponsorshipCost} onChange={(v) => setBudget('sponsorshipCost', v)} />
              <NumberField label="Booth Cost" name="boothCost" value={form.budget.boothCost} onChange={(v) => setBudget('boothCost', v)} />
              <NumberField label="Travel Cost" name="travelCost" value={form.budget.travelCost} onChange={(v) => setBudget('travelCost', v)} />
              <NumberField label="Hotel / Stay Cost" name="stayCost" value={form.budget.stayCost} onChange={(v) => setBudget('stayCost', v)} />
              <NumberField label="Local Transport" name="localTransportCost" value={form.budget.localTransportCost} onChange={(v) => setBudget('localTransportCost', v)} />
              <NumberField label="Team Cost" name="teamCost" value={form.budget.teamCost} onChange={(v) => setBudget('teamCost', v)} />
              <NumberField label="Booth Materials" name="boothMaterialCost" value={form.budget.boothMaterialCost} onChange={(v) => setBudget('boothMaterialCost', v)} />
              <NumberField label="Merchandise / Giveaways" name="merchandiseCost" value={form.budget.merchandiseCost} onChange={(v) => setBudget('merchandiseCost', v)} />
              <NumberField label="Brochures / Print" name="brochureCost" value={form.budget.brochureCost} onChange={(v) => setBudget('brochureCost', v)} />
              <NumberField label="Content Production" name="contentProductionCost" value={form.budget.contentProductionCost} onChange={(v) => setBudget('contentProductionCost', v)} />
              <NumberField label="Photography / Video" name="photographyCost" value={form.budget.photographyCost} onChange={(v) => setBudget('photographyCost', v)} />
              <NumberField label="Paid Promotions" name="paidPromotionCost" value={form.budget.paidPromotionCost} onChange={(v) => setBudget('paidPromotionCost', v)} />
              <NumberField label="Miscellaneous" name="miscCost" value={form.budget.miscCost} onChange={(v) => setBudget('miscCost', v)} />
            </div>
            <div className={`rounded-xl border-2 p-4 ${BUCKET_COLORS[bucket]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-70">Total Estimated Cost</p>
                  <p className="text-3xl font-bold mt-1">{formatINR(totalCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium opacity-70">Event Bucket</p>
                  <p className="text-xl font-bold mt-1">{BUCKET_LABELS_MAP[bucket]}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Budget Owner" name="budgetOwner" value={form.budget.budgetOwner} onChange={(v) => setBudget('budgetOwner', v)} placeholder="Who approves this budget?" />
              <InputField label="Payment Deadline" name="paymentDeadline" type="date" value={form.budget.paymentDeadline || ''} onChange={(v) => setBudget('paymentDeadline', v)} />
            </div>
            <div className="flex gap-6">
              <Toggle label="Is Cost Negotiable?" checked={form.budget.isCostNegotiable} onChange={(v) => setBudget('isCostNegotiable', v)} />
              <Toggle label="Sponsorship Package Confirmed?" checked={form.budget.isSponsorshipConfirmed} onChange={(v) => setBudget('isSponsorshipConfirmed', v)} />
            </div>
          </div>
        )}

        {/* Step 3: Objectives */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Event Objectives</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Scoring adapts to your selected objective. A Micro event won&apos;t be penalized for not generating enterprise pipeline. A Major event won&apos;t pass on branding alone.
            </div>
            <SelectField label="Primary Objective" name="primaryObjective" value={form.primaryObjective} onChange={(v) => setForm((f) => ({ ...f, primaryObjective: v }))} options={OBJECTIVES} required />
            <SelectField label="Secondary Objective (Optional)" name="secondaryObjective" value={form.secondaryObjective} onChange={(v) => setForm((f) => ({ ...f, secondaryObjective: v }))} options={OBJECTIVES} />
            <SelectField label="Tertiary Objective (Optional)" name="tertiaryObjective" value={form.tertiaryObjective} onChange={(v) => setForm((f) => ({ ...f, tertiaryObjective: v }))} options={OBJECTIVES} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional context about what this event should achieve..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* Step 4: Audience Fit */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Audience Fit</h2>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Expected Attendees" name="expectedAttendees" type="number" value={form.audience.expectedAttendees} onChange={(v) => setAudience('expectedAttendees', Number(v))} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ICP Percentage (%)<span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={form.audience.icpPercentage} onChange={(e) => setAudience('icpPercentage', Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Estimated % of attendees matching your ICP</p>
              </div>
              <InputField label="Named Target Accounts Expected" name="namedTargetAccounts" type="number" value={form.audience.namedTargetAccounts} onChange={(v) => setAudience('namedTargetAccounts', Number(v))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Personas (select all that apply)</label>
              <CheckGroup items={PERSONAS} selected={form.audience.personas} onChange={(v) => setAudience('personas', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Industries Represented</label>
              <CheckGroup items={INDUSTRIES} selected={form.audience.industries} onChange={(v) => setAudience('industries', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Audience Seniority" name="audienceSeniority" value={form.audience.audienceSeniority} onChange={(v) => setAudience('audienceSeniority', v)} options={[{ value: 'executive', label: 'Executive (CXO, VP)' }, { value: 'senior', label: 'Senior (Director, Head)' }, { value: 'mid', label: 'Mid (Manager, Lead)' }, { value: 'junior', label: 'Junior (Exec, Analyst)' }, { value: 'mixed', label: 'Mixed seniority' }, { value: 'unknown', label: 'Unknown' }]} />
              <SelectField label="Audience Type" name="audienceType" value={form.audience.audienceType} onChange={(v) => setAudience('audienceType', v)} options={[{ value: 'paid', label: 'Paid registration' }, { value: 'invited', label: 'Invited / curated' }, { value: 'free', label: 'Free registration' }, { value: 'open', label: 'Open registration' }, { value: 'mixed', label: 'Mixed' }]} />
              <SelectField label="Audience Info Confidence" name="audienceInfoConfidence" value={form.audience.audienceInfoConfidence} onChange={(v) => setAudience('audienceInfoConfidence', v)} options={CONF_OPTIONS} />
              <SelectField label="Overall Audience Fit" name="audienceFit" value={form.audience.audienceFit} onChange={(v) => setAudience('audienceFit', v)} options={[{ value: 'strong', label: 'Strong' }, { value: 'moderate', label: 'Moderate' }, { value: 'weak', label: 'Weak' }]} />
            </div>
            <ToggleSection
              title="Audience Attributes"
              fields={[
                ['decisionMakersPresent',    'Decision-makers present?'],
                ['existingCustomersPresent', 'Existing customers attending?'],
                ['partnersPresent',          'Partners attending?'],
                ['analystsPresent',          'Analysts attending?'],
                ['mediaPresent',             'Media representatives attending?'],
                ['competitorsPresent',       'Competitors heavily present?'],
                ['attendeeListAvailable',    'Attendee list available?'],
                ['designationListAvailable', 'Designation list available?'],
                ['isCurated',               'Audience is curated?'],
              ]}
              values={form.audience as unknown as Record<string, boolean>}
              onChangeAll={(updates) => {
                setForm((f) => ({ ...f, audience: { ...f.audience, ...updates } }));
              }}
            />
          </div>
        )}

        {/* Step 5: Package Quality */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Sponsorship Package</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Logo-only packages will significantly limit the score. Engagement, data, and authority assets carry the most weight.
            </div>
            {[
              { category: 'Visibility Assets', fields: [['logoPlacement','Logo Placement'],['websiteListing','Website Listing'],['bannerPlacement','Banner Placement'],['socialMediaMentions','Social Media Mentions'],['sponsorMention','Sponsor Mention (MC/host)']] as [string,string][] },
              { category: 'Engagement Assets', fields: [['booth','Booth / Stall'],['demoTable','Demo Table'],['networkingAccess','Networking Access'],['vipLoungeAccess','VIP Lounge Access'],['workshop','Workshop Slot'],['roundtable','Roundtable Seat']] as [string,string][] },
              { category: 'Data Assets (High Value)', fields: [['attendeeList','Attendee List'],['leadScanner','Lead Scanner'],['registrationsAccess','Registrations Access'],['sponsorDatabase','Sponsor Database'],['eventAppLeads','Event App Leads']] as [string,string][] },
              { category: 'Authority Assets (Highest Value)', fields: [['speakingSlot','Speaking Slot'],['keynote','Keynote'],['panelParticipation','Panel Participation'],['firesideChatModerator','Fireside / Moderator Role'],['analystMeeting','Analyst Meeting'],['mediaInterview','Media Interview'],['oneonOneMeetings','1-on-1 Meetings']] as [string,string][] },
              { category: 'Follow-up Assets', fields: [['emailCampaignInclusion','Email Campaign Inclusion'],['meetingSchedulerAccess','Meeting Scheduler Access'],['hostedBuyerMeetings','Hosted Buyer Meetings'],['postEventReport','Post-event Report Inclusion'],['retargetingAccess','Retargeting Access']] as [string,string][] },
              { category: 'Content Assets', fields: [['photographyRights','Photography Rights'],['videoRights','Video / Recording Rights'],['sessionRecording','Session Recording Access']] as [string,string][] },
            ].map((cat) => (
              <ToggleSection
                key={cat.category}
                title={cat.category}
                fields={cat.fields}
                values={form.package as unknown as Record<string, boolean>}
                onChangeAll={(updates) => {
                  setForm((f) => ({ ...f, package: { ...f.package, ...updates } }));
                }}
              />
            ))}
          </div>
        )}

        {/* Step 6: Business Value */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Expected Business Value</h2>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Direct Business Value</h3>
              <div className="grid grid-cols-3 gap-4">
                <NumberField label="Expected Total Leads" name="leads" value={form.expectedMetrics.leads} onChange={(v) => setMetrics('leads', v)} prefix="#" />
                <NumberField label="Expected ICP Leads" name="icpLeads" value={form.expectedMetrics.icpLeads} onChange={(v) => setMetrics('icpLeads', v)} prefix="#" />
                <NumberField label="Expected MQLs" name="mqls" value={form.expectedMetrics.mqls} onChange={(v) => setMetrics('mqls', v)} prefix="#" />
                <NumberField label="Expected SQLs" name="sqls" value={form.expectedMetrics.sqls} onChange={(v) => setMetrics('sqls', v)} prefix="#" />
                <NumberField label="Expected Meetings" name="meetings" value={form.expectedMetrics.meetings} onChange={(v) => setMetrics('meetings', v)} prefix="#" />
                <NumberField label="Expected Demos" name="demos" value={form.expectedMetrics.demos} onChange={(v) => setMetrics('demos', v)} prefix="#" />
                <NumberField label="Expected Opportunities" name="opportunities" value={form.expectedMetrics.opportunities} onChange={(v) => setMetrics('opportunities', v)} prefix="#" />
                <NumberField label="Expected Pipeline Value (₹)" name="pipeline" value={form.expectedMetrics.pipeline} onChange={(v) => setMetrics('pipeline', v)} />
                <NumberField label="Partner Conversations" name="partnerConversations" value={form.expectedMetrics.partnerConversations} onChange={(v) => setMetrics('partnerConversations', v)} prefix="#" />
                <NumberField label="Customer Meetings" name="customerMeetings" value={form.expectedMetrics.customerMeetings} onChange={(v) => setMetrics('customerMeetings', v)} prefix="#" />
              </div>
              {totalCost > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Cost per Lead', val: form.expectedMetrics.leads > 0 ? Math.round(totalCost / form.expectedMetrics.leads) : 0 },
                    { label: 'Cost per ICP Lead', val: form.expectedMetrics.icpLeads > 0 ? Math.round(totalCost / form.expectedMetrics.icpLeads) : 0 },
                    { label: 'Pipeline-to-Cost Ratio', val: null, ratio: form.expectedMetrics.pipeline > 0 ? (form.expectedMetrics.pipeline / totalCost).toFixed(1) : '0', isRatio: true },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">{m.label}</p>
                      <p className="text-lg font-bold text-slate-800 mt-1">
                        {m.isRatio ? `${m.ratio}x` : m.val ? formatINR(m.val) : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Indirect Business Value</h3>
              <div className="grid grid-cols-3 gap-4">
                <NumberField label="Social Media Posts" name="socialPosts" value={form.expectedMetrics.socialPosts} onChange={(v) => setMetrics('socialPosts', v)} prefix="#" />
                <NumberField label="Videos / Reels" name="videos" value={form.expectedMetrics.videos} onChange={(v) => setMetrics('videos', v)} prefix="#" />
                <NumberField label="Blogs / Articles" name="blogs" value={form.expectedMetrics.blogs} onChange={(v) => setMetrics('blogs', v)} prefix="#" />
                <NumberField label="Content Assets" name="contentAssets" value={form.expectedMetrics.contentAssets} onChange={(v) => setMetrics('contentAssets', v)} prefix="#" />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Sales Readiness */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Sales & Execution Readiness</h2>
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${srScore / srTotal >= 0.7 ? 'bg-green-100 text-green-700' : srScore / srTotal >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {srScore}/{srTotal} Checks
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Low sales readiness triggers Conditional Go for Mini events and No-Go for Major events.
            </div>
            {[
              { section: 'Ownership', items: [['eventOwnerAssigned','Event owner assigned'],['salesOwnerAssigned','Sales owner assigned'],['marketingOwnerAssigned','Marketing owner assigned'],['leadershipSponsorAssigned','Leadership sponsor assigned']] as [string,string][] },
              { section: 'Pre-event Sales', items: [['salesInvolvedBeforeEvent','Sales team involved before the event'],['targetAccountListPrepared','Target account list prepared'],['preEventOutreachStarted','Pre-event outreach started'],['preEventMeetingsBeingBooked','Pre-event meetings being booked']] as [string,string][] },
              { section: 'Pitch & Demo Readiness', items: [['demoReady','Demo environment ready'],['pitchDeckReady','Pitch deck ready'],['pitchCustomized','Pitch customized for this event audience'],['qualificationQuestionsReady','Qualification questions prepared']] as [string,string][] },
              { section: 'Tracking & CRM', items: [['leadCaptureReady','Lead capture process ready'],['crmCampaignSetUp','CRM campaign set up'],['leadSourceTrackingSetUp','Lead source tracking set up'],['utmTrackingSetUp','UTM tracking set up'],['qrCodeTrackingSetUp','QR code tracking set up']] as [string,string][] },
              { section: 'Follow-up Readiness', items: [['postEventEmailSequenceReady','Post-event email sequence ready'],['linkedInFollowUpReady','LinkedIn follow-up sequence ready'],['salesFollowUpSLADefined','Sales follow-up SLA defined'],['contentPlanReady','Content plan ready'],['postEventReviewScheduled','Post-event review scheduled']] as [string,string][] },
            ].map((sec) => (
              <ToggleSection
                key={sec.section}
                title={sec.section}
                fields={sec.items}
                values={form.salesReadiness as unknown as Record<string, boolean>}
                onChangeAll={(updates) => {
                  setForm((f) => ({ ...f, salesReadiness: { ...f.salesReadiness, ...updates } }));
                }}
              />
            ))}
          </div>
        )}

        {/* Step 8: Risk */}
        {step === 8 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Risk Assessment</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              High risk flags will reduce the final score. Hard No-Go risks (no owner, no objective, extreme ICP mismatch) will override the score.
            </div>
            {[
              { section: 'Organizer & Event Quality', items: [['organizerCredible','Organizer is credible and established'],['audienceQualityVerified','Audience quality is verified'],['attendeeDataGuaranteed','Attendee data is guaranteed'],['isNewEvent','This is a new event with no track record']] as [string,string][] },
              { section: 'Audience Risks', items: [['riskOfPoorFootfall','Risk of poor footfall / low attendance'],['riskOfLowICPFit','Risk of low ICP fit in audience'],['riskOfVendorHeavyAudience','Risk of vendor/student-heavy audience'],['riskOfGenericAudience','Audience is too generic']] as [string,string][] },
              { section: 'Execution Risks', items: [['teamBandwidthAvailable','Team bandwidth is available'],['dateConflict','Date conflicts with another priority event/campaign'],['campaignConflict','Conflicts with an ongoing campaign'],['noInternalOwner','No internal owner assigned'],['noPostEventPlan','No post-event follow-up plan']] as [string,string][] },
              { section: 'Package & Value Risks', items: [['packageOverpriced','Package appears overpriced for the value'],['dependencyOnUnverifiedPromises','Decision depends on unverified organizer promises'],['attendeeListUnavailable','Attendee list is unavailable'],['noFollowUpAccess','No access to leads or follow-up data']] as [string,string][] },
              { section: 'Repeat Event History', items: [['attendedBefore','We have attended this event before'],['previousROIPositive','Previous edition had positive ROI'],['competitorsHeavilyPresent','Competitors are heavily present'],['poorBoothLocation','Booth location is poor or unknown']] as [string,string][] },
            ].map((sec) => (
              <ToggleSection
                key={sec.section}
                title={sec.section}
                fields={sec.items}
                values={form.risk as unknown as Record<string, boolean>}
                onChangeAll={(updates) => {
                  setForm((f) => ({ ...f, risk: { ...f.risk, ...updates } }));
                }}
              />
            ))}
          </div>
        )}

        {/* Step 9: Confidence */}
        {step === 9 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Data Confidence</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              If the recommendation is Go but confidence is Low, it will automatically become Conditional Go until key details are confirmed.
            </div>
            <div className="space-y-4">
              {[
                { field: 'audienceSizeConfidence', label: 'Audience Size' },
                { field: 'audienceSeniorityConfidence', label: 'Audience Seniority / Persona' },
                { field: 'icpPercentageConfidence', label: 'ICP Percentage Estimate' },
                { field: 'namedAccountsConfidence', label: 'Named Target Accounts' },
                { field: 'attendeeListConfidence', label: 'Attendee List Access' },
                { field: 'leadScannerConfidence', label: 'Lead Scanner / Capture' },
                { field: 'speakingSlotConfidence', label: 'Speaking Slot / Authority Asset' },
                { field: 'boothLocationConfidence', label: 'Booth Location' },
                { field: 'meetingSchedulerConfidence', label: 'Meeting Scheduler Access' },
                { field: 'costConfidence', label: 'Cost / Pricing' },
              ].map((item) => (
                <div key={item.field} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 w-48 flex-shrink-0">{item.label}</span>
                  <div className="flex gap-2 flex-wrap">
                    {CONF_OPTIONS.map((opt) => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => setConf(item.field, opt.value)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          (form.confidence as any)[item.field] === opt.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <SelectField label="Overall Confidence Level" name="overallConfidence" value={form.confidence.overallConfidence} onChange={(v) => setConf('overallConfidence', v)} options={[{ value: 'high', label: 'High Confidence — most details confirmed' }, { value: 'medium', label: 'Medium Confidence — some details unverified' }, { value: 'low', label: 'Low Confidence — many details unconfirmed' }]} className="max-w-sm" />
          </div>
        )}

        {/* Step 10: Review */}
        {step === 10 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Review & Submit</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-slate-700">Event Summary</h3>
                <p><span className="text-slate-500">Name:</span> <span className="font-medium">{form.name || '—'}</span></p>
                <p><span className="text-slate-500">Date:</span> {form.startDate ? new Date(form.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
                <p><span className="text-slate-500">City:</span> {form.city || '—'} · {form.mode}</p>
                <p><span className="text-slate-500">Format:</span> {FORMAT_LABELS[form.format] || form.format}</p>
                <p><span className="text-slate-500">Organizer:</span> {form.organizer || '—'}</p>
              </div>
              <div className={`rounded-lg p-4 space-y-2 border-2 ${BUCKET_COLORS[bucket]}`}>
                <h3 className="font-semibold">Budget Classification</h3>
                <p className="text-2xl font-bold">{formatINR(totalCost)}</p>
                <p className="text-lg font-semibold">{BUCKET_LABELS_MAP[bucket]}</p>
                <p className="text-xs opacity-70">Sponsorship: {formatINR(form.budget.sponsorshipCost)} + other costs</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-slate-700">Objective</h3>
                <p><span className="text-slate-500">Primary:</span> {OBJECTIVES.find(o => o.value === form.primaryObjective)?.label || '—'}</p>
                {form.secondaryObjective && <p><span className="text-slate-500">Secondary:</span> {OBJECTIVES.find(o => o.value === form.secondaryObjective)?.label}</p>}
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-slate-700">Expected Pipeline</h3>
                <p><span className="text-slate-500">ICP Leads:</span> <span className="font-medium">{form.expectedMetrics.icpLeads}</span></p>
                <p><span className="text-slate-500">SQLs:</span> <span className="font-medium">{form.expectedMetrics.sqls}</span></p>
                <p><span className="text-slate-500">Pipeline:</span> <span className="font-medium">{formatINR(form.expectedMetrics.pipeline)}</span></p>
                <p><span className="text-slate-500">Meetings:</span> <span className="font-medium">{form.expectedMetrics.meetings}</span></p>
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
              <p className="font-semibold mb-1">Score will be calculated automatically</p>
              <p>After submission, you&apos;ll see the complete score breakdown, Go/No-Go recommendation, risk assessment, and required actions on the event detail page.</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-xs text-slate-400">{step} / {STEPS.length}</span>
        {step < STEPS.length ? (
          <button
            onClick={() => { if (canNext()) setStep((s) => s + 1); }}
            disabled={!canNext()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Submit & Get Score'}
          </button>
        )}
      </div>
    </div>
  );
}
