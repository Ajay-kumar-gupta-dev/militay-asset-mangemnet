import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center">
        <div>
          <p className="font-display text-xl text-parchment">Access restricted</p>
          <p className="mt-2 text-sm text-parchment-muted">
            Your role ({user.role.replace('_', ' ')}) doesn't have access to this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
