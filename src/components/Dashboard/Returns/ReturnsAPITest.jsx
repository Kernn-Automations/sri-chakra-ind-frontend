import React, { useState } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import { fetchWithDivision } from '../../../utils/fetchWithDivision';
import styles from './Returns.module.css';

const ReturnsAPITest = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAPIEndpoint = async (endpoint, method = 'GET', body = null) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetchWithDivision(
        endpoint,
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        options
      );
      
      return {
        success: response.success,
        status: response.status || 'N/A',
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        status: 'ERROR',
        data: null,
        message: error.message
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const results = {};

    // Test Return Reasons API
    console.log('Testing Return Reasons API...');
    results.returnReasons = await testAPIEndpoint('/returns/reasons');
    results.returnReasonsWithCategory = await testAPIEndpoint('/returns/reasons?category=damage');
    results.returnReasonsWithCase = await testAPIEndpoint('/returns/reasons?returnCase=pre_dispatch');

    // Test Return Requests API
    console.log('Testing Return Requests API...');
    results.returnRequests = await testAPIEndpoint('/returns/requests');
    results.returnRequestsWithStatus = await testAPIEndpoint('/returns/requests?status=pending');
    results.returnRequestsWithCase = await testAPIEndpoint('/returns/requests?returnCase=pre_dispatch');
    results.returnRequestsWithPagination = await testAPIEndpoint('/returns/requests?page=1&limit=10');

    // Test specific return request (if any exist)
    if (results.returnRequests.success && results.returnRequests.data && results.returnRequests.data.length > 0) {
      const firstReturnId = results.returnRequests.data[0].id;
      results.specificReturnRequest = await testAPIEndpoint(`/returns/requests/${firstReturnId}`);
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (success) => {
    return success ? '#27ae60' : '#e74c3c';
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Returns API Integration Test</h2>
        <button 
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={runAllTests}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Run API Tests'}
        </button>
      </div>

      <div className={styles.alert + ' ' + styles.alertInfo}>
        <strong>API Test Results:</strong> This component tests all the Returns API endpoints to ensure proper integration with the backend.
      </div>

      {Object.keys(testResults).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {Object.entries(testResults).map(([testName, result]) => (
              <div 
                key={testName}
                style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: `2px solid ${getStatusColor(result.success)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, textTransform: 'capitalize' }}>
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <span style={{ fontSize: '20px' }}>
                    {getStatusIcon(result.success)}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div>
                    <strong>Status:</strong> 
                    <span style={{ color: getStatusColor(result.success), marginLeft: '5px' }}>
                      {result.status}
                    </span>
                  </div>
                  <div>
                    <strong>Success:</strong> 
                    <span style={{ color: getStatusColor(result.success), marginLeft: '5px' }}>
                      {result.success ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                {result.message && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Message:</strong> 
                    <span style={{ marginLeft: '5px', color: result.success ? '#27ae60' : '#e74c3c' }}>
                      {result.message}
                    </span>
                  </div>
                )}
                
                {result.data && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Data Count:</strong> 
                    <span style={{ marginLeft: '5px' }}>
                      {Array.isArray(result.data) ? result.data.length : 'Object'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
        <h3>API Endpoints Tested:</h3>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li><strong>GET /returns/reasons</strong> - Fetch all return reasons</li>
          <li><strong>GET /returns/reasons?category=damage</strong> - Fetch reasons by category</li>
          <li><strong>GET /returns/reasons?returnCase=pre_dispatch</strong> - Fetch reasons by return case</li>
          <li><strong>GET /returns/requests</strong> - Fetch all return requests</li>
          <li><strong>GET /returns/requests?status=pending</strong> - Fetch requests by status</li>
          <li><strong>GET /returns/requests?returnCase=pre_dispatch</strong> - Fetch requests by return case</li>
          <li><strong>GET /returns/requests?page=1&limit=10</strong> - Fetch requests with pagination</li>
          <li><strong>GET /returns/requests/{id}</strong> - Fetch specific return request</li>
        </ul>
        
        <h4 style={{ marginTop: '20px' }}>Additional Endpoints Available:</h4>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li><strong>POST /returns/requests</strong> - Create new return request</li>
          <li><strong>PUT /returns/requests/{id}</strong> - Update return request</li>
          <li><strong>PUT /returns/requests/{id}/approve</strong> - Approve return request</li>
          <li><strong>POST /returns/requests/{id}/refunds</strong> - Create refund</li>
          <li><strong>POST /returns/items/{id}/images</strong> - Upload images</li>
          <li><strong>GET /returns/items/{id}/images</strong> - Get item images</li>
          <li><strong>DELETE /returns/images/{id}</strong> - Delete image</li>
        </ul>
      </div>
    </div>
  );
};

export default ReturnsAPITest;
