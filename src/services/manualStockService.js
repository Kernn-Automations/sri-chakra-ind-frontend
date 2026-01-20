/**
 * Manual Stock Management Service - Handles manual stock movement operations
 */
class ManualStockService {
  constructor() {
    this.baseURL = '/warehouses';
  }

  /**
   * Create manual stock movement
   * @param {Object} axiosAPI - Axios instance
   * @param {Object} movementData - Stock movement data
   * @param {number} movementData.warehouseId - Warehouse ID
   * @param {number} movementData.productId - Product ID
   * @param {string} movementData.movementType - Movement type ("inward" or "outward")
   * @param {number} movementData.quantity - Quantity to move
   * @param {string} movementData.reason - Reason for movement
   * @returns {Promise} API response
   */
  async createStockMovement(axiosAPI, movementData) {
    try {
      const response = await axiosAPI.post(`${this.baseURL}/manual-stock-movement`, movementData);
      
      if (response.data?.success) {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to create stock movement'
      };
    } catch (error) {
      console.error('Manual Stock Movement API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create stock movement'
      };
    }
  }

  /**
   * Get warehouse inventory
   * @param {Object} axiosAPI - Axios instance
   * @param {number} warehouseId - Warehouse ID
   * @returns {Promise} API response
   */
  async getWarehouseInventory(axiosAPI, warehouseId) {
    try {
      const response = await axiosAPI.get(`${this.baseURL}/inventory?warehouseId=${warehouseId}`);
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch warehouse inventory'
      };
    } catch (error) {
      console.error('Warehouse Inventory API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch warehouse inventory'
      };
    }
  }

  /**
   * Get all warehouses
   * @param {Object} axiosAPI - Axios instance
   * @returns {Promise} API response
   */
  async getWarehouses(axiosAPI) {
    try {
      const response = await axiosAPI.get(this.baseURL);
      
      if (response.data?.warehouses) {
        return { success: true, data: response.data.warehouses };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch warehouses'
      };
    } catch (error) {
      console.error('Warehouses API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch warehouses'
      };
    }
  }

  /**
   * Get all active products
   * @param {Object} axiosAPI - Axios instance
   * @returns {Promise} API response
   */
  async getActiveProducts(axiosAPI) {
    try {
      const response = await axiosAPI.get('/products?status=Active');
      
      if (response.data?.products) {
        return { success: true, data: response.data.products };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch products'
      };
    } catch (error) {
      console.error('Products API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch products'
      };
    }
  }

  /**
   * Get stock history for a warehouse
   * @param {Object} axiosAPI - Axios instance
   * @param {number} warehouseId - Warehouse ID
   * @param {string} fromDate - Start date (optional)
   * @param {string} toDate - End date (optional)
   * @returns {Promise} API response
   */
  async getStockHistory(axiosAPI, warehouseId, fromDate = null, toDate = null) {
    try {
      let url = `${this.baseURL}/${warehouseId}/stock-history`;
      
      const params = [];
      if (fromDate) params.push(`fromDate=${fromDate}`);
      if (toDate) params.push(`toDate=${toDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await axiosAPI.get(url);
      
      if (response.data?.success) {
        return { success: true, data: response.data.data };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch stock history'
      };
    } catch (error) {
      console.error('Stock History API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch stock history'
      };
    }
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default new ManualStockService();
