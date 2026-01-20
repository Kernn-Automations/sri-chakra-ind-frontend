import React, { useState } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import manualStockService from '../../../services/manualStockService';
import styles from './Inventory.module.css';

const ManualStockAPITest = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    warehouseId: '',
    productId: '',
    movementType: 'inward',
    quantity: '10',
    reason: 'API Test Movement'
  });

  const testAPIEndpoint = async (testName, testFunction) => {
    try {
      console.log(`Testing ${testName}...`);
      const result = await testFunction();
      console.log(`${testName} result:`, result);
      return {
        success: result.success,
        message: result.message,
        data: result.data
      };
    } catch (error) {
      console.error(`${testName} error:`, error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const results = {};

    // Test 1: Get Warehouses
    results.getWarehouses = await testAPIEndpoint(
      'Get Warehouses',
      () => manualStockService.getWarehouses(axiosAPI)
    );

    // Test 2: Get Active Products
    results.getActiveProducts = await testAPIEndpoint(
      'Get Active Products',
      () => manualStockService.getActiveProducts(axiosAPI)
    );

    // Test 3: Get Warehouse Inventory (if warehouse is selected)
    if (testData.warehouseId) {
      results.getWarehouseInventory = await testAPIEndpoint(
        'Get Warehouse Inventory',
        () => manualStockService.getWarehouseInventory(axiosAPI, testData.warehouseId)
      );
    }

    // Test 4: Get Stock History (if warehouse is selected)
    if (testData.warehouseId) {
      results.getStockHistory = await testAPIEndpoint(
        'Get Stock History',
        () => manualStockService.getStockHistory(axiosAPI, testData.warehouseId)
      );
    }

    // Test 5: Create Stock Movement (if all data is available)
    if (testData.warehouseId && testData.productId && testData.quantity && testData.reason) {
      results.createStockMovement = await testAPIEndpoint(
        'Create Stock Movement',
        () => manualStockService.createStockMovement(axiosAPI, {
          warehouseId: parseInt(testData.warehouseId),
          productId: parseInt(testData.productId),
          movementType: testData.movementType,
          quantity: parseFloat(testData.quantity),
          reason: testData.reason
        })
      );
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

  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container-fluid">
      <div className="row m-0 p-3">
        <div className="col">
          <div className="head">Manual Stock Management API Test</div>
          <p style={{ color: '#555', marginBottom: '20px' }}>Test all manual stock management API endpoints to ensure proper integration.</p>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="row m-0 p-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: '#f8f9fc', borderBottom: '1px solid #e3e6f0' }}>
              <h5 style={{ margin: 0, color: '#5a5c69', fontWeight: '600' }}>Test Configuration</h5>
            </div>
            <div className="card-body">
              <div className="form-group mb-3">
                <label htmlFor="warehouseId">Warehouse ID (for inventory/history tests)</label>
                <input
                  type="number"
                  className="form-control"
                  id="warehouseId"
                  name="warehouseId"
                  value={testData.warehouseId}
                  onChange={handleTestDataChange}
                  placeholder="Enter warehouse ID"
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="productId">Product ID (for movement test)</label>
                <input
                  type="number"
                  className="form-control"
                  id="productId"
                  name="productId"
                  value={testData.productId}
                  onChange={handleTestDataChange}
                  placeholder="Enter product ID"
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="movementType">Movement Type</label>
                <select
                  className="form-control"
                  id="movementType"
                  name="movementType"
                  value={testData.movementType}
                  onChange={handleTestDataChange}
                >
                  <option value="inward">Inward</option>
                  <option value="outward">Outward</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  id="quantity"
                  name="quantity"
                  value={testData.quantity}
                  onChange={handleTestDataChange}
                  step="0.01"
                  min="0.01"
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="reason">Reason</label>
                <input
                  type="text"
                  className="form-control"
                  id="reason"
                  name="reason"
                  value={testData.reason}
                  onChange={handleTestDataChange}
                />
              </div>

              <button
                className="submitbtn"
                onClick={runAllTests}
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Run API Tests'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: '#f8f9fc', borderBottom: '1px solid #e3e6f0' }}>
              <h5 style={{ margin: 0, color: '#5a5c69', fontWeight: '600' }}>Test Results</h5>
            </div>
            <div className="card-body">
              {Object.keys(testResults).length > 0 ? (
                <div>
                  {Object.entries(testResults).map(([testName, result]) => (
                    <div key={testName} className="mb-3 p-3" style={{
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                        <span style={{ color: getStatusColor(result.success) }}>
                          {getStatusIcon(result.success)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
                        </small>
                        <br />
                        <small className="text-muted">
                          <strong>Message:</strong> {result.message}
                        </small>
                        {result.data && (
                          <>
                            <br />
                            <small className="text-muted">
                              <strong>Data:</strong> {JSON.stringify(result.data).substring(0, 100)}...
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Click "Run API Tests" to test the endpoints</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="row m-0 p-3">
        <div className="col">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: '#f8f9fc', borderBottom: '1px solid #e3e6f0' }}>
              <h5 style={{ margin: 0, color: '#5a5c69', fontWeight: '600' }}>API Endpoints Reference</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Core Endpoints</h6>
                  <ul className="list-unstyled">
                    <li><code>GET /warehouses</code> - Get all warehouses</li>
                    <li><code>GET /products?status=Active</code> - Get active products</li>
                    <li><code>GET /warehouses/1/inventory</code> - Get warehouse inventory</li>
                    <li><code>GET /warehouses/1/stock-history</code> - Get stock history</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Manual Stock Management</h6>
                  <ul className="list-unstyled">
                    <li><code>POST /warehouses/manual-stock-movement</code> - Create stock movement</li>
                    <li><strong>Body:</strong> <code>{'{warehouseId, productId, movementType, quantity, reason}'}</code></li>
                    <li><strong>Movement Types:</strong> "inward" or "outward"</li>
                    <li><strong>Features:</strong> Role-based access, validation, audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualStockAPITest;
