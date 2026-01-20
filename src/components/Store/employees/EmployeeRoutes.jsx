import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const EmployeesList = lazy(() => import("./EmployeesList"));
const EmployeeDetailsPage = lazy(() => import("./EmployeeDetailsPage"));

export default function EmployeeRoutes() {
  
  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <EmployeesList />
          </Suspense>
        }
      />
      <Route
        path="/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <EmployeeDetailsPage />
          </Suspense>
        }
      />
    </Routes>
  );
}















