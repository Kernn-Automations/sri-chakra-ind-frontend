import React, { lazy, Suspense } from "react";
import styles from "./Payments.module.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";


// Lazy-loaded components
const CreditNote = lazy(() => import("./CreditNote"));
const GenerateMonthly = lazy(() => import("./GenerateMonthly"));
const CreateCreditNote = lazy(() => import("./CreateCreditNote"))

function PaymentRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <p className="path">
              <span onClick={() => navigate("/payments")}>Payments</span>{" "}
              <i className="bi bi-chevron-right"></i> Credit-Notes
            </p>
            <div className="row m-0 p-3">
              <div className="col">
                <button
                  className="homebtn"
                  onClick={() => navigate("/payments/credit-notes/create")}
                >
                  Create Credit-Note
                </button>
                <button
                  className="homebtn"
                  onClick={() => navigate("/payments/credit-notes/list")}
                >
                  Credit-Notes
                </button>
                <button
                  className="homebtn"
                  onClick={() =>
                    navigate("/payments/credit-notes/generate-monthly")
                  }
                >
                    Generate Monthly
                </button>
              </div>
            </div>
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateCreditNote navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/list"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreditNote navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/generate-monthly"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <GenerateMonthly navigate={navigate} />
          </Suspense>
        }
      />
    
    </Routes>
  );
}

export default PaymentRoutes;
