import React, { useState, useEffect } from 'react';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';

const SalesOrderDebug = () => {
  const { selectedDivision, showAllDivisions } = useDivision();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const testSalesOrders = async () => {
    setLoading(true);
    try {
      console.log('Testing sales orders API...');
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.getEligibleSalesOrders(
        { returnCase: 'post_delivery' }, 
        divisionId, 
        showAllDivisions
      );
      
      setDebugInfo({
        success: response.success,
        data: response.data,
        message: response.message,
        salesOrdersCount: response.data?.salesOrders?.length || 0,
        timestamp: new Date().toLocaleTimeString()
      });
      
      console.log('Sales orders test result:', response);
    } catch (error) {
      console.error('Sales orders test error:', error);
      setDebugInfo({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSalesOrders();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>Sales Orders API Debug</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSalesOrders} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Sales Orders API'}
        </button>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h4>Current Context:</h4>
        <p><strong>Selected Division:</strong> {selectedDivision?.name || 'None'} (ID: {selectedDivision?.id || 'None'})</p>
        <p><strong>Show All Divisions:</strong> {showAllDivisions ? 'Yes' : 'No'}</p>
      </div>

      {Object.keys(debugInfo).length > 0 && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: debugInfo.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${debugInfo.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          <h4>Test Result - {debugInfo.success ? '✅ SUCCESS' : '❌ FAILED'}</h4>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          
          {debugInfo.success ? (
            <div>
              <p><strong>Sales Orders Count:</strong> {debugInfo.salesOrdersCount}</p>
              <p><strong>Message:</strong> {debugInfo.message || 'No message'}</p>
              {debugInfo.salesOrdersCount > 0 && (
                <div>
                  <p><strong>Sample Order:</strong></p>
                  <pre style={{ fontSize: '12px', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '3px' }}>
                    {JSON.stringify(debugInfo.data?.salesOrders?.[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p><strong>Error:</strong> {debugInfo.error}</p>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <h4>Expected Behavior:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>If backend is working: Real sales orders data</li>
          <li>If backend has division issues: Fallback sample data (SO-2024-001)</li>
          <li>If backend is completely down: Error message</li>
        </ul>
      </div>
    </div>
  );
};

export default SalesOrderDebug;
