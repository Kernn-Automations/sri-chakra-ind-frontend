import React, { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import styles from "./Sales.module.css";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import { useAuth } from "@/Auth";
import TrackingPage from "./TrackingPage";
import OrderTransferPage from "./OrderTransferPage";
import {
  isAdmin as checkAdmin,
  isDivisionHead,
} from "../../../utils/roleUtils";

// Lazy-loaded components
const SalesHome = lazy(() => import("./SalesHome"));
const Orders = lazy(() => import("./Orders"));
const Dispaches = lazy(() => import("./Dispaches"));
const Deliveries = lazy(() => import("./Deliveries"));
const QuotationList = lazy(() => import("./QuotationsList"));
const ViewQuotation = lazy(() => import("./ViewQuotation"));
const CreateQuotation = lazy(() => import("./CreateQuotation"));
const CancelledOrders = lazy(() => import("./CancelledOrders"));
const NewSalesOrder = lazy(() => import("./NewSalesOrder"));
const PartialDispatchRequests = lazy(() => import("./PartialDispatchRequests"));
const CreatePartialDispatchRequest = lazy(
  () => import("./CreatePartialDispatchRequest"),
);
const PartialDispatchRequestDetail = lazy(
  () => import("./PartialDispatchRequestDetail"),
);

function SalesRoutes() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState();
  const [warehouses, setWarehouses] = useState();
  const [orderId, setOrderId] = useState(null);
  const [managers, setManagers] = useState();

  const { axiosAPI } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const roles = user?.roles;
  const isAdmin = checkAdmin(user) || isDivisionHead(user);

  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);

  useEffect(() => {
    async function fetch() {
      try {
        const res1 = await axiosAPI.get("/warehouses");
        const res2 = await axiosAPI.get("/customers");

        // console.log(res1);
        // console.log(res2);

        setWarehouses(res1.data.warehouses);
        setCustomers(res2.data.customers);
        // setManagers(res.data.employees);
      } catch (e) {
        // console.log(e);
      }
    }
    fetch();
  }, []);

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SalesHome
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
            />
          </Suspense>
        }
      />
      <Route
        path="/orders"
        element={
          <Suspense fallback={<PageSkeleton />}>
            {/* <SalesHome
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
            /> */}
            <Orders
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
              setOrderId={setOrderId}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              isAdmin={isAdmin}
            />
          </Suspense>
        }
      />
      <Route
        path="/orders/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <NewSalesOrder
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
            />
          </Suspense>
        }
      />
      <Route
        path="/tracking"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TrackingPage
              navigate={navigate}
              setOrderId={setOrderId}
              orderId={orderId}
              isAdmin={isAdmin}
            />
          </Suspense>
        }
      />
      <Route path="/quotations" element={<QuotationList />} />
      <Route path="/quotations/new" element={<CreateQuotation />} />
      <Route path="/quotations/:id" element={<ViewQuotation />} />

      <Route
        path="/order-transfer"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <OrderTransferPage navigate={navigate} managers={managers} />
          </Suspense>
        }
      />
      <Route
        path="/cancelled-order"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CancelledOrders
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
            />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PartialDispatchRequests />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreatePartialDispatchRequest />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PartialDispatchRequestDetail />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default SalesRoutes;
