import React, { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";

// Lazy-loaded components
const TeamsHome = lazy(() => import("./TeamsHome"));
const CreateTeam = lazy(() => import("./CreateTeam"));
const TeamViewModal = lazy(() => import("./TeamViewModal"));
const TeamDetails = lazy(() => import("./TeamDetails"));

function TeamsRoutes() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const roles = JSON.stringify(user.roles);

  const isAdmin = roles.includes("Admin");

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TeamsHome navigate={navigate} isAdmin={isAdmin}/>
          </Suspense>
        }
      />
      <Route
        path="/create-team"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateTeam navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path=":teamId"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TeamDetails />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default TeamsRoutes;
