import React, { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "@/components/SkeletonLoaders/PageSkeleton";
import TransferList from "./TransferList";

const StockHome = lazy(() => import("./StockHome"));
const StockTransferPage = lazy(() => import("./StockTransferPage"));
const WarehouseDetailsPage = lazy(() => import("./WarehouseDetailsPage"));
// const Deliveries = lazy(() => import("./Deliveries"));

function StockRoutes() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState();

  const [error, setError] = useState();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const user = JSON.parse(localStorage.getItem("user"));

  const roles = JSON.stringify(user.roles);

  const isAdmin = roles.includes("Admin");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await axiosAPI.get("/employees/role/Warehouse Manager");
        const res1 = await axiosAPI.get("/products/list");
        // console.log(res);
        setManagers(res.data.employees);
        setProducts(res1.data.products);
        console.log(res1.data.products);
      } catch (e) {
        // console.log(e);
        setError(e.response?.data?.message);
      }
    }
    fetch();
  }, []);
  return (
    <>
      <Routes>
        <Route index element={<StockHome navigate={navigate} />} />

        <Route
          path="/transfer"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <StockTransferPage navigate={navigate} managers={managers} />
            </Suspense>
          }
        />

        <Route
          path="/list"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <TransferList navigate={navigate} managers={managers} />
            </Suspense>
          }
        />

        <Route
          path="/:id"
          element={
            managers ? (
              <WarehouseDetailsPage managers={managers} />
            ) : (
              <PageSkeleton /> // or any loading fallback
            )
          }
        />
      </Routes>
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default StockRoutes;
