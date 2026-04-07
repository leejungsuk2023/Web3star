import { createElement } from 'react';
import { createBrowserRouter, Navigate, redirect } from 'react-router';
import { adminRouteObject } from './admin/adminRoutes';
import AppRouteRoot from './components/AppRouteRoot';
import ChunkLoadErrorFallback from './components/ChunkLoadErrorFallback';
import Layout from './components/Layout';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Splash from './pages/Splash';
import ProtectedRoute from '../components/ProtectedRoute';
import { viteRouterBasename } from '../lib/routerBasename';

const routerBase = viteRouterBasename();

/**
 * Capacitor APK용: 스플래시·마이닝·프로필 등 본 앱. 마케팅 Homepage 라우트 없음.
 */
export const router = createBrowserRouter(
  [
    {
      Component: AppRouteRoot,
      errorElement: createElement(ChunkLoadErrorFallback),
      children: [
        { path: '/', loader: () => redirect('/app/splash') },
        { path: '/app/splash', Component: Splash },
        { path: '/app/login', Component: Login },
        { path: '/app/signup', element: createElement(Navigate, { to: '/app/login', replace: true }) },
        ...(import.meta.env.DEV
          ? [
              {
                path: '/app/admob-test',
                lazy: async () => {
                  const { default: Component } = await import('./pages/AdMobTest');
                  return { Component };
                },
              },
            ]
          : [{ path: '/app/admob-test', loader: () => redirect('/app/splash') }]),
        ...(import.meta.env.DEV
          ? [
              {
                path: '/app/__preview/mobile',
                loader: () => redirect('/app/__preview/home?nativePreview=1'),
              },
              {
                path: '/app/__preview/home',
                Component: Layout,
                children: [{ index: true, Component: Home }],
              },
              {
                path: '/app/__preview/leaderboard',
                Component: Layout,
                children: [{ index: true, Component: Leaderboard }],
              },
              {
                path: '/app/__preview/profile',
                Component: Layout,
                children: [{ index: true, Component: Profile }],
              },
            ]
          : []),
        {
          path: '/app',
          Component: ProtectedRoute,
          children: [
            {
              Component: Layout,
              children: [
                { index: true, Component: Home },
                { path: 'leaderboard', Component: Leaderboard },
                { path: 'profile', Component: Profile },
              ],
            },
          ],
        },
        { path: '/login', loader: () => redirect('/app/login') },
        { path: '/signup', element: createElement(Navigate, { to: '/app/login', replace: true }) },
        { path: '/splash', loader: () => redirect('/app/splash') },
        { path: '/leaderboard', loader: () => redirect('/app/leaderboard') },
        { path: '/profile', loader: () => redirect('/app/profile') },
        {
          path: '/admob-test',
          loader: () => redirect(import.meta.env.DEV ? '/app/admob-test' : '/app/splash'),
        },
        { path: '/homepage', loader: () => redirect('/app/splash') },
        ...(import.meta.env.DEV ? [adminRouteObject] : []),
        { path: '*', loader: () => redirect('/app/splash') },
      ],
    },
  ],
  { basename: routerBase },
);
