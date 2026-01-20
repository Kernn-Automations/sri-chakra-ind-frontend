/**
 * Customer Ledger Service - Handles all customer ledger-related API calls
 */
class CustomerLedgerService {
  constructor() {
    this.baseURL = '/customers';
  }

  /**
   * Get single customer ledger report with date range
   * @param {Object} axiosAPI - Axios instance
   * @param {number} customerId - Customer ID
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise} API response
   */
  async getCustomerLedger(axiosAPI, customerId, fromDate, toDate) {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await axiosAPI.get(`${this.baseURL}/${customerId}/ledger?${params.toString()}`);

      // Handle the new backend response structure
      const payload = response?.data;
      if (payload?.success && payload?.data) {
        return { success: true, data: payload.data };
      }
      // Fallback for old format
      const ledger = payload?.data || payload?.ledger || payload?.items || payload;
      const ok = Array.isArray(ledger) || typeof ledger === 'object';
      if (ok) {
        return { success: true, data: ledger };
      }
      return {
        success: false,
        message: payload?.message || 'Failed to fetch customer ledger'
      };
    } catch (error) {
      console.error('Customer Ledger API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch customer ledger'
      };
    }
  }

  /**
   * Get single customer ledger report by financial year
   * @param {Object} axiosAPI - Axios instance
   * @param {number} customerId - Customer ID
   * @param {string} financialYear - Financial year (YYYY-YY format, e.g., 2024-25)
   * @returns {Promise} API response
   */
  async getCustomerLedgerByFinancialYear(axiosAPI, customerId, financialYear) {
    try {
      const response = await axiosAPI.get(`${this.baseURL}/${customerId}/ledger/financial-year/${financialYear}`);

      // Handle the new backend response structure
      const payload = response?.data;
      if (payload?.success && payload?.data) {
        return { success: true, data: payload.data };
      }
      // Fallback for old format
      const ledger = payload?.data || payload?.ledger || payload?.items || payload;
      const ok = Array.isArray(ledger) || typeof ledger === 'object';
      if (ok) {
        return { success: true, data: ledger };
      }
      return {
        success: false,
        message: payload?.message || 'Failed to fetch customer ledger'
      };
    } catch (error) {
      console.error('Customer Ledger API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch customer ledger'
      };
    }
  }

  /**
   * Download customer ledger PDF with date range
   * @param {Object} axiosAPI - Axios instance
   * @param {number} customerId - Customer ID
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise} Blob for PDF download
   */
  async downloadCustomerLedgerPDF(axiosAPI, customerId, fromDate, toDate) {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      // Use blob-configured instance if available
      const getBlob = typeof axiosAPI.getpdf === 'function' ? axiosAPI.getpdf : axiosAPI.get;
      const response = await getBlob(`${this.baseURL}/${customerId}/ledger/pdf?${params.toString()}`);
      
      return {
        success: true,
        blob: response.data,
        filename: `customer-ledger-${customerId}-${fromDate}-to-${toDate}.pdf`
      };
    } catch (error) {
      console.error('Customer Ledger PDF Download Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download PDF'
      };
    }
  }

  /**
   * Universal API call that handles all period types
   * @param {Object} axiosAPI - Axios instance
   * @param {number} customerId - Customer ID
   * @param {string} reportType - Report type (custom, monthly, quarterly, yearly, financial-year)
   * @param {Object|string} periodData - Period data (date range object or financial year string)
   * @returns {Promise} API response
   */
  async fetchCustomerLedger(axiosAPI, customerId, reportType, periodData) {
    try {
      switch (reportType) {
        case 'financial-year':
          return await this.getCustomerLedgerByFinancialYear(axiosAPI, customerId, periodData);
        default:
          // For custom, monthly, quarterly, yearly - use date range
          return await this.getCustomerLedger(axiosAPI, customerId, periodData.fromDate, periodData.toDate);
      }
    } catch (error) {
      console.error('Universal Customer Ledger API Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch customer ledger'
      };
    }
  }

  /**
   * Universal PDF download that handles all period types
   * @param {Object} axiosAPI - Axios instance
   * @param {number} customerId - Customer ID
   * @param {string} reportType - Report type
   * @param {Object|string} periodData - Period data
   * @returns {Promise} Blob for PDF download
   */
  async downloadPDF(axiosAPI, customerId, reportType, periodData) {
    try {
      let fromDate, toDate, filename;

      switch (reportType) {
        case 'financial-year':
          // For financial year, convert to date range (April 1 to March 31)
          const fyYear = parseInt(periodData.split('-')[0]);
          fromDate = `${fyYear}-04-01`;
          toDate = `${fyYear + 1}-03-31`;
          filename = `customer-ledger-${customerId}-FY-${periodData}.pdf`;
          break;
        default:
          // For custom, monthly, quarterly, yearly - use date range
          fromDate = periodData.fromDate;
          toDate = periodData.toDate;
          filename = `customer-ledger-${customerId}-${fromDate}-to-${toDate}.pdf`;
      }

      // Use blob-configured instance if available
      const getBlob = typeof axiosAPI.getpdf === 'function' ? axiosAPI.getpdf : axiosAPI.get;
      const response = await getBlob(`${this.baseURL}/${customerId}/ledger/pdf?fromDate=${fromDate}&toDate=${toDate}`);
      
      return {
        success: true,
        blob: response.data,
        filename
      };
    } catch (error) {
      console.error('Universal PDF Download Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download PDF'
      };
    }
  }

  /**
   * Call debug endpoint for troubleshooting
   */
  async debug(axiosAPI) {
    try {
      const res = await axiosAPI.get(`/customers/ledger/debug`);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  /**
   * Get customers list for dropdown
   * @param {Object} axiosAPI - Axios instance
   * @returns {Promise} API response
   */
  async getCustomers(axiosAPI) {
    try {
      // Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      
      let endpoint = "/customers";
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        endpoint += `?showAllDivisions=true`;
      }
      
      const response = await axiosAPI.get(endpoint);
      const customersList = response.data.customers || [];
      
      return {
        success: true,
        data: customersList
      };
    } catch (error) {
      console.error('Get Customers API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch customers'
      };
    }
  }

  /**
   * Helper function to get period data based on report type
   * @param {string} reportType - Report type
   * @param {string} selectedPeriod - Selected period value
   * @param {string} fromDate - Custom from date
   * @param {string} toDate - Custom to date
   * @returns {Object|string} Period data
   */
  getPeriodData(reportType, selectedPeriod, fromDate = '', toDate = '') {
    switch (reportType) {
      case 'monthly':
        const [year, month] = selectedPeriod.split('-');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        return {
          fromDate: startDate.toISOString().split('T')[0],
          toDate: endDate.toISOString().split('T')[0]
        };
       
      case 'quarterly':
        const [qYear, quarter] = selectedPeriod.split('-Q');
        const quarterStartMonth = (parseInt(quarter) - 1) * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        return {
          fromDate: new Date(qYear, quarterStartMonth, 1).toISOString().split('T')[0],
          toDate: new Date(qYear, quarterEndMonth + 1, 0).toISOString().split('T')[0]
        };
       
      case 'yearly':
        return {
          fromDate: `${selectedPeriod}-01-01`,
          toDate: `${selectedPeriod}-12-31`
        };
       
      case 'financial-year':
        return selectedPeriod; // Just return the FY string like "2024-25"
       
      default: // custom
        return { fromDate, toDate };
    }
  }

  /**
   * Format currency for display
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency
   */
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
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
   * Format balance with Dr/Cr indicator
   * @param {number|string} balance - Balance amount
   * @param {string} balanceType - Balance type (Dr/Cr)
   * @returns {string} Formatted balance
   */
  formatBalance(balance, balanceType) {
    if (!balance && balance !== 0) return '';
    return `${this.formatCurrency(balance)} ${balanceType || ''}`.trim();
  }
}

export default new CustomerLedgerService();

