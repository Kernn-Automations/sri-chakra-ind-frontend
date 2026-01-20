import React, { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import axios from "axios";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";
import styles from "../Sales/Sales.module.css";

function TargetReports({ navigate }) {
  const { axiosAPI } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const [targets, setTargets] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [trigger, setTrigger] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);

  // Filters for API calls
  const [filters, setFilters] = useState({
    targetType: 'sales',
    reportType: 'team',
    status: 'all',
    startDate: null,
    endDate: null,
    timePeriod: null
  });
  
  // Options for dropdowns
  const [options, setOptions] = useState({
    divisions: [],
    zones: [],
    subzones: [],
    teams: [],
    employees: [],
    customers: []
  });

  const closeError = () => setIsErrorOpen(false);
  const refresh = () => setTrigger((t) => !t);

  useEffect(() => {
    loadDropdownOptions();
    fetchActiveTargetsWithAssignments();
  }, [trigger]);

  // Load dropdown options for filtering
  const loadDropdownOptions = async () => {
    try {
      const response = await axiosAPI.get('/target-reports/options');
      console.log('Target Reports options response:', response.data);
      if (response.data.success && response.data.data) {
        setOptions(response.data.data);
      } else if (response.data) {
        setOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      // Fallback to sample data if API fails
      setOptions({
        divisions: [
          { id: 1, name: "Division 1" },
          { id: 2, name: "Division 2" },
          { id: 3, name: "Division 3" }
        ],
        zones: [],
        subzones: [],
        teams: [],
        employees: [],
        customers: []
      });
    }
  };

  // Load zones when division changes
  const loadZones = async (divisionId) => {
    if (!divisionId) return;
    try {
      const response = await axiosAPI.get(`/target-reports/zones?divisionId=${divisionId}`);
      if (response.data.success && response.data.data) {
        setOptions(prev => ({ ...prev, zones: response.data.data, subzones: [], teams: [], employees: [] }));
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  // Load subzones when zone changes
  const loadSubZones = async (zoneId) => {
    if (!zoneId) return;
    try {
      const response = await axiosAPI.get(`/target-reports/subzones?zoneId=${zoneId}`);
      if (response.data.success && response.data.data) {
        setOptions(prev => ({ ...prev, subzones: response.data.data, teams: [], employees: [] }));
      }
    } catch (error) {
      console.error('Error loading subzones:', error);
    }
  };

  // Load teams when subzone changes
  const loadTeams = async (subZoneId) => {
    if (!subZoneId) return;
    try {
      const response = await axiosAPI.get(`/target-reports/teams?subZoneId=${subZoneId}`);
      if (response.data.success && response.data.data) {
        setOptions(prev => ({ ...prev, teams: response.data.data, employees: [] }));
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  // Load employees when team changes
  const loadEmployees = async (teamId) => {
    if (!teamId) return;
    try {
      const response = await axiosAPI.get(`/target-reports/employees?teamId=${teamId}`);
      if (response.data.success && response.data.data) {
        setOptions(prev => ({ ...prev, employees: response.data.data }));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const response = await axiosAPI.get('/target-reports/customers');
      if (response.data.success && response.data.data) {
        setOptions(prev => ({ ...prev, customers: response.data.data }));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const fetchActiveTargetsWithAssignments = async () => {
    try {
      setLoading(true);
      console.log("Fetching target reports with filters:", filters);
      
      // Build query parameters
      const params = {
        ...filters
      };
      
      // Remove null values from params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/target-reports${queryString ? '?' + queryString : ''}`;
      
      console.log("API endpoint:", endpoint);
      
      const response = await axiosAPI.get(endpoint);
      console.log("Target Reports API response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setTargets(response.data.data);
        setTotals(response.data.totals || null);
      } else {
        console.log("No target data found");
        setTargets([]);
        setTotals(null);
      }
    } catch (e) {
      console.error("Error fetching target reports:", e);
      setError(e?.response?.data?.message || "Failed to fetch target reports");
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    // Clear date filters when timePeriod is selected
    if (field === 'timePeriod' && value) {
      setFilters(prev => ({ ...prev, startDate: null, endDate: null }));
    }
    
    // Clear timePeriod when custom dates are selected
    if ((field === 'startDate' || field === 'endDate') && value) {
      setFilters(prev => ({ ...prev, timePeriod: null }));
    }
  };

  // Submit filters
  const onSubmit = () => {
    console.log('onSubmit called - showAll:', showAll, 'filters:', filters);
    fetchActiveTargetsWithAssignments();
    if (showAll) {
      setIsDetailedView(true);
    }
  };

  // Export functions
  const handleExportToPDF = async () => {
    try {
      setLoading(true);
      
      // Build query parameters - use the same filters as the data fetch
      const params = {
        ...filters
      };
      
      // Remove null/empty values from params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/target-reports/export/pdf${queryString ? '?' + queryString : ''}`;
      
      console.log('PDF Export URL:', endpoint);
      console.log('PDF Export Params:', params);
      
      // Use getpdf method which is configured for blob responses
      const response = await axiosAPI.getpdf(endpoint);
      
      console.log('PDF Response Status:', response.status);
      console.log('PDF Response Headers:', response.headers);
      console.log('PDF Response Data Type:', typeof response.data);
      console.log('PDF Response Data Size:', response.data?.size || 'unknown');
      console.log('PDF Response Data:', response.data);
      
      // Check if we got a valid response
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Check if it's a proper blob
      if (!(response.data instanceof Blob)) {
        console.error('Response is not a blob:', response.data);
        throw new Error('Invalid response format - expected blob');
      }
      
      // Check if blob has content
      if (response.data.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `target-reports-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download initiated successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError(`Failed to export PDF: ${error.message}`);
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      // Build query parameters - use the same filters as the data fetch
      const params = {
        ...filters
      };
      
      // Remove null/empty values from params
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/target-reports/export/excel${queryString ? '?' + queryString : ''}`;
      
      console.log('Excel Export URL:', endpoint);
      console.log('Excel Export Params:', params);
      
      // Create a custom axios instance for Excel downloads
      const VITE_API = import.meta.env.VITE_API_URL;
      const BASE_URL = VITE_API || 'http://localhost:8080';
      
      const excelApi = axios.create({
        baseURL: BASE_URL,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*"
        },
        responseType: "blob"
      });
      
      // Add auth token
      const token = localStorage.getItem("accessToken");
      if (token) {
        excelApi.defaults.headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await excelApi.get(endpoint);
      
      console.log('Excel Response Status:', response.status);
      console.log('Excel Response Headers:', response.headers);
      console.log('Excel Response Data Type:', typeof response.data);
      console.log('Excel Response Data Size:', response.data?.size || 'unknown');
      console.log('Excel Response Data:', response.data);
      
      // Check if we got a valid response
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Check if it's a proper blob
      if (!(response.data instanceof Blob)) {
        console.error('Response is not a blob:', response.data);
        throw new Error('Invalid response format - expected blob');
      }
      
      // Check if blob has content
      if (response.data.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `target-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Excel download initiated successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError(`Failed to export Excel: ${error.message}`);
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const renderParticulars = (row) => {
    return row?.particulars || "-";
  };

  const renderBudget = (row) => {
    return row?.budget ? parseFloat(row.budget).toLocaleString() : "-";
  };

  const renderPeriod = (row) => {
    return row?.period || "-";
  };

  const renderAchieved = (row) => {
    return row?.achieved ? parseFloat(row.achieved).toLocaleString() : "0";
  };

  const renderDifference = (row) => {
    return row?.difference || "-";
  };

  const renderCompletedDate = (row) => {
    return row?.completedDate || "-";
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i className="bi bi-chevron-right"></i> Target-Reports
      </p>

      {/* Filter Options */}
      <div className="row m-0 p-3">
        {/* Target Type Filter */}
        <div className="col-md-2 formcontent">
          <label htmlFor="targetType">Target Type:</label>
          <select 
            id="targetType"
            value={filters.targetType} 
            onChange={(e) => handleFilterChange('targetType', e.target.value)}
          >
            <option value="sales">Sales/Revenue</option>
            <option value="customer">Customer Acquisition</option>
          </select>
        </div>

        {/* Report Type Filter */}
        <div className="col-md-2 formcontent">
          <label htmlFor="reportType">Report Type:</label>
          <select 
            id="reportType"
            value={filters.reportType} 
            onChange={(e) => handleFilterChange('reportType', e.target.value)}
          >
            <option value="team">Team Level</option>
            <option value="employee">Individual Employee</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="col-md-2 formcontent">
          <label htmlFor="status">Status:</label>
          <select 
            id="status"
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="col-md-2 formcontent">
          <label htmlFor="timePeriod">Time Period:</label>
          <select 
            id="timePeriod"
            value={filters.timePeriod || ''} 
            onChange={(e) => handleFilterChange('timePeriod', e.target.value || null)}
          >
            <option value="">Custom Range</option>
            <option value="monthly">Current Month</option>
            <option value="quarterly">Current Quarter</option>
            <option value="yearly">Current Year</option>
          </select>
        </div>
      </div>

      {/* Date Filters - Only show when timePeriod is not selected */}
      {!filters.timePeriod && (
        <div className="row m-0 p-3">
          <div className="col-md-3 formcontent">
            <label htmlFor="startDate">From Date:</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
            />
          </div>
          <div className="col-md-3 formcontent">
            <label htmlFor="endDate">To Date:</label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
            />
          </div>
        </div>
      )}


      {/* Submit/Cancel buttons */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-12 d-flex justify-content-center">
          <div className="d-flex gap-3">
            <button className="submitbtn" onClick={onSubmit}>
              Submit
            </button>
            <button className="cancelbtn" onClick={() => {
              setFilters({
                targetType: 'sales',
                reportType: 'team',
                status: 'all',
                startDate: null,
                endDate: null,
                timePeriod: null
              });
              setShowAll(false);
              setTargets([]);
              setTotals(null);
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && <Loading />}

      {/* Export buttons */}
      {targets && targets.length > 0 && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-5">
            <button 
              className={styles.xls} 
              onClick={handleExportToExcel}
              disabled={loading}
            >
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button 
              className={styles.xls} 
              onClick={handleExportToPDF}
              disabled={loading}
            >
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
        </div>
      )}

      {/* Target Reports Table */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-md-12">
          <div className="table-responsive">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th className="text-center">S.No</th>
                  <th className="text-center">Particulars</th>
                  <th className="text-center">Budget</th>
                  <th className="text-center">Period</th>
                  <th className="text-center">
                    {filters.targetType === 'sales' ? 'Sales Achieved' : 'Customers Acquired'}
                  </th>
                  <th className="text-center">Difference</th>
                  <th className="text-center">Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No target data available.
                    </td>
                  </tr>
                )}
                {targets.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div>
                        <div className="fw-medium text-primary">
                          {renderParticulars(row)}
                        </div>
                        {row.targetType && (
                          <span className={`badge ${
                            row.targetType === 'sales' ? 'bg-success' : 
                            row.targetType === 'customer' ? 'bg-info' : 'bg-secondary'
                          } mt-1`}>
                            {row.targetType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center fw-medium">
                      {renderBudget(row)}
                    </td>
                    <td>
                      <div className="fw-medium">
                        {renderPeriod(row)}
                      </div>
                    </td>
                    <td className="text-center fw-medium">
                      {renderAchieved(row)}
                    </td>
                    <td className="text-center">
                      <span className={`fw-medium ${
                        row.differencePercentage && row.differencePercentage.includes('(') 
                          ? 'text-danger' : 'text-success'
                      }`}>
                        {renderDifference(row)}
                      </span>
                      {row.differencePercentage && (
                        <div className="text-muted small">
                          {row.differencePercentage}
                        </div>
                      )}
                    </td>
                    <td>
                      {renderCompletedDate(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Error Modal */}
      {isErrorOpen && (
        <ErrorModal isOpen={isErrorOpen} message={error} onClose={closeError} />
      )}
    </>
  );
}

export default TargetReports;