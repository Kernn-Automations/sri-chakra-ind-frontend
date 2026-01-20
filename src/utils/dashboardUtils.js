// src/utils/dashboardUtils.js

import { useDivision } from '../components/context/DivisionContext';

/**
 * Hook to get division-aware API parameters for dashboard endpoints
 * @returns {Object} Object with divisionId or showAllDivisions parameter
 */
export const useDivisionParams = () => {
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const divisionId = selectedDivision?.id;
  
  if (showAllDivisions) {
    return { showAllDivisions: 'true' };
  } else if (divisionId && divisionId !== 'all') {
    return { divisionId: divisionId };
  }
  
  return {};
};

/**
 * Build dashboard endpoint URL with division parameters
 * @param {string} baseEndpoint - Base dashboard endpoint (e.g., "/dashboard/home")
 * @param {Object} divisionParams - Division parameters from useDivisionParams
 * @returns {string} Complete endpoint URL with query parameters
 */
export const buildDashboardEndpoint = (baseEndpoint, divisionParams) => {
  if (!divisionParams || Object.keys(divisionParams).length === 0) {
    return baseEndpoint;
  }
  
  const params = new URLSearchParams(divisionParams);
  return `${baseEndpoint}?${params.toString()}`;
};

/**
 * Standardized dashboard data fetching with division filtering
 * @param {Function} axiosAPI - Axios instance from useAuth
 * @param {string} endpoint - Dashboard endpoint (e.g., "/dashboard/home")
 * @param {Function} setLoading - Loading state setter
 * @param {Function} setData - Data state setter
 * @param {Function} setError - Error state setter
 * @param {Object} divisionParams - Division parameters from useDivisionParams
 */
export const fetchDashboardData = async (
  axiosAPI,
  endpoint,
  setLoading,
  setData,
  setError,
  divisionParams = {}
) => {
  try {
    setLoading(true);
    setError(null);
    
    // Build endpoint with division parameters
    const fullEndpoint = buildDashboardEndpoint(endpoint, divisionParams);
    
    console.log(`Fetching dashboard data from: ${fullEndpoint}`);
    console.log('Division params:', divisionParams);
    
    const response = await axiosAPI.get(fullEndpoint);
    
    if (response.data) {
      setData(response.data);
      console.log(`${endpoint} dashboard response:`, response.data);
    } else {
      setData(null);
      setError('No data received from dashboard endpoint');
    }
  } catch (error) {
    console.error(`${endpoint} dashboard fetch error:`, error);
    setError(error?.response?.data?.message || `Failed to load ${endpoint} dashboard`);
    setData(null);
  } finally {
    setLoading(false);
  }
};

/**
 * Check if division is available before fetching data
 * @param {string|number} divisionId - Division ID to check
 * @returns {boolean} True if division is available
 */
export const isDivisionAvailable = (divisionId) => {
  return divisionId && divisionId !== 'all';
};

/**
 * Get division display info for logging
 * @returns {Object} Division information for debugging
 */
export const getDivisionInfo = () => {
  try {
    const currentDivisionId = localStorage.getItem('currentDivisionId');
    const currentDivisionName = localStorage.getItem('currentDivisionName');
    const selectedDivision = localStorage.getItem('selectedDivision');
    
    return {
      currentDivisionId,
      currentDivisionName,
      selectedDivision: selectedDivision ? JSON.parse(selectedDivision) : null
    };
  } catch (error) {
    console.error('Error getting division info:', error);
    return {};
  }
};
