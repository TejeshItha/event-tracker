'use client';
import { useState } from 'react';
import { AppSettings } from '@/lib/types';
import { formatINRFull } from '@/lib/classification';

export default function BudgetSettingsForm({ settings }: { settings: AppSettings }) {
  const [form, setForm] = useState({
    annualBudget: settings.annualBudget,
    q1Budget: settings.q1Budget,
    q2Budget: settings.q2Budget,
    q3Budget: settings.q3Budget,
    q4Budget: settings.q4Budget,
    currentQuarter: settings.currentQuarter,
    currentYear: settings.currentYear,
    companyName: settings.companyName,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Budget Settings</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
          <input type="text" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Current Year</label>
          <input type="number" value={form.currentYear} onChange={(e) => setForm((f) => ({ ...f, currentYear: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Current Quarter</label>
          <select value={form.currentQuarter} onChange={(e) => setForm((f) => ({ ...f, currentQuarter: e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4' }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Annual Budget (₹)</label>
          <input type="number" value={form.annualBudget} onChange={(e) => setForm((f) => ({ ...f, annualBudget: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {(['q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'] as const).map((k, i) => (
          <div key={k}>
            <label className="block text-xs font-medium text-slate-500 mb-1">Q{i + 1} Budget (₹)</label>
            <input type="number" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        ))}
      </div>
      <button onClick={save} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
