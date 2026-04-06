import { createElement } from 'react';
import { Outlet, createBrowserRouter, redirect } from 'react-router';
import { adminRouteObject } from './admin/adminRoutes';
import ChunkLoadErrorFallback from './components/ChunkLoadErrorFallback';
import Login from './pages/Login';
import Signup from './pages/Signup';

const routerBase = import.meta.env.BASE_URL;

/**
 * GitHub Pages 등 웹 배포용: 랜딩(소개) + 로그인/가입만. /app 본 기능 라우트 없음.
 */
export const router = createBrowserRouter(
  [
    {
      element: createElement(Outlet),
      errorElement: createElement(ChunkLoadErrorFallback),
      children: [
        {
          path: '/',
          lazy: () => import('./pages/Homepage').then((m) => ({ Component: m.default })),
        },
        { path: '/app/login', Component: Login },
        { path: '/app/signup', Component: Signup },
        { path: '/login', loader: () => redirect('/app/login') },
        { path: '/signup', loader: () => redirect('/app/signup') },
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
