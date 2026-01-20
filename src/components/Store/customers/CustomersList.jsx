import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../Dashboard/Purchases/Purchases.module.css";
import { FaUserCheck, FaUserClock, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import storeService from "../../../services/storeService";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

export default function CustomersList() {
  const navigate = useNavigate();
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    code: false,
    name: false,
    mobile: false,
    createdBy: false
  });

  const [searchTerms, setSearchTerms] = useState({
    code: "",
    name: "",
    mobile: "",
    createdBy: ""
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
          code: false,
          name: false,
          mobile: false
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
          code: false,
          name: false,
          mobile: false
        });
        setSearchTerms({
          code: "",
          name: "",
          mobile: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Get current store ID from localStorage
  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        return store.id;
      }
      const currentStoreId = localStorage.getItem("currentStoreId");
      return currentStoreId ? parseInt(currentStoreId) : null;
    } catch (e) {
      console.error("Error parsing store data:", e);
      return null;
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    const storeId = getStoreId();
    if (!storeId) {
      setError("Store not selected. Please select a store first.");
      setIsModalOpen(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        page: pageNo,
        limit: limit,
      };

      const response = await storeService.getStoreCustomers(storeId, params);

      if (response.success && response.data) {
        setCustomers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotal(response.pagination.total || 0);
        }
      } else {
        setError(response.message || "Failed to fetch customers");
        setIsModalOpen(true);
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.message || "Failed to fetch customers. Please try again.");
      setIsModalOpen(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered customers for header search
  const displayCustomers = React.useMemo(() => {
    let filtered = customers;

    if (searchTerms.code) {
      filtered = filtered.filter(customer => {
        const code = (customer.customerCode || `CUST${customer.id}`).toLowerCase();
        return code.includes(searchTerms.code.toLowerCase());
      });
    }

    if (searchTerms.name) {
      filtered = filtered.filter(customer => {
        const name = (customer.name || customer.farmerName || customer.label || customer.customerName || '').toLowerCase();
        return name.includes(searchTerms.name.toLowerCase());
      });
    }

    if (searchTerms.mobile) {
      filtered = filtered.filter(customer => {
        const mobile = (customer.mobile || customer.phone || customer.phoneNo || '').toLowerCase();
        return mobile.includes(searchTerms.mobile.toLowerCase());
      });
    }

    if (searchTerms.createdBy) {
      filtered = filtered.filter(customer => {
        const creator = (customer.createdByEmployee?.name || '').toLowerCase();
        return creator.includes(searchTerms.createdBy.toLowerCase());
      });
    }

    return filtered;
  }, [customers, searchTerms]);

  // Fetch customers when page or limit changes
  useEffect(() => {
    fetchCustomers();
  }, [pageNo, limit]);

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Customers List", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Define rows
    const rows = displayCustomers.map((customer, index) => {
      const actualIndex = (pageNo - 1) * limit + index + 1;
      return [
        actualIndex,
        customer.customerCode || `CUST${customer.id}`,
        customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A',
        customer.mobile || customer.phone || customer.phoneNo || 'N/A',
        `Rs. ${customer.totalPurchases?.toLocaleString('en-IN') || '0'}`,
        customer.createdByEmployee?.name || 'N/A'
      ];
    });

    // Generate table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }, // Primary blue color
    });

    doc.save("customers_list.pdf");
  };

  const exportToExcel = () => {
    // Format data for Excel
    const dataToExport = displayCustomers.map((customer, index) => {
      const actualIndex = (pageNo - 1) * limit + index + 1;
      return {
        "S.No": actualIndex,
        "Customer Code": customer.customerCode || `CUST${customer.id}`,
        "Name": customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A',
        "Mobile": customer.mobile || customer.phone || customer.phoneNo || 'N/A',
        "Total Purchases": customer.totalPurchases || 0,
        "Created By": customer.createdByEmployee?.name || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers_list.xlsx");
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Customers List
      </p>

      <div className="row m-0 p-3">
        <div className="col-12">
          <div className="row m-0 mb-3 justify-content-between align-items-center">
            {/* Export Buttons */}
            <div className="col-auto d-flex gap-2">
              <button 
                className={styles.xls} 
                onClick={exportToExcel}
                disabled={customers.length === 0}
              >
                <p>Export to </p>
                <img src={xls} alt="" />
              </button>
              <button 
                className={styles.xls} 
                onClick={exportToPDF}
                disabled={customers.length === 0}
              >
                <p>Export to </p>
                <img src={pdf} alt="" />
              </button>
            </div>

            <div className={`${styles.entity} col-auto`} style={{ marginRight: 0 }}>
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
                {renderSearchHeader("Customer Code", "code", "data-code-header")}
                {renderSearchHeader("Name", "name", "data-name-header")}
                {renderSearchHeader("Mobile", "mobile", "data-mobile-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Total Purchases</th>
                {renderSearchHeader("Created By", "createdBy", "data-created-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(searchTerms.code || searchTerms.name || searchTerms.mobile || searchTerms.createdBy) && (
                <tr>
                  <td colSpan="7" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {displayCustomers.length} customers found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loading />
                  </td>
                </tr>
              ) : displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    NO DATA FOUND
                  </td>
                </tr>
              ) : (
                displayCustomers.map((customer, index) => {
                  const actualIndex = (pageNo - 1) * limit + index + 1;
                  return (
                    <tr
                      key={customer.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{actualIndex}</td>
                      <td>{customer.customerCode || `CUST${customer.id}`}</td>
                      <td>{customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A'}</td>
                      <td>{customer.mobile || customer.phone || customer.phoneNo || 'N/A'}</td>
                      <td>₹{customer.totalPurchases?.toLocaleString('en-IN') || '0'}</td>
                      <td>{customer.createdByEmployee?.name || 'N/A'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/store/customers/${customer.id}`)}
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
                Showing {customers.length > 0 ? (pageNo - 1) * limit + 1 : 0} to {Math.min(pageNo * limit, total)} of {total} customers
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

