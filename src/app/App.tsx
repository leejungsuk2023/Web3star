import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from '../context/AuthContext';
import { initAdMob } from '../lib/admob';
import { initSocialLogin } from '../lib/socialLogin';

export default function App() {
  useEffect(() => {
    initAdMob();
    // 네이티브 Google 로그인 초기화 (Android WebView OAuth 차단 회피)
    initSocialLogin().catch((e) => console.warn('SocialLogin init failed:', e));
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" richColors />
    </AuthProvider>
  );
}
