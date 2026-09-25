import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded border border-ink-border bg-ink-surface p-8">
        <p className="font-display text-2xl font-semibold tracking-tight text-parchment">MAMS</p>
        <p className="mt-1 text-sm text-parchment-muted">Military Asset Management System</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none"
              placeholder="you@mams.local"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-ink-border bg-ink px-3 py-2 text-sm text-parchment focus:border-olive-dim focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-rust-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-olive-dim py-2 text-sm font-medium text-parchment transition-colors hover:bg-olive disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
