/**
 * Target Reports Service - Handles all target reports-related API calls
 */
class TargetReportsService {
  constructor() {
    this.baseURL = '/reports/targets';
  }

  /**
   * Get target reports with filtering options
   */
  async getTargetReports(axiosAPI, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params if they exist
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.roleId) params.append('roleId', filters.roleId);

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
      
      const response = await axiosAPI.get(endpoint);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || response.data.targets || []
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch target reports'
        };
      }
    } catch (error) {
      console.error('Target Reports API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch target reports'
      };
    }
  }

  /**
   * Get role options for target reports dropdown
   */
  async getRoleOptions(axiosAPI) {
    try {
      const response = await axiosAPI.get(`${this.baseURL}/options/roles`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || response.data.roles || []
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch role options'
        };
      }
    } catch (error) {
      console.error('Target Reports Role Options API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch role options'
      };
    }
  }

  /**
   * Export target reports to PDF
   */
  async exportToPDF(axiosAPI, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params if they exist
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.roleId) params.append('roleId', filters.roleId);

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseURL}/export/pdf?${queryString}` : `${this.baseURL}/export/pdf`;
      
      const response = await axiosAPI.get(endpoint, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        blob: response.data,
        filename: `target-reports-${new Date().toISOString().split('T')[0]}.pdf`
      };
    } catch (error) {
      console.error('Target Reports PDF Export Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to export PDF'
      };
    }
  }

  /**
   * Export target reports to Excel
   */
  async exportToExcel(axiosAPI, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params if they exist
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.roleId) params.append('roleId', filters.roleId);

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseURL}/export/excel?${queryString}` : `${this.baseURL}/export/excel`;
      
      const response = await axiosAPI.get(endpoint, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        blob: response.data,
        filename: `target-reports-${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('Target Reports Excel Export Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to export Excel'
      };
    }
  }

  /**
   * Helper function to download blob as file
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/\//g, ' ');
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Get status badge class for styling
   */
  getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'achieved':
        return 'badge bg-success';
      case 'in-progress':
      case 'active':
        return 'badge bg-primary';
      case 'pending':
        return 'badge bg-warning';
      case 'cancelled':
      case 'failed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  /**
   * Calculate progress percentage
   */
  calculateProgress(achieved, target) {
    if (!target || target <= 0) return 0;
    const progress = (achieved / target) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
  }
}

export default new TargetReportsService();