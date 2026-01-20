// File: WarehouseDetailsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/Auth";
import WarehouseHeaderCard from "./Components/WarehouseHeaderCard";
import WarehouseTabSection from "./Components/WarehouseTabSection";

function WarehouseDetailsPage({managers}) {
  const { id } = useParams(); // Get warehouseId from URL
  const {axiosAPI} = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Filter states for activity tab
  const [activityFilters, setActivityFilters] = useState({
    fromDate: '',
    toDate: '',
    entity: ''
  });

  async function fetchWarehouse(filters = {}) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filter parameters if provided
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.entity) params.append('activityLimit', filters.entity);
      
      const queryString = params.toString();
      const url = `/warehouses/details/${id}${queryString ? `?${queryString}` : ''}`;
      
      const res = await axiosAPI.get(url);
      console.log("Warehouse Details Response:", res.data);
      
      // Check if stockSummary is in data field and extract it
      if (res.data.stockSummary && res.data.stockSummary.data) {
        // Backend returns { data: [...] } structure
        res.data.stockSummary = res.data.stockSummary.data;
      }
      
      setWarehouse(res.data); // whole object: { warehouse, manager, ... }
    } catch (error) {
      console.error("Failed to load warehouse", error);
    } finally {
      setLoading(false);
    }
  }

  // Separate function for activity filtering with its own loading state
  async function fetchActivityFilters(filters = {}) {
    try {
      setActivityLoading(true);
      const params = new URLSearchParams();
      
      // Add filter parameters if provided
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.entity) params.append('activityLimit', filters.entity);
      
      const queryString = params.toString();
      const url = `/warehouses/details/${id}${queryString ? `?${queryString}` : ''}`;
      
      const res = await axiosAPI.get(url);
      console.log("Activity Filter Response:", res.data);
      
      // Check if stockSummary is in data field and extract it
      if (res.data.stockSummary && res.data.stockSummary.data) {
        res.data.stockSummary = res.data.stockSummary.data;
      }
      
      // Update only the activities part of the warehouse data
      setWarehouse(prevWarehouse => ({
        ...prevWarehouse,
        activities: res.data.activities
      }));
    } catch (error) {
      console.error("Failed to load activity filters", error);
    } finally {
      setActivityLoading(false);
    }
  }

  useEffect(() => {
    fetchWarehouse();
  }, [id]);

  // Function to handle activity filter changes
  const handleActivityFilterChange = (newFilters) => {
    setActivityFilters(newFilters);
    fetchActivityFilters(newFilters);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <WarehouseHeaderCard warehouse={warehouse} refreshData={()=>fetchWarehouse()} managers={managers} />
      <WarehouseTabSection 
        warehouseDetails={warehouse} 
        activityFilters={activityFilters}
        onActivityFilterChange={handleActivityFilterChange}
        activityLoading={activityLoading}
        onInventoryUpdated={fetchWarehouse}
      />
    </div>
  );
}

export default WarehouseDetailsPage;
