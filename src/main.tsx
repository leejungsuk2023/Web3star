import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './app/App.tsx';
import './styles/index.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('cap-native');
} else if (
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('nativePreview') === '1'
) {
  document.documentElement.classList.add('cap-native', 'native-preview');
}

const routesModule =
  import.meta.env.VITE_DEPLOY_TARGET === 'web'
    ? import('./app/routes.web')
    : import('./app/routes.app');

void routesModule.then(({ router }) => {
  createRoot(document.getElementById('root')!).render(<App router={router} />);
});
  