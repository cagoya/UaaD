import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';
import { buildLoginPath } from '../utils/auth';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={buildLoginPath({ redirectTo })}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};
