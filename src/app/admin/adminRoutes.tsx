import type { RouteObject } from 'react-router';

/** 웹 빌드 + 로컬 `npm run dev`(앱 라우터)에서 공통 사용 */
export const adminRouteObject: RouteObject = {
  path: '/admin',
  lazy: () => import('./AdminLayout').then((m) => ({ Component: m.default })),
  children: [
    {
      index: true,
      lazy: () => import('./pages/AdminDashboard').then((m) => ({ Component: m.default })),
    },
    {
      path: 'users',
      lazy: () => import('./pages/AdminUsers').then((m) => ({ Component: m.default })),
    },
    {
      path: 'referrals',
      lazy: () => import('./pages/AdminReferrals').then((m) => ({ Component: m.default })),
    },
    {
      path: 'points',
      lazy: () => import('./pages/AdminPoints').then((m) => ({ Component: m.default })),
    },
    {
      path: 'mining',
      lazy: () => import('./pages/AdminMining').then((m) => ({ Component: m.default })),
    },
    {
      path: 'content',
      lazy: () => import('./pages/AdminContent').then((m) => ({ Component: m.default })),
    },
    {
      path: 'reports',
      lazy: () => import('./pages/AdminReports').then((m) => ({ Component: m.default })),
    },
    {
      path: 'system',
      lazy: () => import('./pages/AdminSystem').then((m) => ({ Component: m.default })),
    },
  ],
};
