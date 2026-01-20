import React, { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const StoreCustomersHome = lazy(() => import("./StoreCustomersHome"));
const CustomersList = lazy(() => import("./CustomersList"));
const CreateStoreCustomer = lazy(() => import("./CreateStoreCustomer"));
const CustomerDetailsPage = lazy(() => import("./CustomerDetailsPage"));

export default function CustomerRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreCustomersHome />
          </Suspense>
        }
      />
      <Route
        path="/list"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomersList />
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateStoreCustomer />
          </Suspense>
        }
      />
      <Route
        path="/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerDetailsPage />
          </Suspense>
        }
      />
    </Routes>
  );
}

