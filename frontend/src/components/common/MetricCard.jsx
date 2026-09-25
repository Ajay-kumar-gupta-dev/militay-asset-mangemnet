import React from 'react';

const ACCENTS = {
  neutral: 'text-parchment',
  olive: 'text-olive-bright',
  amber: 'text-amber-bright',
  rust: 'text-rust-bright',
};

export default function MetricCard({ label, value, accent = 'neutral', onClick, hint }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`w-full rounded border border-ink-border bg-ink-surface p-5 text-left transition-colors ${
        onClick ? 'cursor-pointer hover:border-olive-dim hover:bg-ink-raised' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-parchment-muted">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-medium ${ACCENTS[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-parchment-muted">{hint}</p>}
    </Comp>
  );
}
