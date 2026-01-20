import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import CustomerReports from "./CustomerReports/CustomerReports";
import CustomerWiseReports from "./CustomerReports/CustomerWiseReports";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";
import CustomerReportsHome from "./CustomerReports/CustomerReportsHome";


function CustomerReportRoute({navigate}) {
  return (
    <>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
             <CustomerReportsHome navigate={navigate}/>
            </Suspense>
          }
        />
        <Route
          path="/customer-overall-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <CustomerReports navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/customer-wise-reports/*"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <CustomerWiseReports navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default CustomerReportRoute;
