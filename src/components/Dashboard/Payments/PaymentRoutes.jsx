import React, { lazy, Suspense } from "react";
import styles from "./Payments.module.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import PaymentFallback from "./PaymentFallback";

// Error Boundary Component for Dynamic Import Failures
class DynamicImportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dynamic import error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <PaymentFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Lazy-loaded components with better error handling
const PaymentHome = lazy(() => 
  import("./PaymentHome").catch(err => {
    console.error('Failed to load PaymentHome:', err);
    // Return a fallback component
    return {
      default: (props) => <PaymentFallback error={err} {...props} />
    };
  })
);

const PaymentReports = lazy(() => 
  import("./PaymentReports").catch(err => {
    console.error('Failed to load PaymentReports:', err);
    return {
      default: () => (
        <div className="alert alert-warning">
          <h5>Payment Reports Unavailable</h5>
          <p>Could not load payment reports module.</p>
        </div>
      )
    };
  })
);

const PaymentApprovals = lazy(() => 
  import("./PaymentApprovals").catch(err => {
    console.error('Failed to load PaymentApprovals:', err);
    return {
      default: () => (
        <div className="alert alert-warning">
          <h5>Payment Approvals Unavailable</h5>
          <p>Could not load payment approvals module.</p>
        </div>
      )
    };
  })
);

const CreditNoteRoutes = lazy(() => 
  import("./CreditNoteRoutes").catch(err => {
    console.error('Failed to load CreditNoteRoutes:', err);
    return {
      default: () => (
        <div className="alert alert-warning">
          <h5>Credit Notes Unavailable</h5>
          <p>Could not load credit notes module.</p>
        </div>
      )
    };
  })
);

function PaymentRoutes() {
  const navigate = useNavigate();

  return (
    <DynamicImportErrorBoundary>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PaymentHome navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/payment-reports"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PaymentReports navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/payment-approvals"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PaymentApprovals navigate={navigate} />
            </Suspense>
          }
        />
        <Route
          path="/credit-notes/*"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <CreditNoteRoutes navigate={navigate} />
            </Suspense>
          }
        />
      </Routes>
    </DynamicImportErrorBoundary>
  );
}

export default PaymentRoutes;
