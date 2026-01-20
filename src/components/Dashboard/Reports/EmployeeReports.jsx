import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const EmployeeMonthReport = lazy(
  () => import("./EmployeeReports/EmployeeMonthReport")
);
const EmployeeReportHeader = lazy(
  () => import("./EmployeeReports/EmployeeReportHeader")
);
const EmployeeSaleReport = lazy(
  () => import("./EmployeeReports/EmployeeSaleReport")
);
const EmployeeComparisonReport = lazy(
  () => import("./EmployeeReports/EmployeeComparisonReport")
);

function EmployeeReports({ navigate }) {
  return (
    <>
      {/* content From Here */}
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <EmployeeReportHeader navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/month-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <EmployeeMonthReport navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/sales-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <EmployeeSaleReport navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/comparison-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <EmployeeComparisonReport navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default EmployeeReports;
