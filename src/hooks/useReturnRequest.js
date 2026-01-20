import { useState, useEffect } from 'react';
import { useDivision } from '../components/context/DivisionContext';
import returnsService from '../services/returnsService';

export const useReturnRequest = () => {
  const { selectedDivision, showAllDivisions } = useDivision();
  const [salesOrders, setSalesOrders] = useState([]);
  const [returnReasons, setReturnReasons] = useState([]);
  const [damagedReasons, setDamagedReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load eligible sales orders
  const loadSalesOrders = async (returnCase, page = 1, limit = 100, search = '') => {
    console.log('🎯 useReturnRequest.loadSalesOrders called with:', {
      returnCase,
      page,
      limit,
      search,
      selectedDivision: selectedDivision?.id,
      showAllDivisions
    });
    
    setLoading(true);
    setError(null);
    try {
      const params = {
        returnCase,
        page,
        limit
      };
      
      if (search) {
        params.search = search;
      }
      
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getEligibleSalesOrders(params, divisionId, showAllDivisions);
      
      console.log('useReturnRequest - Response received:', {
        success: response.success,
        message: response.message,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        salesOrdersCount: response.data?.salesOrders?.length || 0
      });
      
      if (response.success) {
        setSalesOrders(response.data.salesOrders || []);
        setError(null); // Clear any previous errors
      } else {
        setError(response.message || 'Failed to load sales orders');
      }
    } catch (err) {
      console.error('Error in loadSalesOrders:', err);
      setError('Failed to load sales orders');
      setSalesOrders([]); // Clear sales orders on error
    } finally {
      setLoading(false);
    }
  };

  // Load return reasons
  const loadReturnReasons = async () => {
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getReturnReasons({}, divisionId, showAllDivisions);
      if (response.success) {
        const reasons = response.data?.returnReasons || response.data || [];
        setReturnReasons(Array.isArray(reasons) ? reasons : []);
      }
    } catch (err) {
      console.error('Failed to load return reasons:', err);
    }
  };

  // Load damaged goods reasons
  const loadDamagedReasons = async () => {
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getDamagedGoodsReasons(divisionId, showAllDivisions);
      if (response.success) {
        const reasons = response.data?.returnReasons || response.data || [];
        setDamagedReasons(Array.isArray(reasons) ? reasons : []);
      }
    } catch (err) {
      console.error('Failed to load damaged reasons:', err);
    }
  };

  // Get sales order details
  const getSalesOrderDetails = async (salesOrderId) => {
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getSalesOrderDetails(salesOrderId, divisionId, showAllDivisions);
      if (response.success) {
        return response.data;
      } else {
        console.error('Sales order details response not successful:', response);
        throw new Error(response.message || 'Failed to fetch sales order details');
      }
    } catch (err) {
      console.error('Error fetching sales order details:', err);
      throw err;
    }
  };

  // Create return request
  const createReturnRequest = async (returnData) => {
    setLoading(true);
    setError(null);
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.createReturnRequest(returnData, divisionId, showAllDivisions);
      if (response.success) {
        return response.data;
      } else {
        setError(response.message);
        throw new Error(response.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload return images
  const uploadReturnImages = async (returnRequestId, images) => {
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.uploadReturnImages(returnRequestId, images, divisionId, showAllDivisions);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  };

  return {
    salesOrders,
    returnReasons,
    damagedReasons,
    loading,
    error,
    loadSalesOrders,
    loadReturnReasons,
    loadDamagedReasons,
    getSalesOrderDetails,
    createReturnRequest,
    uploadReturnImages
  };
};
