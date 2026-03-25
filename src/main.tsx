import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

const routesModule =
  import.meta.env.VITE_DEPLOY_TARGET === 'web'
    ? import('./app/routes.web')
    : import('./app/routes.app');

void routesModule.then(({ router }) => {
  createRoot(document.getElementById('root')!).render(<App router={router} />);
});
  