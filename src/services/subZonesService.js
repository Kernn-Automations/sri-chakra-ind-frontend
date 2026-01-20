import { fetchWithDivision } from '../utils/fetchWithDivision';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create Sub Zone
const createSubZone = async (zoneId, subZoneData) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithDivision(
      `/zones/${zoneId}/sub-zones`,
      token,
      null, // divisionId - will be handled by backend from token
      false, // showAll
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subZoneData),
      }
    );

    return response;
  } catch (error) {
    console.error('Error creating sub zone:', error);
    throw error;
  }
};

// Get Sub Zones by Zone
const getSubZonesByZone = async (zoneId, isActive = true) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithDivision(
      `/zones/${zoneId}/sub-zones?isActive=${isActive}`,
      token,
      null, // divisionId - will be handled by backend from token
      false // showAll
    );

    return response;
  } catch (error) {
    console.error('Error fetching sub zones:', error);
    throw error;
  }
};

// Get Sub Zone by ID
const getSubZoneById = async (subZoneId) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithDivision(
      `/sub-zones/${subZoneId}`,
      token,
      null, // divisionId - will be handled by backend from token
      false // showAll
    );

    return response;
  } catch (error) {
    console.error('Error fetching sub zone:', error);
    throw error;
  }
};

// Update Sub Zone
const updateSubZone = async (subZoneId, subZoneData) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithDivision(
      `/sub-zones/${subZoneId}`,
      token,
      null, // divisionId - will be handled by backend from token
      false, // showAll
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subZoneData),
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating sub zone:', error);
    throw error;
  }
};

// Delete Sub Zone
const deleteSubZone = async (subZoneId) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithDivision(
      `/sub-zones/${subZoneId}`,
      token,
      null, // divisionId - will be handled by backend from token
      false, // showAll
      {
        method: 'DELETE',
      }
    );

    return response;
  } catch (error) {
    console.error('Error deleting sub zone:', error);
    throw error;
  }
};

export default {
  createSubZone,
  getSubZonesByZone,
  getSubZoneById,
  updateSubZone,
  deleteSubZone
};
