import React, { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const InvoicePage = lazy(() => import("./InvoicePage"));
const InvoiceDetails = lazy(() => import("./InvoiceDetails"));
const BillingSetup = lazy(() => import("./BillingSetup"));
const CreateBillingInvoice = lazy(() => import("./CreateBillingInvoice"));

function InvoiceRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <InvoicePage navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/details/:invoiceId"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <InvoiceDetails navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/setup"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <BillingSetup navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateBillingInvoice navigate={navigate} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default InvoiceRoutes;
