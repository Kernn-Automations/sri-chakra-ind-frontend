import { fetchWithDivision } from '../utils/fetchWithDivision';

class JournalVoucherService {
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getOptions(divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      '/journal-vouchers/options',
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions
    );
  }

  async getCustomerBalance(customerId, divisionId = null, showAllDivisions = false) {
    if (!customerId) {
      return { success: false, message: 'Customer ID is required' };
    }
    return await fetchWithDivision(
      `/journal-vouchers/customer/${customerId}/balance`,
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions
    );
  }

  async createJournalVoucher(payload, divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      '/journal-vouchers',
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      }
    );
  }
}

const journalVoucherService = new JournalVoucherService();
export default journalVoucherService;


