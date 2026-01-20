// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./Auth"; // <-- just the hook
import "./App.css";
import { lazy, Suspense } from "react";
import DashboardSkeleton from "./components/SkeletonLoaders/DashboardSkeleton";
import LoginSkeleton from "./components/SkeletonLoaders/LoginSkeleton";
import ReportsPage from "./components/UnauthReports/ReportsPage";
import { isAdmin, isStoreManager, isStoreEmployee } from "./utils/roleUtils";
// lazy imports
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const Login = lazy(() => import("./components/Login"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));
const Divs = lazy(() => import("./pages/Divs"));
const StoreSelector = lazy(() => import("./pages/StoreSelector"));
const StoreDashboard = lazy(() => import("./components/Store/StoreDashboard"));

const getNormalizedUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || parsed;
  } catch (error) {
    console.error("App.jsx - Failed to parse stored user:", error);
    return null;
  }
};

const shouldRouteToStoreView = () => {
  const activeView = localStorage.getItem("activeView");
  if (activeView === "staff" || activeView === "employee") return true;
  if (activeView === "admin") return false;

  const user = getNormalizedUser();
  if (!user) return false;

  // Store managers should ALWAYS go to store view, even if they have admin role
  const isStoreManagerUser = isStoreManager(user);
  const isStoreEmployeeUser = isStoreEmployee(user);
  
  // If user is store manager or employee, they should go to store view
  // This takes priority over admin role
  if (isStoreManagerUser || isStoreEmployeeUser) {
    return true;
  }
  
  return false;
};

function DashboardEntry() {
  const location = useLocation();
  const [redirectToStore, setRedirectToStore] = useState(() => shouldRouteToStoreView());

  useEffect(() => {
    setRedirectToStore(shouldRouteToStoreView());
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = () => setRedirectToStore(shouldRouteToStoreView());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (redirectToStore) {
    // If user should be in store view and not already on store routes, redirect to /store
    if (!location.pathname.startsWith("/store")) {
      return <Navigate to="/store" replace />;
    }
  }

  return <Dashboard />;
}

export default function App() {
  const { islogin, setIslogin } = useAuth();
  const token = localStorage.getItem("accessToken");

  // restore your old islogin logic
  useEffect(() => {
    console.log("App.jsx - Token changed:", token ? "EXISTS" : "MISSING");
    console.log("App.jsx - Current pathname:", window.location.pathname);

    // Only set login state if we're not already on a protected route
    if (window.location.pathname === "/login") {
      setIslogin(!!token);
    } else if (token) {
      setIslogin(true);
    }
  }, [token, setIslogin]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoginSkeleton />}>
            <Login />
          </Suspense>
        }
      />

      <Route
        path="/daily-reports"
        element={
          <Suspense fallback={<LoginSkeleton />}>
            <ReportsPage />
          </Suspense>
        }
      />

      <Route path="/divs" element={<Divs />} />
      
      {/* Store Selector Route */}
      <Route path="/store-selector" element={
        <Suspense fallback={<DashboardSkeleton />}>
          <StoreSelector />
        </Suspense>
      } />
      
      {/* Store Routes */}
      <Route path="/store/*" element={
        <Suspense fallback={<DashboardSkeleton />}>
          <StoreDashboard />
        </Suspense>
      } />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute token={token} />}>
        {/* Dashboard with nested routes */}
        <Route
          path="/*"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardEntry />
            </Suspense>
          }
        />

        {/* Direct routes to different sections */}
        {/* <Route path="/home" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <HomePage />
          </Suspense>
        } /> */}

        {/* <Route path="/divisions" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <DivisionManager />
          </Suspense>
        } /> */}
      </Route>
    </Routes>
  );
}
