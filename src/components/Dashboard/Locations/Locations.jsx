import React, { useEffect, useState } from "react";

import { useAuth } from "@/Auth";

function Locations() {
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const { axiosAPI } = useAuth();

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmployees() {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoint
        let endpoint = "/employees";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        

        
        const res = await axiosAPI.get(endpoint);
        setEmployees(res.data.employees || []);
      } catch (e) {
        // handle error
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;
    setLocations([]); // Clear previous locations
    // Note: Live location tracking is currently disabled
  }, [selectedEmployee]);

  return (
    <div>
      <h2>Live Locations</h2>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="employee-select">Select Employee: </label>
        <select
          id="employee-select"
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
        >
          <option value="">-- Select Employee --</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name || emp.fullName || emp.employeeId || emp.id}
            </option>
          ))}
        </select>
      </div>
      {selectedEmployee ? (
        <ul>
          {locations.map((loc, idx) => (
            <li key={idx}>
              {loc.name || loc.employeeName || "Location"} - Lat: {loc.latitude}, Lng: {loc.longitude}
            </li>
          ))}
        </ul>
      ) : (
        <p>Please select an employee to view live location.</p>
      )}
    </div>
  );
}

export default Locations; 