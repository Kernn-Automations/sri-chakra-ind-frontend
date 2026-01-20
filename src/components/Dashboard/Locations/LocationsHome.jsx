import React, { useState, useEffect } from "react";
import LocationViewModal from "./LocationViewModal";
import styles from "./Location.module.css";
import { IoSearch } from "react-icons/io5";

import { useAuth } from "@/Auth";
import {
  GoogleMap,
  MarkerF,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import LoadingAnimation from "@/components/LoadingAnimation";
import locationAni from "../../../images/animations/confirmed.gif";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function LocationsHome() {
  const [type, setType] = useState("employee");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [locations, setLocations] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null); // For InfoWindow popup
  const [loading, setLoading] = useState(false);
  const [latestLocations, setLatestLocations] = useState([]); // For all employees' latest locations
  const { axiosAPI } = useAuth();
  const isLoaded = typeof window !== "undefined" && !!window.google;

// Maps API is loaded globally in main.jsx via LoadScript

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // Use the new dedicated endpoint for location dropdown
        let endpoint = "/employees/for-location-dropdown";
        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `?showAllDivisions=true`;
        }

        const res = await axiosAPI.get(endpoint);

        // Handle the new backend response structure
        if (
          res.data &&
          res.data.success &&
          res.data.data &&
          Array.isArray(res.data.data)
        ) {
          setEmployees(res.data.data);
        } else if (
          res.data &&
          res.data.employees &&
          Array.isArray(res.data.employees)
        ) {
          setEmployees(res.data.employees);
        } else if (res.data && Array.isArray(res.data)) {
          setEmployees(res.data);
        } else {
          setEmployees([]);
        }
      } catch (e) {
        console.error("LocationsHome - Failed to fetch employees:", e);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, [axiosAPI]);

  // Fetch latest locations for all employees in current division
  useEffect(() => {
    async function fetchLatestLocations() {
      try {
        const currentDivisionId = localStorage.getItem("currentDivisionId");

        if (!currentDivisionId || currentDivisionId === "1") {
          // If "All Divisions" is selected, use the all-employees-latest endpoint
          const res = await axiosAPI.get("/location/all-employees-latest");
          if (res.data && res.data.success && res.data.divisions) {
            // Flatten all divisions' data
            const allLocations = [];
            res.data.divisions.forEach((division) => {
              if (division.employees) {
                division.employees.forEach((emp) => {
                  if (emp.location) {
                    allLocations.push({
                      ...emp.location,
                      employee: emp.employee,
                      division: division.division,
                    });
                  }
                });
              }
            });
            setLatestLocations(allLocations);
          }
        } else {
          // Use division-specific endpoint
          const res = await axiosAPI.get(
            `/location/latest/division/${currentDivisionId}`
          );
          if (res.data && res.data.success && res.data.data) {
            setLatestLocations(res.data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest locations:", err);
        setLatestLocations([]);
      }
    }

    fetchLatestLocations();
  }, [axiosAPI]);

  // Fetch locations
  useEffect(() => {
    if (!selectedEmployee || !selectedDate) return;
    setLocations([]);

    // Fetch previous locations for selected employee and date
    setLoading(true);

    // Get division ID for location filtering
    const currentDivisionId = localStorage.getItem("currentDivisionId");

    // Use the correct endpoint structure: /location/history?divisionId=X
    let endpoint = `/location/history`;
    if (currentDivisionId && currentDivisionId !== "1") {
      endpoint += `?divisionId=${currentDivisionId}`;
    } else if (currentDivisionId === "1") {
      endpoint += `?showAllDivisions=true`;
    }

    // Add employee filter if specific employee is selected
    if (selectedEmployee) {
      endpoint += `${endpoint.includes("?") ? "&" : "?"}employeeId=${selectedEmployee}`;
    }

    // Add date filter
    if (selectedDate) {
      endpoint += `${endpoint.includes("?") ? "&" : "?"}date=${selectedDate}`;
    }

    axiosAPI
      .get(endpoint)
      .then((res) => {
        // Handle the backend response structure
        if (
          res.data &&
          res.data.success &&
          res.data.locations &&
          Array.isArray(res.data.locations)
        ) {
          setLocations(res.data.locations);
        } else if (
          res.data &&
          res.data.locations &&
          Array.isArray(res.data.locations)
        ) {
          setLocations(res.data.locations);
        } else if (res.data && Array.isArray(res.data)) {
          setLocations(res.data);
        } else {
          setLocations([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching locations:", err);
        setLocations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedEmployee, selectedDate, axiosAPI]);

  // Center map on latest location or default
  const latest = locations.length > 0 ? locations[locations.length - 1] : null;
  const center = latest
    ? { lat: Number(latest.latitude), lng: Number(latest.longitude) }
    : { lat: 17.49172973655364, lng: 78.38712249518254 };

  let index = 1;
  return (
    <>
      <div className="row m-0 p-3 pt-5">
        <div className="col-3 formcontent">
          <label htmlFor="">Location Type :</label>
          <select
            name=""
            id=""
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="truck">Truck</option>
          </select>
        </div>
        {type === "employee" && (
          <>
            
            <CustomSearchDropdown
              label="Employees"
              onSelect={setSelectedEmployee}
              options={employees?.map((emp) => ({
                value: emp.id,
                label: emp.name || emp.fullName || emp.employeeId || emp.id,
              }))}
            />
            
            <div className="col-3 formcontent">
              <label htmlFor="date-select">Select Date: </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </>
        )}
      </div>
      {/* <div className="row m-0 p-3 justify-content-end">
        <div className={`col-4 ${styles.search}`}>
          <input type="text" placeholder="Search..." />
          <span className={styles.searchicon}>
            <IoSearch />
          </span>
        </div>
      </div> */}
      {/* Loading Animation */}
      {loading && (
        <LoadingAnimation gif={locationAni} msg="Fetching location data..." />
      )}

      {/* Summary Info removed */}

      {/* Latest Locations Overview removed */}
      {/* Summary Info removed per request */}

      {/* Latest Locations Overview removed per request */}

      {/* No Data Message */}
      {!loading &&
        type === "employee" &&
        selectedEmployee &&
        locations.length === 0 && (
          <div className="row m-0 p-3 justify-content-center">
            <div className="col-md-10">
              <div className="alert alert-info text-center">
                <h5>No Location Data Found</h5>
                <p>
                  No location data available for the selected employee and date.
                </p>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedEmployee("");
                    setLocations([]);
                  }}
                >
                  Select Different Employee
                </button>
              </div>
            </div>
          </div>
        )}

      {/* View All Latest Locations Button removed */}

      {/* Map Section - show only when an employee is selected */}
      {/* View All Latest Locations Button */}
      {!loading &&
        type === "employee" &&
        !selectedEmployee &&
        latestLocations.length > 0 && (
          <div className="row m-0 p-3 justify-content-center">
            <div className="col-md-10">
              <div className="text-center">
                <button
                  className="btn btn-outline-primary btn-lg"
                  onClick={() => {
                    // Show all latest locations on map
                    setLocations(
                      latestLocations.filter(
                        (loc) => loc.latitude && loc.longitude
                      )
                    );
                  }}
                >
                  📍 View All Latest Locations on Map
                </button>
                {/* Helper text removed per request */}
              </div>
            </div>
          </div>
        )}

      {/* Map Section */}
      {type === "employee" && isLoaded && !loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-md-10">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "500px" }}
              center={center}
              zoom={15}
            >
              {/* Polyline for route - only show when multiple points */}
              {Array.isArray(locations) && locations.length > 1 && (
                <Polyline
                  path={locations.map((loc) => ({
                    lat: Number(loc.latitude),
                    lng: Number(loc.longitude),
                  }))}
                  options={{
                    strokeColor: "#4285F4",
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    zIndex: 2,
                  }}
                />
              )}
              {/* Markers for locations */}
              {Array.isArray(locations) && locations.map((loc, idx) => {
                // Handle both individual employee locations and latest locations
                const employee =
                  loc.employee ||
                  employees.find((emp) => emp.id == selectedEmployee);
                const isLatest = !selectedEmployee; // If no employee selected, all are "latest"

                // Format date/time to IST
                let dateObj = null;
                let timeLabel = "";
                if (
                  loc.recordedAt ||
                  loc.timestamp ||
                  loc.time ||
                  loc.createdAt
                ) {
                  const rawTime =
                    loc.recordedAt ||
                    loc.timestamp ||
                    loc.time ||
                    loc.createdAt;
                  dateObj = new Date(rawTime);
                  if (!isNaN(dateObj)) {
                    const pad = (n) => n.toString().padStart(2, "0");
                    const day = pad(dateObj.getDate());
                    const month = pad(dateObj.getMonth() + 1);
                    const year = dateObj.getFullYear();
                    const hours = pad(dateObj.getHours());
                    const mins = pad(dateObj.getMinutes());
                    const secs = pad(dateObj.getSeconds());
                    timeLabel = `${day}/${month}/${year}, ${hours}:${mins}:${secs}`;
                  } else {
                    timeLabel = rawTime;
                  }
                }

                // Get battery percent
                const battery =
                  loc.batteryLevel ??
                  loc.batteryPercent ??
                  loc.battery_percentage ??
                  loc.battery ??
                  null;

                return (
                  <MarkerF
                    key={idx}
                    position={{
                      lat: Number(loc.latitude),
                      lng: Number(loc.longitude),
                    }}
                    icon={{
                      url: isLatest
                        ? "data:image/svg+xml;utf-8,<svg height='28' width='28' xmlns='http://www.w3.org/2000/svg'><circle cx='14' cy='14' r='10' fill='%23FF0000' stroke='white' stroke-width='3'/><circle cx='14' cy='14' r='4' fill='white'/></svg>"
                        : "data:image/svg+xml;utf-8,<svg height='24' width='24' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='8' fill='%2366BB6A' stroke='white' stroke-width='2'/></svg>",
                      scaledSize: isLatest
                        ? { width: 28, height: 28 }
                        : { width: 24, height: 24 },
                    }}
                    title={`${isLatest ? "LATEST - " : ""}${employee?.name || "Employee"}: ${timeLabel}${battery !== null ? `, Battery: ${battery}%` : ""}`}
                    onClick={() => setActiveMarker(idx)}
                  >
                    {activeMarker === idx && (
                      <InfoWindow
                        position={{
                          lat: Number(loc.latitude),
                          lng: Number(loc.longitude),
                        }}
                        onCloseClick={() => setActiveMarker(null)}
                      >
                        <div>
                          <div><b>Employee:</b> {employee?.name || 'Unknown'}</div>
                          <div><b>Date & Time (IST):</b> {timeLabel}</div>
                          {isLatest && (
                            <div
                              style={{
                                color: "#FF4444",
                                fontWeight: "bold",
                                marginBottom: "5px",
                              }}
                            >
                              📍 LATEST LOCATION
                            </div>
                          )}
                          <div>
                            <b>Employee:</b> {employee?.name || "Unknown"}
                          </div>
                          <div>
                            <b>Division:</b>{" "}
                            {employee?.division?.name ||
                              loc.division?.name ||
                              "N/A"}
                          </div>
                          <div>
                            <b>Date & Time (IST):</b> {timeLabel}
                          </div>
                          {battery !== null && (
                            <div>
                              <b>Battery:</b> {battery}%
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </MarkerF>
                );
              })}
            </GoogleMap>
          </div>
        </div>
      )}

      {/* Table fallback for truck or if you want to keep it */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-md-10">
          {type === "truck" && (
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Truck Number</th>
                  <th>GPS Tracker ID</th>
                  <th>Warehouse ID</th>
                  <th>Warehouse Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className="animated-row"
                  style={{ animationDelay: `${index++ * 0.1}s` }}
                >
                  <td>1</td>
                  <td>TS02AB2332</td>
                  <td>tracker 1</td>
                  <td>#4545</td>
                  <td>Warehouse 1</td>
                  <td>
                    <LocationViewModal />
                  </td>
                </tr>
                <tr
                  className="animated-row"
                  style={{ animationDelay: `${index++ * 0.1}s` }}
                >
                  <td>2</td>
                  <td>TS03TR0032</td>
                  <td>Tracker 2</td>
                  <td>#4546</td>
                  <td>Warehouse 2</td>
                  <td>
                    <LocationViewModal />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default LocationsHome;
