import React, { useState } from 'react';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';

const CORSTest = () => {
  const { selectedDivision, showAllDivisions } = useDivision();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint, testName) => {
    setLoading(true);
    try {
      console.log(`Testing ${testName}...`);
      const divisionId = selectedDivision?.id || null;
      
      let response;
      switch (endpoint) {
        case 'reasons':
          response = await returnsService.getReturnReasons(divisionId, showAllDivisions);
          break;
        case 'sales-orders':
          response = await returnsService.getEligibleSalesOrders({ returnCase: 'post_delivery' }, divisionId, showAllDivisions);
          break;
        default:
          throw new Error('Unknown endpoint');
      }

      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: response,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      console.error(`Error testing ${testName}:`, error);
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    await testAPI('reasons', 'Return Reasons');
    await testAPI('sales-orders', 'Eligible Sales Orders');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>CORS Test - API Connectivity</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Current Context:</h3>
        <p><strong>Selected Division:</strong> {selectedDivision?.name || 'None'} (ID: {selectedDivision?.id || 'None'})</p>
        <p><strong>Show All Divisions:</strong> {showAllDivisions ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Testing...' : 'Run All Tests'}
        </button>
        
        <button 
          onClick={() => testAPI('reasons', 'Return Reasons')} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          Test Return Reasons
        </button>
        
        <button 
          onClick={() => testAPI('sales-orders', 'Eligible Sales Orders')} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Sales Orders
        </button>
      </div>

      <div>
        <h3>Test Results:</h3>
        {Object.keys(testResults).length === 0 ? (
          <p style={{ color: '#6c757d' }}>No tests run yet. Click a button above to test API connectivity.</p>
        ) : (
          Object.entries(testResults).map(([testName, result]) => (
            <div 
              key={testName}
              style={{
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '5px'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: result.success ? '#155724' : '#721c24' }}>
                {testName} - {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6c757d' }}>
                Tested at: {result.timestamp}
              </p>
              {result.success ? (
                <div>
                  <p style={{ margin: '0 0 5px 0' }}>
                    <strong>Response Type:</strong> {result.data?.success ? 'API Success' : 'Fallback Data'}
                  </p>
                  {result.data?.message && (
                    <p style={{ margin: '0 0 5px 0', fontStyle: 'italic' }}>
                      <strong>Message:</strong> {result.data.message}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ margin: '0', color: '#721c24' }}>
                  <strong>Error:</strong> {result.error}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <h4>What This Test Does:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Tests API connectivity without custom headers to avoid CORS issues</li>
          <li>Uses only standard headers (Authorization, Content-Type)</li>
          <li>Relies on query parameters for division context</li>
          <li>Shows whether the backend is responding or if fallback data is being used</li>
        </ul>
      </div>
    </div>
  );
};

export default CORSTest;
