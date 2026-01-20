import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../Dashboard/Purchases/Purchases.module.css";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import storeService from "../../../services/storeService";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

export default function EmployeesList() {
  const navigate = useNavigate();
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [allStoreEmployees, setAllStoreEmployees] = useState([]);
  const [storeEmployees, setStoreEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backendPaginated, setBackendPaginated] = useState(false);

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    employeeId: false,
    name: false,
    mobile: false,
    email: false,
    storeName: false,
    roleName: false,
    status: false,
    assignedAt: false
  });

  const [searchTerms, setSearchTerms] = useState({
    employeeId: "",
    name: "",
    mobile: "",
    email: "",
    storeName: "",
    roleName: "",
    status: "",
    assignedAt: ""
  });

  const toggleSearch = (key) => {
    setShowSearch(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleSearchChange = (key, value) => {
    setSearchTerms(prev => ({ ...prev, [key]: value }));
  };

  const clearSearch = (key) => {
    setSearchTerms(prev => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showSearch[searchKey];
    const searchTerm = searchTerms[searchKey];

    return (
      <th
        onClick={() => toggleSearch(searchKey)}
        style={{ cursor: "pointer", position: "relative", fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => { e.stopPropagation(); clearSearch(searchKey); }}
                style={{
                  padding: "4px 8px", border: "1px solid #dc3545", borderRadius: "4px",
                  background: "#dc3545", color: "#fff", cursor: "pointer", fontSize: "12px",
                  fontWeight: "bold", minWidth: "24px", height: "28px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            )}
          </div>
        ) : (
          <>{label}</>
        )}
      </th>
    );
  };

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header search if clicked outside
      if (!event.target.closest('[data-search-header]')) {
        setShowSearch({
          employeeId: false,
          name: false,
          mobile: false,
          email: false,
          storeName: false,
          roleName: false,
          status: false,
          assignedAt: false
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          employeeId: false,
          name: false,
          mobile: false,
          email: false,
          storeName: false,
          roleName: false,
          status: false,
          assignedAt: false
        });
        setSearchTerms({
          employeeId: "",
          name: "",
          mobile: "",
          email: "",
          storeName: "",
          roleName: "",
          status: "",
          assignedAt: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Fetch store employees from API
  const fetchStoreEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pageNo,
        limit: limit,
      };

      const response = await storeService.getAllStoreEmployees(params);

      if (response.success && response.data) {
        // Check if backend supports pagination (has pagination info or count matches data length)
        const hasPaginationInfo = response.pagination || (response.count !== undefined && response.count !== response.data.length);
        
        if (hasPaginationInfo) {
          // Backend handles pagination
          setBackendPaginated(true);
          setStoreEmployees(response.data);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotal(response.pagination.total || response.data.length);
          } else if (response.count !== undefined) {
            setTotal(response.count);
            setTotalPages(Math.ceil(response.count / limit));
          }
        } else {
          // Backend returns all data, handle pagination on frontend
          setBackendPaginated(false);
          setAllStoreEmployees(response.data);
          setTotal(response.count || response.data.length);
          setTotalPages(Math.ceil((response.count || response.data.length) / limit));
        }
      } else {
        setError(response.message || "Failed to fetch store employees");
        setIsModalOpen(true);
        setStoreEmployees([]);
        setAllStoreEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching store employees:", err);
      setError(err.message || "Failed to fetch store employees. Please try again.");
      setIsModalOpen(true);
      setStoreEmployees([]);
      setAllStoreEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Get paginated data (for frontend pagination)
  const getPaginatedData = () => {
    if (backendPaginated) {
      return storeEmployees;
    }
    const startIndex = (pageNo - 1) * limit;
    const endIndex = startIndex + limit;
    return allStoreEmployees.slice(startIndex, endIndex);
  };

  // Fetch employees when page or limit changes
  useEffect(() => {
    // If backend supports pagination, always fetch
    // If backend doesn't support pagination, only fetch if we don't have data yet
    if (backendPaginated || allStoreEmployees.length === 0) {
      fetchStoreEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, limit]);

  // Update displayed data when pagination changes (for frontend pagination)
  useEffect(() => {
    if (!backendPaginated && allStoreEmployees.length > 0) {
      const startIndex = (pageNo - 1) * limit;
      const endIndex = startIndex + limit;
      setStoreEmployees(allStoreEmployees.slice(startIndex, endIndex));
      // Recalculate total pages when limit changes
      setTotalPages(Math.ceil(allStoreEmployees.length / limit));
    }
  }, [pageNo, limit, allStoreEmployees, backendPaginated]);

  // Memoized filtered employees for header search
  const displayEmployees = React.useMemo(() => {
    let filtered = storeEmployees;

    if (searchTerms.employeeId) {
      filtered = filtered.filter(item => {
        const id = (item.employee?.employeeId || '').toLowerCase();
        return id.includes(searchTerms.employeeId.toLowerCase());
      });
    }

    if (searchTerms.name) {
      filtered = filtered.filter(item => {
        const name = (item.employee?.name || '').toLowerCase();
        return name.includes(searchTerms.name.toLowerCase());
      });
    }

    if (searchTerms.mobile) {
      filtered = filtered.filter(item => {
        const mobile = (item.employee?.mobile || '').toLowerCase();
        return mobile.includes(searchTerms.mobile.toLowerCase());
      });
    }

    if (searchTerms.email) {
      filtered = filtered.filter(item => {
        const email = (item.employee?.email || '').toLowerCase();
        return email.includes(searchTerms.email.toLowerCase());
      });
    }

    if (searchTerms.storeName) {
      filtered = filtered.filter(item => {
        const store = (item.store?.name || '').toLowerCase();
        return store.includes(searchTerms.storeName.toLowerCase());
      });
    }

    if (searchTerms.roleName) {
      filtered = filtered.filter(item => {
        const role = (item.role?.name || '').toLowerCase();
        return role.includes(searchTerms.roleName.toLowerCase());
      });
    }

    if (searchTerms.status) {
      filtered = filtered.filter(item => {
        const employee = item.employee || {};
        const status = (employee.status || (item.isActive ? "Active" : "Inactive")).toLowerCase();
        return status.includes(searchTerms.status.toLowerCase());
      });
    }

    if (searchTerms.assignedAt) {
      filtered = filtered.filter(item => {
        const assigned = formatDate(item.assignedAt).toLowerCase();
        return assigned.includes(searchTerms.assignedAt.toLowerCase());
      });
    }

    return filtered;
  }, [storeEmployees, searchTerms]);

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <p className="path">
        <span>Employees</span>
      </p>

      <div className="row m-0 p-3">
        <div className="col-12">
          <div className="row m-0 mb-3 justify-content-end">
            <div className={`${styles.entity}`} style={{ marginRight: 0 }}>
              <label htmlFor="">Entity :</label>
              <select
                name=""
                id=""
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <table className={`table table-bordered borderedtable`}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>S.No</th>
                {renderSearchHeader("Employee ID", "employeeId", "data-id-header")}
                {renderSearchHeader("Employee Name", "name", "data-name-header")}
                {renderSearchHeader("Mobile Number", "mobile", "data-mobile-header")}
                {renderSearchHeader("Email", "email", "data-email-header")}
                {renderSearchHeader("Store Name", "storeName", "data-store-header")}
                {renderSearchHeader("Role", "roleName", "data-role-header")}
                {renderSearchHeader("Status", "status", "data-status-header")}
                {renderSearchHeader("Assigned At", "assignedAt", "data-assigned-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(searchTerms.employeeId || searchTerms.name || searchTerms.mobile || searchTerms.email || 
                searchTerms.storeName || searchTerms.roleName || searchTerms.status || searchTerms.assignedAt) && (
                <tr>
                  <td colSpan="10" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {displayEmployees.length} employees found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loading />
                  </td>
                </tr>
              ) : displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
                    NO DATA FOUND
                  </td>
                </tr>
              ) : (
                displayEmployees.map((storeEmployee, index) => {
                  const actualIndex = (pageNo - 1) * limit + index + 1;
                  const employee = storeEmployee.employee || {};
                  const store = storeEmployee.store || {};
                  const role = storeEmployee.role || {};
                  const status = employee.status || (storeEmployee.isActive ? "Active" : "Inactive");
                  
                  return (
                    <tr
                      key={storeEmployee.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{actualIndex}</td>
                      <td>{employee.employeeId || "-"}</td>
                      <td>{employee.name || "-"}</td>
                      <td>{employee.mobile || "-"}</td>
                      <td>{employee.email || "-"}</td>
                      <td>{store.name || "-"}</td>
                      <td>{role.name || "-"}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 500,
                            backgroundColor: status === "Active" || storeEmployee.isActive ? "#d1fae5" : "#fee2e2",
                            color: status === "Active" || storeEmployee.isActive ? "#065f46" : "#991b1b",
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td>{formatDate(storeEmployee.assignedAt)}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/store/employees/${storeEmployee.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="row m-0 p-0 pt-3 justify-content-between align-items-center">
            <div className={`col-6 m-0 p-0`}>
              <p style={{ margin: 0, fontFamily: 'Poppins', fontSize: '14px', color: '#666' }}>
                Showing {displayEmployees.length > 0 ? (pageNo - 1) * limit + 1 : 0} to {Math.min(pageNo * limit, total)} of {total} employees
              </p>
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo > 1 && (
                <button onClick={() => setPageNo(pageNo - 1)} disabled={loading}>
                  <span>
                    <FaArrowLeftLong />
                  </span>{" "}
                  Previous
                </button>
              )}
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo < totalPages && (
                <button onClick={() => setPageNo(pageNo + 1)} disabled={loading}>
                  Next{" "}
                  <span>
                    <FaArrowRightLong />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={closeModal}
        />
      )}
    </>
  );
}















