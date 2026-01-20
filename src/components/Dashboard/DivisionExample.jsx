import React, { useState, useEffect } from 'react';
import { useDivision } from '../context/DivisionContext';
import { fetchWithDivision } from '../../utils/fetchWithDivision';
import { getDivisionDisplayName, isValidDivision } from '../../utils/divisionUtils';

/**
 * Example component demonstrating proper division system usage
 * This shows how to:
 * 1. Get the current division from context
 * 2. Make API calls with proper division filtering
 * 3. Handle "All Divisions" vs specific division data
 */
function DivisionExample() {
  const {
    selectedDivision,
    getCurrentDivisionId,
    isAllDivisionsSelected,
    divisions
  } = useDivision();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Example: Fetch data based on selected division
  const fetchData = async () => {
    if (!selectedDivision) {
      setError('No division selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const divisionId = getCurrentDivisionId();
      const isAllDivisions = isAllDivisionsSelected();

      console.log('Fetching data for division:', {
        divisionId,
        divisionName: selectedDivision.name,
        isAllDivisions
      });

      // Example API call using fetchWithDivision
      const response = await fetchWithDivision(
        '/example-endpoint', // Replace with your actual endpoint
        localStorage.getItem('accessToken'),
        divisionId,
        isAllDivisions
      );

      setData(response.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Example: Handle division change
  const handleDivisionChange = (newDivision) => {
    if (isValidDivision(newDivision)) {
      console.log('Division changed to:', {
        id: newDivision.id,
        name: newDivision.name,
        isAllDivisions: newDivision.isAllDivisions
      });
      
      // Refresh data when division changes
      fetchData();
    }
  };

  // Example: Get division-specific display text
  const getDivisionInfo = () => {
    if (!selectedDivision) return 'No division selected';

    if (isAllDivisionsSelected()) {
      return 'Showing data from all divisions';
    }

    return `Showing data from ${selectedDivision.name} division`;
  };

  useEffect(() => {
    if (selectedDivision) {
      fetchData();
    }
  }, [selectedDivision]);

  if (!selectedDivision) {
    return <div>Please select a division first</div>;
  }

  return (
    <div className="division-example">
      <h3>Division System Example</h3>
      
      {/* Current Division Display */}
      <div className="current-division">
        <h4>Current Division</h4>
        <p><strong>Name:</strong> {getDivisionDisplayName(selectedDivision)}</p>
        <p><strong>ID:</strong> {selectedDivision.id}</p>
        <p><strong>State:</strong> {selectedDivision.state}</p>
        <p><strong>Info:</strong> {getDivisionInfo()}</p>
      </div>

      {/* Division Selection */}
      <div className="division-selection">
        <h4>Available Divisions</h4>
        <div className="divisions-list">
          {divisions.map(division => (
            <button
              key={division.id}
              onClick={() => handleDivisionChange(division)}
              className={`division-btn ${selectedDivision.id === division.id ? 'active' : ''}`}
            >
              {getDivisionDisplayName(division)}
            </button>
          ))}
        </div>
      </div>

      {/* Data Display */}
      <div className="data-display">
        <h4>Data</h4>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <div>
            <p>Data count: {data.length}</p>
            <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
          </div>
        )}
      </div>

      {/* API Call Example */}
      <div className="api-example">
        <h4>Manual API Call</h4>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}

export default DivisionExample;
