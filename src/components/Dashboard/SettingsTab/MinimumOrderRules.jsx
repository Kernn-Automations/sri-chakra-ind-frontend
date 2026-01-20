import React, { lazy, Suspense } from "react";
import styles from "./Settings.module.css";
import NewMinOrderModal from "./NewMinOrderModal";
import { Route, Routes } from "react-router-dom";
import DeleteMinOrderModal from "./DeleteMinOrderModal";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

function MinimumOrderRules({ navigate }) {
  const OngoingMinOrder = lazy(() => import("./OngoingMinOrder"));
  return (
    <>
      <Routes>
        <Route
          index
          element={
            <>
             
              <button
                className="homebtn"
                onClick={() => navigate("/settings/minimum-order-rules/ongoing")}
              >
                Ongoing
              </button>
            </>
          }
        />

        <Route
          path="/ongoing"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <OngoingMinOrder navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default MinimumOrderRules;
