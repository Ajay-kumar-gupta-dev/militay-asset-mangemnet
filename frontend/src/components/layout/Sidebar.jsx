import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'base_commander', 'logistics_officer'] },
  { to: '/purchases', label: 'Purchases', roles: ['admin', 'base_commander', 'logistics_officer'] },
  { to: '/transfers', label: 'Transfers', roles: ['admin', 'base_commander', 'logistics_officer'] },
  { to: '/assignments', label: 'Assignments & Expenditures', roles: ['admin', 'base_commander'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-border bg-ink-surface">
      <div className="border-b border-ink-border px-6 py-5">
        <p className="font-display text-lg font-semibold tracking-tight text-parchment">MAMS</p>
        <p className="mt-0.5 text-xs text-parchment-muted">Asset Management System</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-olive-dim/40 text-olive-bright border-l-2 border-olive-bright pl-[10px]'
                  : 'text-parchment-muted hover:bg-ink-raised hover:text-parchment'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-border px-4 py-4">
        <p className="text-sm text-parchment">{user.name}</p>
        <p className="text-xs capitalize text-parchment-muted">
          {user.role.replace('_', ' ')}
          {user.base ? ` · ${user.base.name}` : ' · All bases'}
        </p>
        <button
          onClick={logout}
          className="mt-3 text-xs text-rust-bright transition-colors hover:text-rust"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
