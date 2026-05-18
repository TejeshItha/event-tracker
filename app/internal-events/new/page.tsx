'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INTERNAL_FORMAT_LABELS,
  INTERNAL_OBJECTIVES,
  PERSONA_OPTIONS,
  INDUSTRY_OPTIONS,
  InternalEventFormat,
  InternalEventMode,
  calculateInternalTotalCost,
} from '@/lib/internal-types';
import { formatINR } from '@/lib/classification';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Mic } from 'lucide-react';

// ─── Form state type ───────────────────────────────────────────────────────────

const EMPTY_BUDGET = {
  venueCost: 0, avEquipmentCost: 0, cateringCost: 0, speakerFeeCost: 0,
  travelCost: 0, decorCost: 0, photographyCost: 0, marketingPromoCost: 0,
  giftsSwagCost: 0, platformToolsCost: 0, miscCost: 0,
  totalEstimatedCost: 0, budgetOwner: '',
};

type SpeakerEntry = { id: string; name: string; designation: string; company: string; topic: string; confirmed: boolean; notes: string };

type FormState = {
  // Step 1 — Profile
  name: string; format: InternalEventFormat; theme: string; description: string;
  mode: InternalEventMode; startDate: string; endDate: string; startTime: string; endTime: string;
  venue: string; city: string; platformLink: string; registrationLink: string; isInviteOnly: boolean;
  // Step 2 — Team & Audience
  eventOwner: string; marketingOwner: string; salesOwner: string;
  primaryObjective: string; secondaryObjective: string;
  targetAudience: string; targetPersonas: string[]; targetIndustries: string[];
  estimatedAudienceSize: number;
  // Step 3 — Budget
  budget: typeof EMPTY_BUDGET;
  // Step 4 — Speakers
  speakers: SpeakerEntry[];
  // Step 5 — Target Metrics
  targetInvites: number; targetRegistrations: number; targetAttendees: number;
  targetIcpAttendees: number; targetMeetings: number; targetPipeline: number;
  targetContentAssets: number; targetSocialPosts: number;
  // Notes
  notes: string;
};

const INITIAL: FormState = {
  name: '', format: 'webinar', theme: '', description: '',
  mode: 'online', startDate: '', endDate: '', startTime: '', endTime: '',
  venue: '', city: '', platformLink: '', registrationLink: '', isInviteOnly: false,
  eventOwner: '', marketingOwner: '', salesOwner: '',
  primaryObjective: '', secondaryObjective: '',
  targetAudience: '', targetPersonas: [], targetIndustries: [],
  estimatedAudienceSize: 0,
  budget: { ...EMPTY_BUDGET },
  speakers: [],
  targetInvites: 0, targetRegistrations: 0, targetAttendees: 0,
  targetIcpAttendees: 0, targetMeetings: 0, targetPipeline: 0,
  targetContentAssets: 0, targetSocialPosts: 0,
  notes: '',
};

// ─── UI helpers ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, prefix }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
        <input
          type="number"
          min={0}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full border border-slate-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />
    </div>
  );
}

function PillGroup({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  const allSel = options.every((o) => selected.includes(o));
  const noneSel = options.every((o) => !selected.includes(o));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange([...selected.filter((s) => !options.includes(s)), ...options])}
            className={`text-xs px-2 py-0.5 rounded ${allSel ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
            Select All
          </button>
          <button type="button" onClick={() => onChange(selected.filter((s) => !options.includes(s)))}
            className={`text-xs px-2 py-0.5 rounded ${noneSel ? 'bg-slate-100 text-slate-500' : 'text-slate-400 hover:text-red-500'}`}>
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selected.includes(opt) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, desc }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200'} flex-shrink-0 cursor-pointer`}
        style={{ height: '22px' }}
      >
        <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
      </div>
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
    </label>
  );
}

