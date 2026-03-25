import { createBrowserRouter, redirect } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Splash from './pages/Splash';
import AdMobTest from './pages/AdMobTest';
import ProtectedRoute from '../components/ProtectedRoute';

const routerBase = import.meta.env.BASE_URL;

/**
 * Capacitor APK용: 스플래시·마이닝·프로필 등 본 앱. 마케팅 Homepage 라우트 없음.
 */
export const router = createBrowserRouter(
  [
    { path: '/', loader: () => redirect('/app/splash') },
    { path: '/app/splash', Component: Splash },
    { path: '/app/login', Component: Login },
    { path: '/app/signup', Component: Signup },
    { path: '/app/admob-test', Component: AdMobTest },
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
    { path: '/signup', loader: () => redirect('/app/signup') },
    { path: '/splash', loader: () => redirect('/app/splash') },
    { path: '/leaderboard', loader: () => redirect('/app/leaderboard') },
    { path: '/profile', loader: () => redirect('/app/profile') },
    { path: '/admob-test', loader: () => redirect('/app/admob-test') },
    { path: '/homepage', loader: () => redirect('/app/splash') },
    { path: '*', loader: () => redirect('/app/splash') },
  ],
  { basename: routerBase },
);
