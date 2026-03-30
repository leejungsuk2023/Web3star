import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PROTECTED_LOADING_H_CLASS } from '../lib/nativeLayout';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`${PROTECTED_LOADING_H_CLASS} w-full bg-black flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  return <Outlet />;
}
