import React, { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const StoreIndentsHome = lazy(() => import("./StoreIndentsHome"));
const ViewAllIndents = lazy(() => import("./ViewAllIndents"));
const CreateIndent = lazy(() => import("./CreateIndent"));

export default function IndentRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreIndentsHome />
          </Suspense>
        }
      />
      <Route
        path="/all"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ViewAllIndents />
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateIndent navigate={navigate} />
          </Suspense>
        }
      />
    </Routes>
  );
}