const STEPS = ['Profile', 'Team & Audience', 'Budget', 'Speakers', 'Target Metrics', 'Review'];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewInternalEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setBudget(key: keyof typeof EMPTY_BUDGET, value: number | string) {
    setForm((f) => {
      const next = { ...f.budget, [key]: value };
      next.totalEstimatedCost = calculateInternalTotalCost(next as any);
      return { ...f, budget: next };
    });
  }

  function addSpeaker() {
    const sp: SpeakerEntry = {
      id: Date.now().toString(),
      name: '', designation: '', company: '', topic: '', confirmed: false, notes: '',
    };
    set('speakers', [...form.speakers, sp]);
  }

  function removeSpeaker(id: string) {
    set('speakers', form.speakers.filter((s) => s.id !== id));
  }

  function updateSpeaker(id: string, key: keyof SpeakerEntry, value: string | boolean) {
    set('speakers', form.speakers.map((s) => s.id === id ? { ...s, [key]: value } : s));
  }

  async function submit() {
    if (!form.name.trim()) { setError('Event name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name, format: form.format, theme: form.theme, description: form.description,
        mode: form.mode, startDate: form.startDate, endDate: form.endDate,
        startTime: form.startTime, endTime: form.endTime,
        venue: form.venue, city: form.city, platformLink: form.platformLink,
        registrationLink: form.registrationLink, isInviteOnly: form.isInviteOnly,
        eventOwner: form.eventOwner, marketingOwner: form.marketingOwner, salesOwner: form.salesOwner,
        primaryObjective: form.primaryObjective, secondaryObjective: form.secondaryObjective,
        targetAudience: form.targetAudience, targetPersonas: form.targetPersonas,
        targetIndustries: form.targetIndustries, estimatedAudienceSize: form.estimatedAudienceSize,
        budget: form.budget,
        speakers: form.speakers,
        targetMetrics: {
          targetInvites: form.targetInvites, targetRegistrations: form.targetRegistrations,
          targetAttendees: form.targetAttendees, targetIcpAttendees: form.targetIcpAttendees,
          targetMeetings: form.targetMeetings, targetPipeline: form.targetPipeline,
          targetContentAssets: form.targetContentAssets, targetSocialPosts: form.targetSocialPosts,
        },
        stage: 'ideation',
        notes: form.notes,
      };
      const res = await fetch('/api/internal-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      router.push(`/internal-events/${created.id}`);
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  }

  const totalCost = form.budget.totalEstimatedCost;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Mic className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Host a New Event</h1>
          <p className="text-slate-500 text-sm">Plan a fireside chat, webinar, roundtable, or any hosted event</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? 'bg-indigo-600 text-white'
                  : i < step
                  ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <div className={`w-4 h-0.5 rounded ${i < step ? 'bg-green-300' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">

        {/* ── Step 1: Profile ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 text-lg">Event Profile</h2>
            <InputField label="Event Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. CXO Roundtable: The Future of B2B SaaS" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Event Format *"
                value={form.format}
                onChange={(v) => set('format', v as InternalEventFormat)}
                options={Object.entries(INTERNAL_FORMAT_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <SelectField
                label="Mode *"
                value={form.mode}
                onChange={(v) => set('mode', v as InternalEventMode)}
                options={[
                  { value: 'online', label: 'Online / Virtual' },
                  { value: 'offline', label: 'In-person / Offline' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
              />
            </div>
            <InputField label="Theme / Topic" value={form.theme} onChange={(v) => set('theme', v)} placeholder="e.g. AI in Financial Services" />
            <TextareaField
              label="Description"
              value={form.description}
              onChange={(v) => set('description', v)}
              placeholder="Brief description of the event, agenda, and what attendees will get out of it..."
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Start Date" value={form.startDate} onChange={(v) => set('startDate', v)} type="date" />
              <InputField label="End Date" value={form.endDate} onChange={(v) => set('endDate', v)} type="date" />
              <InputField label="Start Time" value={form.startTime} onChange={(v) => set('startTime', v)} type="time" />
              <InputField label="End Time" value={form.endTime} onChange={(v) => set('endTime', v)} type="time" />
            </div>
            {(form.mode === 'offline' || form.mode === 'hybrid') && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Venue" value={form.venue} onChange={(v) => set('venue', v)} placeholder="Hotel / Conference hall name" />
                <InputField label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="Mumbai" />
              </div>
            )}
            {(form.mode === 'online' || form.mode === 'hybrid') && (
              <InputField label="Platform / Meeting Link" value={form.platformLink} onChange={(v) => set('platformLink', v)} placeholder="Zoom / Teams / Hopin link" />
            )}
            <InputField label="Registration Link" value={form.registrationLink} onChange={(v) => set('registrationLink', v)} placeholder="https://..." />
            <Toggle
              label="Invite-Only Event"
              checked={form.isInviteOnly}
              onChange={(v) => set('isInviteOnly', v)}
              desc="Registration is by invitation only — not open to the public"
            />
          </div>
        )}

        {/* ── Step 2: Team & Audience ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 text-lg">Team & Audience</h2>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Event Owner" value={form.eventOwner} onChange={(v) => set('eventOwner', v)} placeholder="Full name" />
              <InputField label="Marketing Owner" value={form.marketingOwner} onChange={(v) => set('marketingOwner', v)} placeholder="Full name" />
              <InputField label="Sales Owner" value={form.salesOwner} onChange={(v) => set('salesOwner', v)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Primary Objective"
                value={form.primaryObjective}
                onChange={(v) => set('primaryObjective', v)}
                options={INTERNAL_OBJECTIVES.map((o) => ({ value: o, label: o }))}
              />
              <SelectField
                label="Secondary Objective"
                value={form.secondaryObjective}
                onChange={(v) => set('secondaryObjective', v)}
                options={INTERNAL_OBJECTIVES.map((o) => ({ value: o, label: o }))}
              />
            </div>
            <TextareaField
              label="Target Audience Description"
              value={form.targetAudience}
              onChange={(v) => set('targetAudience', v)}
              placeholder="Who are you inviting? e.g. CXOs from mid-market BFSI companies with 500+ employees in metro cities"
              rows={2}
            />
            <NumberField label="Estimated Audience Size" value={form.estimatedAudienceSize} onChange={(v) => set('estimatedAudienceSize', v)} />
            <PillGroup
              label="Target Personas"
              options={PERSONA_OPTIONS}
              selected={form.targetPersonas}
              onChange={(v) => set('targetPersonas', v)}
            />
            <PillGroup
              label="Target Industries"
              options={INDUSTRY_OPTIONS}
              selected={form.targetIndustries}
              onChange={(v) => set('targetIndustries', v)}
            />
          </div>
        )}

        {/* ── Step 3: Budget ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-lg">Budget</h2>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Estimated</p>
                <p className="text-xl font-bold text-indigo-600">{formatINR(totalCost)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(form.mode === 'offline' || form.mode === 'hybrid') && <>
                <NumberField label="Venue Cost (₹)" value={form.budget.venueCost} onChange={(v) => setBudget('venueCost', v)} prefix="₹" />
                <NumberField label="AV Equipment (₹)" value={form.budget.avEquipmentCost} onChange={(v) => setBudget('avEquipmentCost', v)} prefix="₹" />
                <NumberField label="Catering / Refreshments (₹)" value={form.budget.cateringCost} onChange={(v) => setBudget('cateringCost', v)} prefix="₹" />
                <NumberField label="Decor & Signage (₹)" value={form.budget.decorCost} onChange={(v) => setBudget('decorCost', v)} prefix="₹" />
              </>}
              {(form.mode === 'online' || form.mode === 'hybrid') && (
                <NumberField label="Platform & Tools (₹)" value={form.budget.platformToolsCost} onChange={(v) => setBudget('platformToolsCost', v)} prefix="₹" />
              )}
              <NumberField label="Speaker Fee (₹)" value={form.budget.speakerFeeCost} onChange={(v) => setBudget('speakerFeeCost', v)} prefix="₹" />
              <NumberField label="Travel & Accommodation (₹)" value={form.budget.travelCost} onChange={(v) => setBudget('travelCost', v)} prefix="₹" />
              <NumberField label="Photography / Video (₹)" value={form.budget.photographyCost} onChange={(v) => setBudget('photographyCost', v)} prefix="₹" />
              <NumberField label="Marketing & Promotion (₹)" value={form.budget.marketingPromoCost} onChange={(v) => setBudget('marketingPromoCost', v)} prefix="₹" />
              <NumberField label="Gifts & Swag (₹)" value={form.budget.giftsSwagCost} onChange={(v) => setBudget('giftsSwagCost', v)} prefix="₹" />
              <NumberField label="Miscellaneous (₹)" value={form.budget.miscCost} onChange={(v) => setBudget('miscCost', v)} prefix="₹" />
            </div>
            <InputField label="Budget Owner" value={form.budget.budgetOwner} onChange={(v) => setBudget('budgetOwner', v)} placeholder="Name of person responsible for budget" />
            <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">Total Estimated Budget</span>
              <span className="text-2xl font-bold text-indigo-700">{formatINR(totalCost)}</span>
            </div>
          </div>
        )}

        {/* ── Step 4: Speakers ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-lg">Speakers</h2>
              <button
                type="button"
                onClick={addSpeaker}
                className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Speaker
              </button>
            </div>
            {form.speakers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <Mic className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 mb-3">No speakers added yet</p>
                <button
                  type="button"
                  onClick={addSpeaker}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Add your first speaker
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {form.speakers.map((sp, i) => (
                  <div key={sp.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Speaker {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                          <div
                            onClick={() => updateSpeaker(sp.id, 'confirmed', !sp.confirmed)}
                            className={`relative w-8 h-[18px] rounded-full transition-colors cursor-pointer ${sp.confirmed ? 'bg-green-500' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${sp.confirmed ? 'translate-x-[14px]' : ''}`} />
                          </div>
                          {sp.confirmed ? 'Confirmed' : 'Pending'}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSpeaker(sp.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Full Name" value={sp.name} onChange={(v) => updateSpeaker(sp.id, 'name', v)} placeholder="Dr. Priya Sharma" />
                      <InputField label="Designation" value={sp.designation} onChange={(v) => updateSpeaker(sp.id, 'designation', v)} placeholder="CTO" />
                      <InputField label="Company" value={sp.company} onChange={(v) => updateSpeaker(sp.id, 'company', v)} placeholder="Acme Corp" />
                      <InputField label="Topic / Session Title" value={sp.topic} onChange={(v) => updateSpeaker(sp.id, 'topic', v)} placeholder="AI-driven Security in Banking" />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <input
                        type="text"
                        value={sp.notes}
                        onChange={(e) => updateSpeaker(sp.id, 'notes', e.target.value)}
                        placeholder="Any special requirements or notes..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Target Metrics ───────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 text-lg">Target Metrics</h2>
            <p className="text-sm text-slate-500">Set goals for this event. These will be compared against actuals after the event.</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Target Invites" value={form.targetInvites} onChange={(v) => set('targetInvites', v)} />
              <NumberField label="Target Registrations" value={form.targetRegistrations} onChange={(v) => set('targetRegistrations', v)} />
              <NumberField label="Target Attendees" value={form.targetAttendees} onChange={(v) => set('targetAttendees', v)} />
              <NumberField label="Target ICP Attendees" value={form.targetIcpAttendees} onChange={(v) => set('targetIcpAttendees', v)} />
              <NumberField label="Target Meetings / Follow-ups" value={form.targetMeetings} onChange={(v) => set('targetMeetings', v)} />
              <NumberField label="Target Pipeline (₹)" value={form.targetPipeline} onChange={(v) => set('targetPipeline', v)} prefix="₹" />
              <NumberField label="Target Content Assets" value={form.targetContentAssets} onChange={(v) => set('targetContentAssets', v)} />
              <NumberField label="Target Social Posts" value={form.targetSocialPosts} onChange={(v) => set('targetSocialPosts', v)} />
            </div>
            {form.targetRegistrations > 0 && form.targetAttendees > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <span className="font-medium">Target show-up rate: </span>
                {Math.round((form.targetAttendees / form.targetRegistrations) * 100)}%
                {' '}({form.targetAttendees} of {form.targetRegistrations} registrations)
              </div>
            )}
          </div>
        )}

        {/* ── Step 6: Review ───────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-800 text-lg">Review & Create</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-700 mb-2">Event Profile</p>
                <p><span className="text-slate-400">Name:</span> <span className="font-medium">{form.name || '—'}</span></p>
                <p><span className="text-slate-400">Format:</span> {INTERNAL_FORMAT_LABELS[form.format]}</p>
                <p><span className="text-slate-400">Mode:</span> {form.mode}</p>
                <p><span className="text-slate-400">Date:</span> {form.startDate || '—'}{form.endDate && form.endDate !== form.startDate ? ` → ${form.endDate}` : ''}</p>
                {form.city && <p><span className="text-slate-400">City:</span> {form.city}</p>}
                <p><span className="text-slate-400">Invite-only:</span> {form.isInviteOnly ? 'Yes' : 'No'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-700 mb-2">Team & Objectives</p>
                <p><span className="text-slate-400">Event Owner:</span> {form.eventOwner || '—'}</p>
                <p><span className="text-slate-400">Primary Objective:</span> {form.primaryObjective || '—'}</p>
                <p><span className="text-slate-400">Target Audience:</span> {form.estimatedAudienceSize} attendees</p>
                <p><span className="text-slate-400">Personas:</span> {form.targetPersonas.length} selected</p>
                <p><span className="text-slate-400">Industries:</span> {form.targetIndustries.length} selected</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-700 mb-2">Budget</p>
                <p className="text-2xl font-bold text-indigo-600">{formatINR(totalCost)}</p>
                <p className="text-xs text-slate-400">Total estimated cost</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-slate-700 mb-2">Speakers & Targets</p>
                <p><span className="text-slate-400">Speakers:</span> {form.speakers.length} ({form.speakers.filter((s) => s.confirmed).length} confirmed)</p>
                <p><span className="text-slate-400">Target Registrations:</span> {form.targetRegistrations || '—'}</p>
                <p><span className="text-slate-400">Target Attendees:</span> {form.targetAttendees || '—'}</p>
                <p><span className="text-slate-400">Target Pipeline:</span> {form.targetPipeline ? formatINR(form.targetPipeline) : '—'}</p>
              </div>
            </div>
            <TextareaField
              label="Additional Notes"
              value={form.notes}
              onChange={(v) => set('notes', v)}
              placeholder="Any context, constraints, or notes about this event..."
              rows={3}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Creating…' : <><Check className="w-4 h-4" /> Create Event</>}
          </button>
        )}
      </div>
    </div>
  );
}
