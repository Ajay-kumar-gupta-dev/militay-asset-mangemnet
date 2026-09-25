import React from 'react';

// Shared filter row used by Dashboard, Purchases and Transfers pages.
// `bases` is omitted for non-admins (rbac already scopes them server-side,
// so showing a redundant single-option dropdown adds nothing).
export default function FilterBar({ filters, onChange, bases, equipmentTypes, showBaseFilter }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const fieldClass =
    'rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded border border-ink-border bg-ink-surface p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-muted">From</label>
        <input
          type="date"
          className={fieldClass}
          value={filters.from_date || ''}
          onChange={(e) => update('from_date', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-muted">To</label>
        <input
          type="date"
          className={fieldClass}
          value={filters.to_date || ''}
          onChange={(e) => update('to_date', e.target.value)}
        />
      </div>

      {showBaseFilter && bases && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-muted">Base</label>
          <select className={fieldClass} value={filters.base_id || ''} onChange={(e) => update('base_id', e.target.value)}>
            <option value="">All bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {equipmentTypes && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-muted">Equipment type</label>
          <select
            className={fieldClass}
            value={filters.equipment_type_id || ''}
            onChange={(e) => update('equipment_type_id', e.target.value)}
          >
            <option value="">All types</option>
            {equipmentTypes.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={() => onChange({})}
        className="ml-auto rounded border border-ink-border px-3 py-2 text-xs text-parchment-muted transition-colors hover:border-rust hover:text-rust-bright"
      >
        Clear filters
      </button>
    </div>
  );
}
