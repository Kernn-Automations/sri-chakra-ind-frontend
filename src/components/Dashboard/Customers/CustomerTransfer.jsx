import React, { useEffect, useMemo, useState } from "react";
import styles from "./Customer.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";

function CustomerTransfer({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Single transfer state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [toEmployeeId, setToEmployeeId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [selectedSalesExecutiveId, setSelectedSalesExecutiveId] = useState("");
  
  // Search states for single transfer fields
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [salesExecutiveSearch, setSalesExecutiveSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showSalesExecutiveDropdown, setShowSalesExecutiveDropdown] = useState(false);

  // Bulk transfer state
  const [customersList, setCustomersList] = useState([]);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkToEmployeeId, setBulkToEmployeeId] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkPage, setBulkPage] = useState(1);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkPagination, setBulkPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 });
  const [bulkSelectedSalesExecutiveId, setBulkSelectedSalesExecutiveId] = useState("");

  const closeError = () => setError(null);

  const fetchSalesExecutives = async () => {
    try {
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = "/employees/role/Business Officer";
      
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        endpoint += `?showAllDivisions=true`;
      }
      
      const res = await axiosAPI.get(endpoint);
      const data = res?.data?.employees || res?.data?.data || res?.data || [];
      setSalesExecutives(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch sales executives:', e);
      setSalesExecutives([]);
    }
  };

  const fetchAvailableEmployees = async (customerId) => {
    if (!customerId) {
      setAvailableEmployees([]);
      return;
    }
    try {
      const res = await axiosAPI.get(`/customer-transfers/available-employees/${customerId}`);
      const data = res?.data?.data || res?.data;
      setAvailableEmployees(data?.availableEmployees || []);
    } catch (e) {
      setAvailableEmployees([]);
    }
  };

  const fetchCustomersForBulk = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: bulkPage.toString(),
        limit: '50'
      });
      
      if (bulkSearch.trim()) {
        params.append('search', bulkSearch.trim());
      }
      
      const res = await axiosAPI.get(`/customer-transfers/customers/for-bulk-transfer?${params.toString()}`);
      const data = res?.data?.data || res?.data;
      
      // Debug log to check the response structure
      console.log('Customer transfer API response:', data);
      console.log('Customers list:', data?.customers);
      
      setCustomersList(data?.customers || []);
      setBulkPagination(data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersForBulk();
  }, [bulkPage]);

  useEffect(() => {
    fetchSalesExecutives();
  }, []);

  useEffect(() => {
    const id = selectedCustomerId;
    if (id) {
      fetchAvailableEmployees(id);
      // Fetch customer details directly using customer ID endpoint
      (async () => {
        try {
          const currentDivisionId = localStorage.getItem('currentDivisionId');
          let customerUrl = `/customers/${id}`;
          
          // Add division context if needed
          if (currentDivisionId && currentDivisionId !== '1') {
            customerUrl += `?divisionId=${currentDivisionId}`;
          } else if (currentDivisionId === '1') {
            customerUrl += `?showAllDivisions=true`;
          }
          
          const res = await axiosAPI.get(customerUrl);
          const customer = res?.data?.customer || res?.data?.data?.customer || res?.data;
          setCustomerDetails(customer || null);
        } catch (_) {
          setCustomerDetails(null);
        }
      })();
    } else {
      setCustomerDetails(null);
    }
  }, [selectedCustomerId]);

  const submitSingleTransfer = async () => {
    if (!selectedCustomerId || !toEmployeeId) {
      setError("Select customer and target employee");
      return;
    }
    try {
      setLoading(true);
      const payload = { 
        customerId: Number(selectedCustomerId), 
        toEmployeeId: Number(toEmployeeId), 
        transferReason,
        salesExecutiveId: selectedSalesExecutiveId ? Number(selectedSalesExecutiveId) : null
      };
      const res = await axiosAPI.post(`/customer-transfers/transfer`, payload);
      setSingleResult(res?.data);
      // Clear form on success
      if (res?.data?.success) {
        setSelectedCustomerId("");
        setToEmployeeId("");
        setSelectedSalesExecutiveId("");
        setTransferReason("");
        setCustomerDetails(null);
        setAvailableEmployees([]);
        setCustomerSearch("");
        setEmployeeSearch("");
        setSalesExecutiveSearch("");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const submitBulkTransfer = async () => {
    if (!bulkSelectedIds.length || !bulkToEmployeeId) {
      setError("Select at least one customer and target employee");
      return;
    }
    try {
      setLoading(true);
      const payload = { 
        customerIds: bulkSelectedIds.map(Number), 
        toEmployeeId: Number(bulkToEmployeeId), 
        transferReason: bulkReason,
        salesExecutiveId: bulkSelectedSalesExecutiveId ? Number(bulkSelectedSalesExecutiveId) : null
      };
      const res = await axiosAPI.post(`/customer-transfers/bulk-transfer`, payload);
      const data = res?.data;
      if (data?.success) {
        // Clear selection
        setBulkSelectedIds([]);
        setBulkToEmployeeId("");
        setBulkSelectedSalesExecutiveId("");
        setBulkReason("");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Bulk transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleBulkSelection = (id) => {
    setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Filtered lists based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customersList;
    const searchLower = customerSearch.toLowerCase();
    return customersList.filter(c => 
      c.name?.toLowerCase().includes(searchLower) ||
      c.mobile?.includes(customerSearch) ||
      String(c.id).includes(customerSearch)
    );
  }, [customersList, customerSearch]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return availableEmployees;
    const searchLower = employeeSearch.toLowerCase();
    return availableEmployees.filter(emp => 
      emp.name?.toLowerCase().includes(searchLower) ||
      String(emp.id).includes(employeeSearch) ||
      (emp.team?.name || emp.team || emp.teamName)?.toLowerCase().includes(searchLower)
    );
  }, [availableEmployees, employeeSearch]);

  const filteredSalesExecutives = useMemo(() => {
    if (!salesExecutiveSearch.trim()) return salesExecutives;
    const searchLower = salesExecutiveSearch.toLowerCase();
    return salesExecutives.filter(se => 
      se.name?.toLowerCase().includes(searchLower) ||
      String(se.id).includes(salesExecutiveSearch) ||
      (se.team?.name || se.team)?.toLowerCase().includes(searchLower)
    );
  }, [salesExecutives, salesExecutiveSearch]);

  // Handle customer selection
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    const customer = customersList.find(c => c.id === Number(customerId));
    if (customer) {
      setCustomerSearch(`${customer.name}${customer.mobile ? ` - ${customer.mobile}` : ""} (#${customer.id})`);
    }
    setShowCustomerDropdown(false);
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setToEmployeeId(employeeId);
    const emp = availableEmployees.find(e => e.id === Number(employeeId));
    if (emp) {
      const teamText = (emp.team?.name || emp.team || emp.teamName) ? `(${(emp.team?.name || emp.team || emp.teamName)})` : '';
      setEmployeeSearch(`${emp.name} ${teamText}`);
    }
    setShowEmployeeDropdown(false);
  };

  // Handle sales executive selection
  const handleSalesExecutiveSelect = (salesExecutiveId) => {
    setSelectedSalesExecutiveId(salesExecutiveId);
    const se = salesExecutives.find(s => s.id === Number(salesExecutiveId));
    if (se) {
      const teamText = (se.team?.name || se.team) ? `(${(se.team?.name || se.team)})` : '';
      setSalesExecutiveSearch(`${se.name} ${teamText}`);
    }
    setShowSalesExecutiveDropdown(false);
  };


  return (
    <div className="container-fluid">
      <div className="row m-0 p-3">
        <div className="col d-flex align-items-center justify-content-between">
          <div>
            <p className="path">
              <span onClick={() => navigate("/customers")}>Customers</span>{" "}
              <i className="bi bi-chevron-right"></i> Customer Transfer
            </p>
          </div>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorModal isOpen={!!error} message={error} onClose={closeError} />}

      <div className="row m-0 p-3">
        {/* Single Transfer - styled like Create Customer */}
        <h5 className={styles.head}>Single Customer Transfer</h5>
        <div className={`col-3 ${styles.longform}`} style={{ position: "relative" }}>
          <label>Customers :</label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
            placeholder="Search customer by name, mobile, or ID"
          />
          {showCustomerDropdown && filteredCustomers.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "white",
                maxHeight: "200px",
                overflowY: "auto",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                padding: "4px 0",
                margin: "4px 0 0 0",
                listStyle: "none",
                border: "1px solid #ddd",
              }}
            >
              {filteredCustomers.map((c) => (
                <li
                  key={c.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCustomerSelect(c.id);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f1f1")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {c.name}{c.mobile ? ` - ${c.mobile}` : ""} (#{c.id})
                </li>
              ))}
            </ul>
          )}
        </div>

        {customerDetails && (
          <>
            <h5 className={styles.head}>Customer Details</h5>
            <div className={`col-3 ${styles.longform}`}>
              <label>Customer Name :</label>
              <input type="text" readOnly value={customerDetails.name || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Mobile Number :</label>
              <input type="text" readOnly value={customerDetails.mobile || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Firm Name :</label>
              <input type="text" readOnly value={customerDetails.firmName || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Status :</label>
              <input type="text" readOnly value={customerDetails.status || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Division :</label>
              <input type="text" readOnly value={(customerDetails.division && customerDetails.division.name) || customerDetails.division || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Zone :</label>
              <input type="text" readOnly value={(customerDetails.zone && customerDetails.zone.name) || customerDetails.zone || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>SubZone :</label>
              <input type="text" readOnly value={(customerDetails.subZone && customerDetails.subZone.name) || customerDetails.subZone || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Team :</label>
              <input type="text" readOnly value={(customerDetails.team && customerDetails.team.name) || customerDetails.team || ''} />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Current Executive :</label>
              <input type="text" readOnly value={customerDetails.currentEmployee?.name || customerDetails.currentEmployee?.employeeName || customerDetails.currentExecutive?.name || 'N/A'} />
            </div>
          </>
        )}

        <div className={`col-3 ${styles.longform}`} style={{ position: "relative" }}>
          <label>Employees :</label>
          <input
            type="text"
            value={employeeSearch}
            onChange={(e) => {
              setEmployeeSearch(e.target.value);
              setShowEmployeeDropdown(true);
            }}
            onFocus={() => setShowEmployeeDropdown(true)}
            onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
            placeholder="Search employee by name, ID, or team"
            disabled={!selectedCustomerId}
          />
          {showEmployeeDropdown && filteredEmployees.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "white",
                maxHeight: "200px",
                overflowY: "auto",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                padding: "4px 0",
                margin: "4px 0 0 0",
                listStyle: "none",
                border: "1px solid #ddd",
              }}
            >
              {filteredEmployees.map((emp) => (
                <li
                  key={emp.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleEmployeeSelect(emp.id);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f1f1")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {emp.name} {(emp.team || emp.teamName) ? `(${(emp.team && emp.team.name) || emp.team || emp.teamName})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`col-3 ${styles.longform}`} style={{ position: "relative" }}>
          <label>Sales Executive :</label>
          <input
            type="text"
            value={salesExecutiveSearch}
            onChange={(e) => {
              setSalesExecutiveSearch(e.target.value);
              setShowSalesExecutiveDropdown(true);
            }}
            onFocus={() => setShowSalesExecutiveDropdown(true)}
            onBlur={() => setTimeout(() => setShowSalesExecutiveDropdown(false), 200)}
            placeholder="Search sales executive by name, ID, or team"
          />
          {showSalesExecutiveDropdown && filteredSalesExecutives.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "white",
                maxHeight: "200px",
                overflowY: "auto",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                padding: "4px 0",
                margin: "4px 0 0 0",
                listStyle: "none",
                border: "1px solid #ddd",
              }}
            >
              {filteredSalesExecutives.map((se) => (
                <li
                  key={se.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSalesExecutiveSelect(se.id);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f1f1")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {se.name} {se.team || (se.team && se.team.name) ? `(${(se.team && se.team.name) || se.team || 'N/A'})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`col-6 ${styles.textform}`}>
          <label>Reason :</label>
          <textarea rows={2} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Add transfer reason" />
        </div>

        {!loading && (
          <div className="row m-0 p-3">
            <div className="col-3">
              <button className="submitbtn" onClick={submitSingleTransfer} disabled={loading}>Transfer</button>
              <button className="cancelbtn" onClick={() => navigate("/customers")}>Cancel</button>
            </div>
            {singleResult?.success && (
              <div className="col d-flex align-items-center text-success">{singleResult?.message || "Transferred"}</div>
            )}
          </div>
        )}

        {/* Bulk Transfer - keep table, wrap headings and inputs in create-style */}
        <h5 className={styles.head}>Bulk Customer Transfer</h5>
        <div className="d-flex gap-2 mb-2">
          <input className="form-control" placeholder="Search by name or mobile" value={bulkSearch} onChange={(e) => setBulkSearch(e.target.value)} />
          <button className="btn btn-outline-primary" onClick={() => { setBulkPage(1); fetchCustomersForBulk(); }}>Search</button>
        </div>
        <div className={`table-responsive sticky-table`} style={{ maxHeight: 280 }}>
          <table className="table table-bordered borderedtable align-middle">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={customersList.length > 0 && bulkSelectedIds.length === customersList.length} onChange={(e) => {
                    if (e.target.checked) setBulkSelectedIds(customersList.map(c => c.id));
                    else setBulkSelectedIds([]);
                  }} />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Current SE</th>
              </tr>
            </thead>
            <tbody>
              {customersList.map((c, index) => (
                <tr key={c.id} className="animated-row" style={{ animationDelay: `${index * 0.1}s` }}>
                  <td>
                    <input type="checkbox" checked={bulkSelectedIds.includes(c.id)} onChange={() => toggleBulkSelection(c.id)} />
                  </td>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.mobile}</td>
                  <td>{c.currentEmployee?.name || c.currentEmployee?.employeeName || c.currentExecutive?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Target Employee :</label>
          <input type="text" placeholder="Enter Employee ID" value={bulkToEmployeeId} onChange={(e) => setBulkToEmployeeId(e.target.value)} />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Sales Executive :</label>
          <select value={bulkSelectedSalesExecutiveId} onChange={(e) => setBulkSelectedSalesExecutiveId(e.target.value)}>
            <option value="">Select sales executive</option>
            {salesExecutives.map((se) => (
              <option key={se.id} value={se.id}>{se.name} {se.team || (se.team && se.team.name) ? `(${(se.team && se.team.name) || se.team || 'N/A'})` : ''}</option>
            ))}
          </select>
        </div>
        <div className={`col-6 ${styles.textform}`}>
          <label>Reason :</label>
          <textarea rows={2} value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Team restructuring / etc." />
        </div>
        <div className="row m-0 p-3 align-items-center">
          <div className="col-3">
            <button className="submitbtn" onClick={submitBulkTransfer} disabled={loading || bulkSelectedIds.length === 0}>Bulk Transfer</button>
          </div>
          <div className="col">
            <small className="text-muted">Selected: {bulkSelectedIds.length}</small>
          </div>
          <div className="col d-flex align-items-center gap-2 justify-content-end">
            <button className="btn btn-outline-secondary btn-sm" disabled={bulkPage <= 1} onClick={() => setBulkPage(p => Math.max(1, p - 1))}>Prev</button>
            <span>{bulkPagination.currentPage} / {bulkPagination.totalPages}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={bulkPage >= bulkPagination.totalPages} onClick={() => setBulkPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerTransfer;


