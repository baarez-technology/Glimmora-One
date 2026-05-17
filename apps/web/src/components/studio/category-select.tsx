'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PRESET = [
  'meditation',
  'growth',
  'emotional-intelligence',
  'wisdom',
  'relationships',
  'purpose',
];

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  function commit() {
    const cleaned = draft.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (cleaned) {
      onChange(cleaned);
      setDraft('');
      setAdding(false);
    }
  }

  if (adding) {
    return (
      <div className="flex gap-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setAdding(false);
              setDraft('');
            }
          }}
          placeholder="e.g. workplace-calm"
          maxLength={48}
        />
        <button
          type="button"
          onClick={commit}
          disabled={!draft.trim()}
          className="h-10 w-10 inline-flex items-center justify-center rounded-md bg-glimmer-400 text-ink-950 hover:bg-glimmer-300 disabled:opacity-40"
          aria-label="Save category"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setDraft('');
          }}
          className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-app text-muted hover:text-app"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // If value is custom (not in PRESET), include it as a temporary option so
  // the select keeps showing it.
  const options = PRESET.includes(value) || !value ? PRESET : [...PRESET, value];

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-app bg-elev px-3 text-sm text-app"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="h-10 px-3 inline-flex items-center gap-1 rounded-md border border-app text-muted hover:text-app hover:bg-app/5 text-xs whitespace-nowrap"
        aria-label="Add custom category"
      >
        <Plus className="h-3 w-3" /> Custom
      </button>
    </div>
  );
}
