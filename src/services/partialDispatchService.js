import { fetchWithDivision } from '../utils/fetchWithDivision';

const BASE_URL = 'http://localhost:8080/api';

class PartialDispatchService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // 1. Create Partial Dispatch Request
  async createRequest(salesOrderId, requestData, divisionId = null, showAllDivisions = false) {
    try {
      const token = localStorage.getItem('accessToken');
      const url = `/sales-orders/${salesOrderId}/partial-dispatch/requests`;
      
      // Build URL with division params
      let fullUrl = import.meta.env.VITE_API_URL + url;
      if (showAllDivisions || divisionId === "all") {
        fullUrl += fullUrl.includes('?') ? '&showAllDivisions=true' : '?showAllDivisions=true';
      } else if (divisionId && divisionId !== "all") {
        fullUrl += fullUrl.includes('?') ? `&divisionId=${divisionId}` : `?divisionId=${divisionId}`;
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create request' }));
        throw new Error(errorData.message || `Error ${response.status}: Failed to create request`);
      }

      const result = await response.json();
      return { success: true, data: result, message: result.message || 'Request created successfully' };
    } catch (error) {
      console.error('Error creating partial dispatch request:', error);
      return {
        success: false,
        message: error.message || 'Failed to create partial dispatch request'
      };
    }
  }

  // 2. List Requests for a Sales Order
  async getRequestsByOrder(salesOrderId, divisionId = null, showAllDivisions = false) {
    try {
      const response = await fetchWithDivision(
        `/sales-orders/${salesOrderId}/partial-dispatch/requests`,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.requests) {
        return { success: true, data: response, message: 'Success' };
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching partial dispatch requests:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch partial dispatch requests'
      };
    }
  }

  // 3. Approve Partial Dispatch Request
  async approveRequest(requestId, approvalData, divisionId = null, showAllDivisions = false) {
    try {
      const token = localStorage.getItem('accessToken');
      const url = `/partial-dispatch/requests/${requestId}/approve`;
      
      // Build URL with division params
      let fullUrl = import.meta.env.VITE_API_URL + url;
      if (showAllDivisions || divisionId === "all") {
        fullUrl += fullUrl.includes('?') ? '&showAllDivisions=true' : '?showAllDivisions=true';
      } else if (divisionId && divisionId !== "all") {
        fullUrl += fullUrl.includes('?') ? `&divisionId=${divisionId}` : `?divisionId=${divisionId}`;
      }

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(approvalData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to approve request' }));
        throw new Error(errorData.message || `Error ${response.status}: Failed to approve request`);
      }

      const result = await response.json();
      return { success: true, data: result, message: result.message || 'Request approved successfully' };
    } catch (error) {
      console.error('Error approving partial dispatch request:', error);
      return {
        success: false,
        message: error.message || 'Failed to approve partial dispatch request'
      };
    }
  }

  // 4. Reject Partial Dispatch Request
  async rejectRequest(requestId, rejectionData, divisionId = null, showAllDivisions = false) {
    try {
      const token = localStorage.getItem('accessToken');
      const url = `/partial-dispatch/requests/${requestId}/reject`;
      
      // Build URL with division params
      let fullUrl = import.meta.env.VITE_API_URL + url;
      if (showAllDivisions || divisionId === "all") {
        fullUrl += fullUrl.includes('?') ? '&showAllDivisions=true' : '?showAllDivisions=true';
      } else if (divisionId && divisionId !== "all") {
        fullUrl += fullUrl.includes('?') ? `&divisionId=${divisionId}` : `?divisionId=${divisionId}`;
      }

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(rejectionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to reject request' }));
        throw new Error(errorData.message || `Error ${response.status}: Failed to reject request`);
      }

      const result = await response.json();
      return { success: true, data: result, message: result.message || 'Request rejected successfully' };
    } catch (error) {
      console.error('Error rejecting partial dispatch request:', error);
      return {
        success: false,
        message: error.message || 'Failed to reject partial dispatch request'
      };
    }
  }

  // 5. Get Partial Dispatch Status by Order ID
  async getPartialDispatchStatus(salesOrderId, divisionId = null, showAllDivisions = false) {
    try {
      const response = await fetchWithDivision(
        `/sales-orders/${salesOrderId}/partial-dispatch-status`,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching partial dispatch status:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch partial dispatch status'
      };
    }
  }

  // 6. Get All Partially Dispatched Orders
  async getAllPartiallyDispatchedOrders(params = {}, divisionId = null, showAllDivisions = false) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `/sales-orders/partial-dispatch${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetchWithDivision(
        url,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching partially dispatched orders:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch partially dispatched orders'
      };
    }
  }

  // 7. Get Sales Order Details (for creating requests)
  async getSalesOrderDetails(salesOrderId, divisionId = null, showAllDivisions = false) {
    try {
      const response = await fetchWithDivision(
        `/sales-orders/order/${salesOrderId}`,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching sales order details:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch sales order details'
      };
    }
  }

  // 8. Get Request by ID (for detail view)
  async getRequestById(requestId, divisionId = null, showAllDivisions = false) {
    try {
      // Assuming we can get request details from the order requests endpoint
      // or if there's a specific endpoint, use that
      const response = await fetchWithDivision(
        `/partial-dispatch/requests/${requestId}`,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch request details'
      };
    }
  }

  // 9. Get All Requests (for main list page)
  async getAllRequests(params = {}, divisionId = null, showAllDivisions = false) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.salesOrderId) queryParams.append('salesOrderId', params.salesOrderId);
      
      const url = `/partial-dispatch/requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetchWithDivision(
        url,
        localStorage.getItem('accessToken'),
        divisionId,
        showAllDivisions
      );

      if (response.success !== undefined) {
        return response;
      } else if (response.data) {
        return { success: true, data: response.data, message: 'Success' };
      } else if (response.requests) {
        return { success: true, data: response, message: 'Success' };
      } else {
        return { success: true, data: response, message: 'Success' };
      }
    } catch (error) {
      console.error('Error fetching all requests:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch requests'
      };
    }
  }
}

export default new PartialDispatchService();


