import React, { lazy, Suspense, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";

const InvoicePage = lazy(() => import("./InvoicePage"));
const InvoiceDetails = lazy(() => import("./InvoiceDetails"));

function InvoiceRoutes() {
  const navigate = useNavigate();

  const [invoiceId, setInvoiceId] = useState();

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <InvoicePage navigate={navigate} setInvoiceId={setInvoiceId} />
          </Suspense>
        }
      />
      Future expansion:
      <Route
        path="/details"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <InvoiceDetails navigate={navigate} invoiceId={invoiceId} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default InvoiceRoutes;
