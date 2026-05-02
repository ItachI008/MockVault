import { Navigate } from 'react-router-dom';
import { hasAuthSession, getStoredUser } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarded?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarded = true }: ProtectedRouteProps) => {
  if (!hasAuthSession()) return <Navigate to="/login" replace />;
  
  const user = getStoredUser();
  if (requireOnboarded && user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (!requireOnboarded && user?.isOnboarded) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
