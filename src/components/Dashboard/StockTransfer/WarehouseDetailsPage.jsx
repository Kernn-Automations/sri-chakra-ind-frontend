// File: WarehouseDetailsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/Auth";
import WarehouseHeaderCard from "./Components/WarehouseHeaderCard";
import WarehouseTabSection from "./Components/WarehouseTabSection";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function WarehouseDetailsPage({ managers, navigate }) {
  const { id } = useParams(); // Get warehouseId from URL
  const { axiosAPI } = useAuth();
  const [warehouse, setWarehouse] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  async function fetchWarehouse() {
    setLoading(true)
    try {
      const res = await axiosAPI.get(`/warehouse/details/${id}`);
      console.log(res);
      setWarehouse(res.data); // whole object: { warehouse, manager, ... }
    } catch (error) {
      console.error("Failed to load warehouse", error);
      setError(error.response.data.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWarehouse();
  }, [id]);

  if (loading)
    return (
      <div className="p-3">
        <Loading />
      </div>
    );

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/warehouses")}>Warehouses</span>{" "}
        <i class="bi bi-chevron-right"></i> {id}
      </p>
      <div className="p-4 pt-0">
        {warehouse && (
          <WarehouseHeaderCard
            warehouse={warehouse}
            refreshData={() => fetchWarehouse()}
            managers={managers}
          />
        )}
        {warehouse && <WarehouseTabSection warehouseDetails={warehouse} />}
      </div>
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {/* {loading && <Loading />} */}
    </>
  );
}

export default WarehouseDetailsPage;
