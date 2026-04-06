import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getPostAuthPath } from '../../lib/deployTarget';
import { getSafePostLoginPath } from '../../lib/loginRedirect';
import { clearStoredPendingNext, readStoredPendingNext } from '../../lib/pendingNextAfterOAuth';

/**
 * Supabase OAuth가 Site URL 루트(`https://web3star.org/#access_token=...`)로만 돌아오면
 * `/app/login`이 마운트되지 않아 `next`를 읽지 못하는 경우가 있음. 저장된 pending next로 보정.
 */
export default function WebMarketingRouteRoot() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;

    const pending = readStoredPendingNext();
    if (!pending?.trim()) return;

    const target = getSafePostLoginPath(pending);
    const fallback = getPostAuthPath();
    if (target === fallback) {
      clearStoredPendingNext();
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      clearStoredPendingNext();
      return;
    }

    clearStoredPendingNext();
    navigate(target, { replace: true });
  }, [loading, user, navigate, location.pathname]);

  return <Outlet />;
}
