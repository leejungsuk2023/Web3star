import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import type { RouterProviderProps } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { initAdMob } from '../lib/admob';
import { initSocialLogin } from '../lib/socialLogin';

type AppProps = { router: RouterProviderProps['router'] };

export default function App({ router }: AppProps) {
  useEffect(() => {
    initAdMob();
    // Native Google Sign-In (avoids WebView OAuth restrictions on Android)
    initSocialLogin().catch((e) => console.warn('SocialLogin init failed:', e));
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" richColors />
    </AuthProvider>
  );
}
