import { useState } from 'react';
import type { Lead, LeadFormInput } from '../lib/types';
import { COMPANY_SIZES, ENGAGEMENTS, SOURCES, STAGES, TIMELINES } from '../lib/types';
import { Modal } from './Modal';

const EMPTY: LeadFormInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  industry: '',
  company_size: 'unknown',
  source: 'other',
  budget: null,
  timeline: 'not_sure',
  engagement_level: 'low',
  decision_maker: false,
  pain_points: '',
  notes: '',
  stage: 'new',
};

export function LeadFormModal({
  lead,
  onClose,
  onSubmit,
}: {
  lead?: Lead;
  onClose: () => void;
  onSubmit: (input: LeadFormInput) => Promise<void>;
}) {
  const [form, setForm] = useState<LeadFormInput>(
    lead
      ? {
          name: lead.name,
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          company: lead.company ?? '',
          industry: lead.industry ?? '',
          company_size: lead.company_size,
          source: lead.source,
          budget: lead.budget,
          timeline: lead.timeline,
          engagement_level: lead.engagement_level,
          decision_maker: lead.decision_maker,
          pain_points: lead.pain_points ?? '',
          notes: lead.notes ?? '',
          stage: lead.stage,
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LeadFormInput>(key: K, value: LeadFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
  const labelClass = 'mb-1 block text-xs font-medium text-slate-600';

  return (
    <Modal title={lead ? 'Edit lead' : 'Add lead'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input className={inputClass} value={form.company ?? ''} onChange={(e) => set('company', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Industry</label>
          <input className={inputClass} value={form.industry ?? ''} onChange={(e) => set('industry', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Company size</label>
          <select className={inputClass} value={form.company_size} onChange={(e) => set('company_size', e.target.value as LeadFormInput['company_size'])}>
            {COMPANY_SIZES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <select className={inputClass} value={form.source} onChange={(e) => set('source', e.target.value as LeadFormInput['source'])}>
            {SOURCES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select className={inputClass} value={form.stage} onChange={(e) => set('stage', e.target.value as LeadFormInput['stage'])}>
            {STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Estimated budget (USD)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.budget ?? ''}
            onChange={(e) => set('budget', e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Buying timeline</label>
          <select className={inputClass} value={form.timeline} onChange={(e) => set('timeline', e.target.value as LeadFormInput['timeline'])}>
            {TIMELINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Engagement level</label>
          <select className={inputClass} value={form.engagement_level} onChange={(e) => set('engagement_level', e.target.value as LeadFormInput['engagement_level'])}>
            {ENGAGEMENTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.decision_maker} onChange={(e) => set('decision_maker', e.target.checked)} />
            Confirmed decision-maker
          </label>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Pain points</label>
          <textarea className={inputClass} rows={2} value={form.pain_points ?? ''} onChange={(e) => set('pain_points', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea className={inputClass} rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {error && <div className="col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? 'Saving…' : lead ? 'Save changes' : 'Add lead & score'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
