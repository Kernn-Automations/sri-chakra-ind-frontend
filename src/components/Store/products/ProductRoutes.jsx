import React, { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const StoreProducts = lazy(() => import("./StoreProducts"));
const StoreManageProducts = lazy(() => import("./StoreManageProducts"));
const StoreAddProduct = lazy(() => import("./StoreAddProduct"));
const StoreBulkPriceUpdate = lazy(() => import("./StoreBulkPriceUpdate"));

export default function ProductRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreProducts />
          </Suspense>
        }
      />
      <Route
        path="/manage"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreManageProducts />
          </Suspense>
        }
      />
      <Route
        path="/add"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreAddProduct navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/bulk-update"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreBulkPriceUpdate navigate={navigate} />
          </Suspense>
        }
      />
    </Routes>
  );
}

