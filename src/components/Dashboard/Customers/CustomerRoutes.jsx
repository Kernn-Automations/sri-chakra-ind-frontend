import React, { lazy, Suspense } from "react";
import styles from "./Customer.module.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";
import CustomerReportsPage from "./CustomerReports";

// Lazy loaded components
const CustomerHome = lazy(() => import("./CustomerHome"));
const CustomerList = lazy(() => import("./CustomerList"));
const KYCApproval = lazy(() => import("./KYCApproval"));
const CreateCustomer = lazy(() => import("./CreateCustomer"));
const CustomerTransfer = lazy(() => import("./CustomerTransfer"));
const JournalVoucher = lazy(() => import("./JournalVoucher"));

import { isAdmin as checkAdmin, isDivisionHead } from "../../../utils/roleUtils";

function CustomerRoutes() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  
  // Allow Admin OR Division Head
  const isAdmin = checkAdmin(user) || isDivisionHead(user);

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerHome navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreateCustomer navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/customer-list"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerList navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/kyc-approvals"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <KYCApproval navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/reports"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerReportsPage navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/transfer"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerTransfer navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
      <Route
        path="/journal-voucher"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <JournalVoucher navigate={navigate} isAdmin={isAdmin} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default CustomerRoutes;
