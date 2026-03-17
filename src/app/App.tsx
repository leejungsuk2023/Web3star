import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from '../context/AuthContext';
import { initAdMob } from '../lib/admob';

export default function App() {
  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" richColors />
    </AuthProvider>
  );
}
