import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import styles from './Returns.module.css';

const ReturnsSystemTest = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [runningTests, setRunningTests] = useState([]);

  const tests = [
    {
      id: 'eligible-sales-orders',
      name: 'Get Eligible Sales Orders',
      description: 'Test fetching sales orders eligible for returns',
      test: async () => {
        const response = await returnsService.getEligibleSalesOrders(
          { returnCase: 'post_delivery' },
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.salesOrders?.length || 0,
          message: response.message
        };
      }
    },
    {
      id: 'return-reasons',
      name: 'Get Return Reasons',
      description: 'Test fetching return reasons',
      test: async () => {
        const response = await returnsService.getReturnReasons(
          {},
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.returnReasons?.length || 0,
          message: response.message
        };
      }
    },
    {
      id: 'refund-methods',
      name: 'Get Refund Methods',
      description: 'Test fetching refund methods',
      test: async () => {
        const response = await returnsService.getRefundMethods(
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.refundMethods?.length || 0,
          message: response.message
        };
      }
    },
    {
      id: 'return-types',
      name: 'Get Return Types',
      description: 'Test fetching return types',
      test: async () => {
        const response = await returnsService.getReturnTypes(
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.returnTypes?.length || 0,
          message: response.message
        };
      }
    },
    {
      id: 'return-requests',
      name: 'Get Return Requests',
      description: 'Test fetching return requests list',
      test: async () => {
        const response = await returnsService.getReturnRequests(
          { page: 1, limit: 10 },
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.returnRequests?.length || 0,
          message: response.message
        };
      }
    },
    {
      id: 'damaged-goods-reasons',
      name: 'Get Damaged Goods Reasons',
      description: 'Test fetching damaged goods reasons',
      test: async () => {
        const response = await returnsService.getDamagedGoodsReasons(
          selectedDivision?.id,
          showAllDivisions
        );
        return {
          success: response.success,
          data: response.data?.returnReasons?.length || 0,
          message: response.message
        };
      }
    }
  ];

  const runSingleTest = async (test) => {
    setRunningTests(prev => [...prev, test.id]);
    
    try {
      const result = await test.test();
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          ...result,
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          status: 'failed'
        }
      }));
    } finally {
      setRunningTests(prev => prev.filter(id => id !== test.id));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});
    
    for (const test of tests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoading(false);
    showSuccessNotification('All tests completed', { title: 'Test Results' });
  };

  const getTestStatusIcon = (testId) => {
    if (runningTests.includes(testId)) {
      return <span className="spinner-border spinner-border-sm text-primary" role="status"></span>;
    }
    
    const result = testResults[testId];
    if (!result) {
      return <i className="bi bi-circle text-muted"></i>;
    }
    
    if (result.status === 'failed') {
      return <i className="bi bi-x-circle text-danger"></i>;
    }
    
    return result.success ? 
      <i className="bi bi-check-circle text-success"></i> : 
      <i className="bi bi-exclamation-triangle text-warning"></i>;
  };

  const getTestStatusText = (testId) => {
    if (runningTests.includes(testId)) {
      return 'Running...';
    }
    
    const result = testResults[testId];
    if (!result) {
      return 'Not tested';
    }
    
    if (result.status === 'failed') {
      return 'Failed';
    }
    
    return result.success ? 'Passed' : 'Warning';
  };

  const getTestStatusClass = (testId) => {
    if (runningTests.includes(testId)) {
      return 'table-info';
    }
    
    const result = testResults[testId];
    if (!result) {
      return '';
    }
    
    if (result.status === 'failed') {
      return 'table-danger';
    }
    
    return result.success ? 'table-success' : 'table-warning';
  };

  return (
    <div className={styles.returnsSystemTest}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Returns System Integration Test</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={runAllTests}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Running Tests...
              </>
            ) : (
              <>
                <i className="bi bi-play-circle me-1"></i>
                Run All Tests
              </>
            )}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setTestResults({})}
          >
            <i className="bi bi-trash me-1"></i>
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Environment Info */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Test Environment</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <strong>Division:</strong> {selectedDivision?.name || 'All Divisions'}
            </div>
            <div className="col-md-3">
              <strong>Show All:</strong> {showAllDivisions ? 'Yes' : 'No'}
            </div>
            <div className="col-md-3">
              <strong>Base URL:</strong> http://localhost:8080/api
            </div>
            <div className="col-md-3">
              <strong>Tests:</strong> {tests.length} available
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Test Results</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th width="50">Status</th>
                  <th>Test Name</th>
                  <th>Description</th>
                  <th>Result</th>
                  <th>Data Count</th>
                  <th>Message</th>
                  <th width="100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className={getTestStatusClass(test.id)}>
                    <td className="text-center">
                      {getTestStatusIcon(test.id)}
                    </td>
                    <td>
                      <strong>{test.name}</strong>
                    </td>
                    <td>
                      <small className="text-muted">{test.description}</small>
                    </td>
                    <td>
                      <span className={`badge ${
                        runningTests.includes(test.id) ? 'bg-info' :
                        testResults[test.id]?.status === 'failed' ? 'bg-danger' :
                        testResults[test.id]?.success ? 'bg-success' : 'bg-warning'
                      }`}>
                        {getTestStatusText(test.id)}
                      </span>
                    </td>
                    <td>
                      {testResults[test.id]?.data !== undefined ? 
                        testResults[test.id].data : '-'
                      }
                    </td>
                    <td>
                      <small className="text-muted">
                        {testResults[test.id]?.message || 
                         testResults[test.id]?.error || '-'}
                      </small>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => runSingleTest(test)}
                        disabled={runningTests.includes(test.id)}
                      >
                        <i className="bi bi-play"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Test Summary */}
      {Object.keys(testResults).length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h6 className="mb-0">Test Summary</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-success">
                    {Object.values(testResults).filter(r => r.success).length}
                  </h4>
                  <small className="text-muted">Passed</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-warning">
                    {Object.values(testResults).filter(r => !r.success && r.status !== 'failed').length}
                  </h4>
                  <small className="text-muted">Warnings</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-danger">
                    {Object.values(testResults).filter(r => r.status === 'failed').length}
                  </h4>
                  <small className="text-muted">Failed</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-info">
                    {Object.keys(testResults).length}
                  </h4>
                  <small className="text-muted">Total</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Endpoints Reference */}
      <div className="card mt-4">
        <div className="card-header">
          <h6 className="mb-0">API Endpoints Reference</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>Core Endpoints</h6>
              <ul className="list-unstyled">
                <li><code>GET /returns/eligible-sales-orders</code></li>
                <li><code>POST /returns/requests</code></li>
                <li><code>GET /returns/requests</code></li>
                <li><code>PUT /returns/requests/:id/approve</code></li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6>Utility Endpoints</h6>
              <ul className="list-unstyled">
                <li><code>GET /returns/refund-methods</code></li>
                <li><code>GET /returns/return-types</code></li>
                <li><code>GET /returns/reasons</code></li>
                <li><code>POST /returns/items/:id/images</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsSystemTest;
