import React, { useState } from 'react';
import { useReturnRequest } from '../../../hooks/useReturnRequest';
import styles from './Returns.module.css';

const ReturnRequestTest = () => {
  const {
    salesOrders,
    returnReasons,
    loading,
    error,
    loadSalesOrders,
    loadReturnReasons,
    getSalesOrderDetails
  } = useReturnRequest();

  const [testResults, setTestResults] = useState({});
  const [selectedReturnCase, setSelectedReturnCase] = useState('post_delivery');

  const runTests = async () => {
    const results = {};
    
    try {
      // Test 1: Load return reasons
      console.log('Testing return reasons...');
      await loadReturnReasons();
      results.returnReasons = {
        success: true,
        count: returnReasons.length,
        data: returnReasons.slice(0, 3) // Show first 3
      };
    } catch (err) {
      results.returnReasons = { success: false, error: err.message };
    }

    try {
      // Test 2: Load eligible sales orders
      console.log('Testing eligible sales orders...');
      await loadSalesOrders(selectedReturnCase, 1, 10);
      results.salesOrders = {
        success: true,
        count: salesOrders.length,
        data: salesOrders.slice(0, 3) // Show first 3
      };
    } catch (err) {
      results.salesOrders = { success: false, error: err.message };
    }

    try {
      // Test 3: Get sales order details (if we have orders)
      if (salesOrders.length > 0) {
        console.log('Testing sales order details...');
        const orderDetails = await getSalesOrderDetails(salesOrders[0].id);
        results.salesOrderDetails = {
          success: true,
          orderId: salesOrders[0].id,
          data: orderDetails
        };
      } else {
        results.salesOrderDetails = {
          success: false,
          error: 'No sales orders available to test'
        };
      }
    } catch (err) {
      results.salesOrderDetails = { success: false, error: err.message };
    }

    setTestResults(results);
  };

  return (
    <div className={styles.returnsContainer}>
      <h2>Return Request API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Return Case: </label>
        <select 
          value={selectedReturnCase} 
          onChange={(e) => setSelectedReturnCase(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="pre_dispatch">Pre-Dispatch</option>
          <option value="post_delivery">Post-Delivery</option>
        </select>
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{ marginLeft: '20px', padding: '10px 20px' }}
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Return Reasons Test */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Return Reasons Test</h3>
          {testResults.returnReasons ? (
            <div>
              <p><strong>Status:</strong> {testResults.returnReasons.success ? '✅ Success' : '❌ Failed'}</p>
              {testResults.returnReasons.success ? (
                <div>
                  <p><strong>Count:</strong> {testResults.returnReasons.count}</p>
                  <p><strong>Sample Data:</strong></p>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
                    {JSON.stringify(testResults.returnReasons.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <p style={{ color: 'red' }}>Error: {testResults.returnReasons.error}</p>
              )}
            </div>
          ) : (
            <p>Click "Run Tests" to test return reasons API</p>
          )}
        </div>

        {/* Sales Orders Test */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Eligible Sales Orders Test</h3>
          {testResults.salesOrders ? (
            <div>
              <p><strong>Status:</strong> {testResults.salesOrders.success ? '✅ Success' : '❌ Failed'}</p>
              {testResults.salesOrders.success ? (
                <div>
                  <p><strong>Count:</strong> {testResults.salesOrders.count}</p>
                  <p><strong>Sample Data:</strong></p>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
                    {JSON.stringify(testResults.salesOrders.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <p style={{ color: 'red' }}>Error: {testResults.salesOrders.error}</p>
              )}
            </div>
          ) : (
            <p>Click "Run Tests" to test sales orders API</p>
          )}
        </div>

        {/* Sales Order Details Test */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Sales Order Details Test</h3>
          {testResults.salesOrderDetails ? (
            <div>
              <p><strong>Status:</strong> {testResults.salesOrderDetails.success ? '✅ Success' : '❌ Failed'}</p>
              {testResults.salesOrderDetails.success ? (
                <div>
                  <p><strong>Order ID:</strong> {testResults.salesOrderDetails.orderId}</p>
                  <p><strong>Sample Data:</strong></p>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', maxHeight: '300px', overflow: 'auto' }}>
                    {JSON.stringify(testResults.salesOrderDetails.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <p style={{ color: 'red' }}>Error: {testResults.salesOrderDetails.error}</p>
              )}
            </div>
          ) : (
            <p>Click "Run Tests" to test sales order details API</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestTest;
