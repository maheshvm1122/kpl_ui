import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../common/Feedback';

/** Requires login, and optionally one of `roles`. */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader className="min-h-screen" />;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return <Outlet />;
}
