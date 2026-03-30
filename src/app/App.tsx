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
      {/* h-screen + max-h-dvh: full viewport height; safe-area padding lives in Layout / auth pages so the tab bar isn’t separated by an outer gap */}
      <div className="flex h-screen max-h-dvh min-h-0 w-full flex-1 flex-col bg-black">
        <div className="flex min-h-0 flex-1 flex-col">
          <RouterProvider router={router} />
        </div>
        <Toaster theme="dark" position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}
