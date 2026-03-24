import { createBrowserRouter, redirect } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Splash from "./pages/Splash";
import AdMobTest from "./pages/AdMobTest";
import ProtectedRoute from "../components/ProtectedRoute";

const routerBase = import.meta.env.BASE_URL;

export const router = createBrowserRouter([
  {
    path: "/splash",
    Component: Splash,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/admob-test",
    Component: AdMobTest,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Home },
          { path: "leaderboard", Component: Leaderboard },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
  {
    path: "*",
    loader: () => redirect("/"),
  },
], {
  basename: routerBase,
});
