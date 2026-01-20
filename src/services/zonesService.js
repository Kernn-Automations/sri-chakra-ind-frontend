import { fetchWithDivision } from '../utils/fetchWithDivision';

class ZonesService {
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createZone(zoneData, divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      '/zones/create',
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(zoneData)
      }
    );
  }

  async getZones(params = {}, divisionId = null, showAllDivisions = false) {
    const query = new URLSearchParams();
    if (params.divisionId) query.append('divisionId', params.divisionId);
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    if (params.search) query.append('search', params.search);
    const url = `/zones${query.toString() ? `?${query.toString()}` : ''}`;
    return await fetchWithDivision(
      url,
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions
    );
  }

  async getZoneById(zoneId, divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      `/zones/${zoneId}`,
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions
    );
  }

  async updateZone(zoneId, updateData, divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      `/zones/${zoneId}`,
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      }
    );
  }

  async deleteZone(zoneId, divisionId = null, showAllDivisions = false) {
    return await fetchWithDivision(
      `/zones/${zoneId}`,
      localStorage.getItem('accessToken'),
      divisionId,
      showAllDivisions,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }
    );
  }
}

const zonesService = new ZonesService();
export default zonesService;


