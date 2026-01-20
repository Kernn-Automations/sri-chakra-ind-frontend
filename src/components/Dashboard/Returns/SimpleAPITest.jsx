import React, { useState } from 'react';
import { fetchWithDivision } from '../../../utils/fetchWithDivision';

const SimpleAPITest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('🧪 SIMPLE API TEST - Starting direct fetch...');
      
      const response = await fetchWithDivision(
        '/returns/eligible-sales-orders?returnCase=post_delivery&page=1&limit=100',
        'all',
        false,
        localStorage.getItem("accessToken")
      );
      
      console.log('🧪 SIMPLE API TEST - Direct response:', response);
      setResult(response);
    } catch (error) {
      console.error('🧪 SIMPLE API TEST - Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #ff9800', margin: '10px' }}>
      <h3>🧪 Simple API Test</h3>
      <button onClick={testAPI} disabled={loading}>
        {loading ? 'Testing...' : 'Test Direct API Call'}
      </button>
      
      {result && (
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <h4>Result:</h4>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SimpleAPITest;
