import React, { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import OrderTransferPage from "../Sales/OrderTransferPage";

// Lazy-loaded components
const WarehouseHome = lazy(() => import("./WarehouseHome"));
const OngoingWarehouse = lazy(() => import("./OngoingWarehouse"));
const WarehouseDetailsPage = lazy(() => import("./WarehouseDetailsPage"));
const WarehouseDetails = lazy(() => import("./WarehouseDetails"));

import { isAdmin as checkAdmin, isDivisionHead } from "../../../utils/roleUtils";


function WarehouseRoutes() {
  const navigate = useNavigate();

  const { axiosAPI } = useAuth();

  const [managers, setManagers] = useState();

  const [products, setProducts] = useState([]);

  const [error, setError] = useState();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const user = JSON.parse(localStorage.getItem("user"));

  // Allow Admin OR Division Head
  const isAdmin = checkAdmin(user) || isDivisionHead(user);



  useEffect(() => {
    async function fetch() {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoints
        let employeesEndpoint = "/employees/role/Warehouse Manager";
        let productsEndpoint = "/products/list";
        
        if (currentDivisionId && currentDivisionId !== '1') {
          employeesEndpoint += `?divisionId=${currentDivisionId}`;
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          employeesEndpoint += `?showAllDivisions=true`;
          productsEndpoint += `?showAllDivisions=true`;
        }
        
        console.log('WarehouseRoutes - Fetching data with endpoints:');
        console.log('WarehouseRoutes - Employees:', employeesEndpoint);
        console.log('WarehouseRoutes - Products:', productsEndpoint);
        console.log('WarehouseRoutes - Division ID:', currentDivisionId);
        console.log('WarehouseRoutes - Division Name:', currentDivisionName);
        
        const res = await axiosAPI.get(employeesEndpoint);
        const res1 = await axiosAPI.get(productsEndpoint);
        // console.log(res);
        // console.log(res1);
        setManagers(res.data.employees);
        setProducts(res1.data.products);
        console.log(res1.data.products)
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
      }
    }
    fetch();
  }, []);

  const [warehouseId, setWarehouseId] = useState();
  const onWarehouseChange = (id) => setWarehouseId(id)

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<PageSkeleton />}>
              <WarehouseHome
                navigate={navigate}
                managers={managers}
                products={products}
                isAdmin={isAdmin}
              />
            </Suspense>
          }
        />
        <Route
          path="/ongoing"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <OngoingWarehouse
                navigate={navigate}
                managers={managers}
                isAdmin={isAdmin}
                warehouseId={warehouseId}
                onWarehouseChange={onWarehouseChange}
              />
            </Suspense>
          }
        />
        {/* <Route
          path="/stock-transfer"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <StockTransferPage navigate={navigate} managers={managers} />
            </Suspense>
          }
        /> */}
        {/* <Route
          path="/:id"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <WarehouseDetails navigate={navigate} managers={managers} products={products} />
            </Suspense>
          }
        /> */}
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

export default WarehouseRoutes;
