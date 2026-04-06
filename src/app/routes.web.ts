import { createElement } from 'react';
import { createBrowserRouter, Navigate, redirect } from 'react-router';
import { adminRouteObject } from './admin/adminRoutes';
import ChunkLoadErrorFallback from './components/ChunkLoadErrorFallback';
import WebMarketingRouteRoot from './components/WebMarketingRouteRoot';
import Login from './pages/Login';
import { viteRouterBasename } from '../lib/routerBasename';

const routerBase = viteRouterBasename();

/**
 * GitHub Pages 등 웹 배포용: 랜딩(소개) + 로그인/가입만. /app 본 기능 라우트 없음.
 */
export const router = createBrowserRouter(
  [
    {
      element: createElement(WebMarketingRouteRoot),
      errorElement: createElement(ChunkLoadErrorFallback),
      children: [
        {
          path: '/',
          lazy: () => import('./pages/Homepage').then((m) => ({ Component: m.default })),
        },
        { path: '/app/login', Component: Login },
        { path: '/app/signup', element: createElement(Navigate, { to: '/app/login', replace: true }) },
        { path: '/login', loader: () => redirect('/app/login') },
        { path: '/signup', element: createElement(Navigate, { to: '/app/login', replace: true }) },
        { path: '/app/splash', loader: () => redirect('/app/login') },
        { path: '/app/admob-test', loader: () => redirect('/') },
        { path: '/app', loader: () => redirect('/?app=1') },
        { path: '/app/*', loader: () => redirect('/?app=1') },
        adminRouteObject,
        { path: '*', loader: () => redirect('/') },
      ],
    },
  ],
  { basename: routerBase },
);
