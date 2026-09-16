import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Submit from "@/pages/Submit";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import Investigation from "@/pages/Investigation";
import Evidence from "@/pages/Evidence";
import Analytics from "@/pages/Analytics";
import Help from "@/pages/Help";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/",
    name: "shell",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        name: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "submit",
        name: "submit",
        element: <Submit />,
      },
      {
        path: "cases",
        name: "cases",
        element: <Cases />,
      },
      {
        path: "cases/:id",
        name: "case-detail",
        element: <CaseDetail />,
      },
      {
        path: "investigation",
        name: "investigation",
        element: <Investigation />,
      },
      {
        path: "evidence",
        name: "evidence",
        element: <Evidence />,
      },
      {
        path: "analytics",
        name: "analytics",
        element: <Analytics />,
      },
      {
        path: "help",
        name: "help",
        element: <Help />,
      },
    ],
  },
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
