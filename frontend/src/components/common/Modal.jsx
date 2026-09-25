import React from 'react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded border border-ink-border bg-ink-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-border bg-ink-surface px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-parchment">{title}</h2>
          <button onClick={onClose} className="text-parchment-muted hover:text-parchment" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
