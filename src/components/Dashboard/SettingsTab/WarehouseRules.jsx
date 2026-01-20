import React, { lazy, Suspense } from "react";
import styles from "./Settings.module.css";
import AddWarehouseRuleModal from "./AddWarehouseRuleModal";
import DeleteWarehouseRuleModal from "./DeleteWarehouseRuleModal";
import { Route, Routes } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

function WarehouseRules({ navigate }) {
  const OngoingWarehouseRules = lazy(() => import("./OngoingWarehouseRules"));
  return (
    <>
      <Routes>
        <Route
          index
          element={
            <>
              <p className="path">
                <span onClick={() => navigate("/settings")}>Settings</span>{" "}
                <i class="bi bi-chevron-right"></i> Warehouse Rules
              </p>
              <AddWarehouseRuleModal />
              <DeleteWarehouseRuleModal />
              <button
                className="homebtn"
                onClick={() => navigate("/settings/warehouse-rules/ongoing")}
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
              <OngoingWarehouseRules navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default WarehouseRules;
