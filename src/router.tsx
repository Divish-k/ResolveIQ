import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CustomerLayout from "@/components/layout/CustomerLayout";
import Entry from "@/pages/Entry";
import Login from "@/pages/Login";
import BusinessOverview from "@/pages/Dashboard";
import IncomingComplaints from "@/pages/IncomingComplaints";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import PriorityQueue from "@/pages/PriorityQueue";
import Investigation from "@/pages/Investigation";
import AcanAgents from "@/pages/AcanAgents";
import Evidence from "@/pages/Evidence";
import Decisions from "@/pages/Decisions";
import Resolutions from "@/pages/Resolutions";
import Analytics from "@/pages/Analytics";
import BusinessSettings from "@/pages/BusinessSettings";
import Help from "@/pages/Help";
import CustomerDashboard from "@/pages/CustomerDashboard";
import RaiseComplaint from "@/pages/RaiseComplaint";
import MyComplaints from "@/pages/MyComplaints";
import TrackCase from "@/pages/TrackCase";
import TrackCaseRedirect from "@/pages/TrackCaseRedirect";
import CustomerNotifications from "@/pages/CustomerNotifications";
import CustomerProfile from "@/pages/CustomerProfile";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "entry",
    element: <Entry />,
  },
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  // ── Customer Dashboard ─────────────────────────────────────────────────────
  {
    path: "/customer",
    name: "customer-shell",
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: "raise", element: <RaiseComplaint /> },
      { path: "complaints", element: <MyComplaints /> },
      { path: "track", element: <TrackCaseRedirect /> },
      { path: "track/:id", element: <TrackCase /> },
      { path: "notifications", element: <CustomerNotifications /> },
      { path: "profile", element: <CustomerProfile /> },
    ],
  },
  // ── Business / Company Dashboard ───────────────────────────────────────────
  {
    path: "/business",
    name: "business-shell",
    element: <AppLayout />,
    children: [
      { index: true, element: <BusinessOverview /> },
      { path: "incoming", element: <IncomingComplaints /> },
      { path: "cases", element: <Cases /> },
      { path: "cases/:id", element: <CaseDetail /> },
      { path: "queue", element: <PriorityQueue /> },
      { path: "investigations", element: <Investigation /> },
      { path: "agents", element: <AcanAgents /> },
      { path: "evidence", element: <Evidence /> },
      { path: "decisions", element: <Decisions /> },
      { path: "resolutions", element: <Resolutions /> },
      { path: "analytics", element: <Analytics /> },
      { path: "settings", element: <BusinessSettings /> },
      { path: "help", element: <Help /> },
    ],
  },
  // ── Backwards-compatible redirects (previous routes) ───────────────────────
  { path: "/dashboard", element: <Navigate to="/business" replace /> },
  { path: "/submit", element: <Navigate to="/customer/raise" replace /> },
  { path: "/cases", element: <Navigate to="/business/cases" replace /> },
  { path: "/cases/:id", element: <Navigate to={`/business/cases/${window.location.pathname.split("/").pop()}`} replace /> },
  { path: "/investigation", element: <Navigate to="/business/investigations" replace /> },
  { path: "/evidence", element: <Navigate to="/business/evidence" replace /> },
  { path: "/analytics", element: <Navigate to="/business/analytics" replace /> },
  { path: "/help", element: <Navigate to="/business/help" replace /> },
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
