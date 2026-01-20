import React, { Suspense } from "react";
import StockSummaryReport from "./WarehouseStockReport/StockSummaryReport";
import ProductStockSummary from "./WarehouseStockReport/ProductStockSummary";
import ClosingBalanceReport from "./WarehouseStockReport/ClosingBalanceReport";
import WarehouseWiseReport from "./WarehouseStockReport/WarehouseWiseReport";
import StockReportHome from "./WarehouseStockReport/StockReportHome";
import { Route, Routes } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

function StockReports({ navigate }) {
  return (
    <>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <StockReportHome navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/stock-summary-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <StockSummaryReport navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/product-stock-summary"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ProductStockSummary navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/closing-balance-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ClosingBalanceReport navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/warehouse-wise-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <WarehouseWiseReport navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default StockReports;
