import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import type { RouterProviderProps } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { isWebMarketingBuild } from '../lib/deployTarget';
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
      {isWebMarketingBuild ? (
        /* Landing + long scroll: no fixed h-screen — avoids white body showing past the first viewport */
        <div className="flex min-h-dvh w-full flex-col bg-black">
          <RouterProvider router={router} />
          <Toaster theme="dark" position="top-center" richColors />
        </div>
      ) : (
        /* Capacitor: lock height so tab bar / keyboard layout stay predictable */
        <div className="flex h-screen max-h-dvh min-h-0 w-full flex-1 flex-col bg-black">
          <div className="flex min-h-0 flex-1 flex-col">
            <RouterProvider router={router} />
          </div>
          <Toaster theme="dark" position="top-center" richColors />
        </div>
      )}
    </AuthProvider>
  );
}
