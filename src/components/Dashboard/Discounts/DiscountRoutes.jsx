import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";
import React, { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

const DiscountHome = lazy(() => import("./DiscountHome"));
const BillToBill = lazy(() => import("./BillToBill"));
const MonthlyDiscount = lazy(() => import("./MonthlyDiscount"));

function DiscountRoutes() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const roles = JSON.stringify(user.roles);

  const isAdmin = roles.includes("Admin");

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <DiscountHome navigate={navigate} />
            </Suspense>
          }
        />

        <Route
          path="/bill-to-bill"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <BillToBill navigate={navigate} isAdmin={isAdmin} />
            </Suspense>
          }
        />

        <Route
          path="/monthly"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <MonthlyDiscount navigate={navigate} isAdmin={isAdmin} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default DiscountRoutes;
