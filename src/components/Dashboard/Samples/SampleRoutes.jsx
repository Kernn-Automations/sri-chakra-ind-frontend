import React, { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";

// Lazy-loaded components
const SampleHome = lazy(() => import("./SampleHome"));
const CreateSample = lazy(() => import("./CreateSample"));
const ViewSamples = lazy(() => import("./ViewSamples"));
const EditSample = lazy(() => import("./EditSample"));

import { isAdmin as checkAdmin, isDivisionHead } from "../../../utils/roleUtils";

function SampleRoutes() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  
  // Allow Admin OR Division Head
  const isAdmin = checkAdmin(user) || isDivisionHead(user);

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SampleHome navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateSample navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/view"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ViewSamples navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/edit/:sampleId"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <EditSample navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default SampleRoutes;

