import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import styles from './Returns.module.css';

const AuthDebugger = () => {
  const { islogin } = useAuth();
  const { selectedDivision, showAllDivisions, divisions } = useDivision();
  const [userData, setUserData] = useState(null);
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      setUserData(user ? JSON.parse(user) : null);
      setTokenData({
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  const testAuthEndpoint = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Auth test response:', data);
      alert(`Auth test result: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Auth test error:', error);
      alert(`Auth test error: ${error.message}`);
    }
  };

  const testDivisionEndpoint = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/divisions/user-divisions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Division test response:', data);
      alert(`Division test result: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Division test error:', error);
      alert(`Division test error: ${error.message}`);
    }
  };

  return (
    <div className={styles.returnsContainer}>
      <h2>Authentication & Division Debugger</h2>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {/* Authentication Status */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Authentication Status</h3>
          <p><strong>Is Logged In:</strong> {islogin ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Has Token:</strong> {tokenData?.hasToken ? '✅ Yes' : '❌ No'}</p>
          {tokenData?.hasToken && (
            <p><strong>Token Length:</strong> {tokenData.tokenLength} characters</p>
          )}
          {tokenData?.tokenPreview && (
            <p><strong>Token Preview:</strong> {tokenData.tokenPreview}</p>
          )}
          <button onClick={testAuthEndpoint} style={{ marginTop: '10px', padding: '8px 16px' }}>
            Test Auth Endpoint
          </button>
        </div>

        {/* User Data */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>User Data</h3>
          {userData ? (
            <div>
              <p><strong>User ID:</strong> {userData.id || 'N/A'}</p>
              <p><strong>Name:</strong> {userData.name || 'N/A'}</p>
              <p><strong>Email:</strong> {userData.email || 'N/A'}</p>
              <p><strong>Roles:</strong> {userData.roles ? JSON.stringify(userData.roles) : 'N/A'}</p>
              <p><strong>Division ID:</strong> {userData.divisionId || 'N/A'}</p>
              <details style={{ marginTop: '10px' }}>
                <summary>Full User Data</summary>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', marginTop: '10px' }}>
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p>No user data found in localStorage</p>
          )}
        </div>

        {/* Division Context */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Division Context</h3>
          <p><strong>Selected Division:</strong> {selectedDivision ? selectedDivision.name : 'None'}</p>
          <p><strong>Division ID:</strong> {selectedDivision ? selectedDivision.id : 'None'}</p>
          <p><strong>Show All Divisions:</strong> {showAllDivisions ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Available Divisions:</strong> {divisions.length}</p>
          <button onClick={testDivisionEndpoint} style={{ marginTop: '10px', padding: '8px 16px' }}>
            Test Division Endpoint
          </button>
          <details style={{ marginTop: '10px' }}>
            <summary>Division Details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', marginTop: '10px' }}>
              {JSON.stringify({ selectedDivision, showAllDivisions, divisions }, null, 2)}
            </pre>
          </details>
        </div>

        {/* API Configuration */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>API Configuration</h3>
          <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        </div>

        {/* Recommendations */}
        <div style={{ border: '1px solid #orange', padding: '15px', borderRadius: '5px', backgroundColor: '#fff3cd' }}>
          <h3>🔧 Troubleshooting Recommendations</h3>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Ensure you're logged in and have a valid token</li>
            <li>Check that the user object has a <code>divisionId</code> property</li>
            <li>Verify that the backend API is running and accessible</li>
            <li>Check browser network tab for detailed error information</li>
            <li>Try refreshing the page to reload authentication context</li>
            <li>Contact backend team if division context is missing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;
