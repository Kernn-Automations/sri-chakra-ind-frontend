// src/utils/apiService.js
// Division-aware API service functions

import { fetchWithDivision } from './fetchWithDivision';

/**
 * Get the current division ID from localStorage
 * @returns {number|null} The current division ID or null if not set
 */
export const getCurrentDivisionId = () => {
  try {
    const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
    return selectedDivision?.id || null;
  } catch (error) {
    console.error("Error getting current division ID:", error);
    return null;
  }
};

/**
 * Fetch customers with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Customers data
 */
export const fetchCustomers = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/customers", token, divisionId, showAll);
};

/**
 * Fetch employees with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Employees data
 */
export const fetchEmployees = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/employees", token, divisionId, showAll);
};

/**
 * Fetch warehouses with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Warehouses data
 */
export const fetchWarehouses = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/warehouses", token, divisionId, showAll);
};

/**
 * Fetch sales orders with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Sales orders data
 */
export const fetchSalesOrders = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/sales-orders", token, divisionId, showAll);
};

/**
 * Fetch purchase orders with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Purchase orders data
 */
export const fetchPurchaseOrders = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/purchase-orders", token, divisionId, showAll);
};

/**
 * Fetch products with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Products data
 */
export const fetchProducts = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/products", token, divisionId, showAll);
};

/**
 * Fetch inventory with division filter
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} Inventory data
 */
export const fetchInventory = async (token, divisionId, showAll = false) => {
  return await fetchWithDivision("/inventory", token, divisionId, showAll);
};

/**
 * Generic function to fetch any endpoint with division filter
 * @param {string} endpoint - API endpoint
 * @param {string} token - JWT token
 * @param {number} divisionId - Division ID to filter by
 * @param {boolean} showAll - Whether to show all divisions
 * @returns {Promise<Object>} API response data
 */
export const fetchWithDivisionFilter = async (endpoint, token, divisionId, showAll = false) => {
  return await fetchWithDivision(endpoint, token, divisionId, showAll);
};

/**
 * Hook-like function to get current division context
 * @returns {Object} Current division context
 */
export const getDivisionContext = () => {
  try {
    const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
    const user = JSON.parse(localStorage.getItem("user"));
    
    return {
      selectedDivision,
      divisionId: selectedDivision?.id || null,
      divisionName: selectedDivision?.name || null,
      user,
      showAllDivisions: user?.user?.showDivisions || false
    };
  } catch (error) {
    console.error("Error getting division context:", error);
    return {
      selectedDivision: null,
      divisionId: null,
      divisionName: null,
      user: null,
      showAllDivisions: false
    };
  }
}; 