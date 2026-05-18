import { readSettings } from '@/lib/storage';
import BudgetSettingsForm from '@/components/dashboard/BudgetSettingsForm';

export default async function SettingsPage() {
  const settings = await readSettings();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <BudgetSettingsForm settings={settings} />
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Scoring Weights</h2>
        <p className="text-sm text-slate-500 mb-4">Default scoring weights are applied per event bucket. These can be customized in a future version.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500">Dimension</th>
                <th className="text-center py-2 text-slate-500">Low-cost</th>
                <th className="text-center py-2 text-slate-500">Micro</th>
                <th className="text-center py-2 text-slate-500">Mini</th>
                <th className="text-center py-2 text-slate-500">Major</th>
                <th className="text-center py-2 text-slate-500">Strategic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {['icpFit', 'businessValue', 'packageQuality', 'strategicValue', 'salesReadiness', 'costEfficiency'].map((dim) => (
                <tr key={dim}>
                  <td className="py-2 capitalize text-slate-700">{dim.replace(/([A-Z])/g, ' $1')}</td>
                  {(['low-cost', 'micro', 'mini', 'major', 'strategic'] as const).map((b) => (
                    <td key={b} className="text-center py-2 font-medium text-slate-800">
                      {settings.scoringWeights[b][dim as keyof typeof settings.scoringWeights.micro]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Event Bucket Ranges</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Low-cost / Experimental', range: 'Below ₹40,000' },
            { label: 'Micro Event', range: '₹40,000 – ₹99,999' },
            { label: 'Mini Event', range: '₹1,00,000 – ₹2,99,999' },
            { label: 'Major Event', range: '₹3,00,000 – ₹6,00,000' },
            { label: 'Strategic Event', range: 'Above ₹6,00,000' },
          ].map((b) => (
            <div key={b.label} className="flex justify-between py-2 border-b border-slate-50">
              <span className="font-medium text-slate-700">{b.label}</span>
              <span className="text-slate-500">{b.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
