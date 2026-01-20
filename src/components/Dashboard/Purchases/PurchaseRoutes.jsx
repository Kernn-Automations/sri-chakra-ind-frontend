import React, { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import styles from "./Purchases.module.css";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import Vendors from "./Vendors";

// Lazy-loaded components
const PurchaseHome = lazy(() => import("./PurchaseHome"));
const NewPurchase = lazy(() => import("./NewPurchase"));
const PurchaseReport = lazy(() => import("./PurchaseReport"));

function PurchaseRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PurchaseHome navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/new-purchase"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <NewPurchase navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/purchase-report"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PurchaseReport navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/vendors"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Vendors navigate={navigate} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default PurchaseRoutes;
