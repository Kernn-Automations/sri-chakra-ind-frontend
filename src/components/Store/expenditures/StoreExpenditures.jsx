import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import Loading from "@/components/Loading";
import storeService from "../../../services/storeService";
import styles from "../sales/StoreSalesOrders.module.css";
import homeStyles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

const MONTH_OPTIONS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const LIMIT_OPTIONS = [10, 25, 50];

const now = new Date();
const DEFAULT_FILTERS = {
  months: [], // Start with no months selected
  year: now.getFullYear(),
  page: 1,
  limit: 10,
};

const getInitialFormState = () => ({
  staffSalary: "",
  rent: "",
  powerBill: "",
  maintenance: "",
  customFields: [],
});

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const monthLabel = (monthNumber) => {
  const option = MONTH_OPTIONS.find((entry) => entry.value === Number(monthNumber));
  return option ? option.label : "Unknown";
};

const convertCustomFieldsToRows = (customFields) => {
  if (!customFields || typeof customFields !== "object") return [];
  return Object.entries(customFields).map(([key, value]) => ({
    key,
    value: value ?? "",
  }));
};

const convertRowsToCustomFields = (rows = []) =>
  rows.reduce((acc, row) => {
    const trimmedKey = row.key?.trim();
    if (!trimmedKey) return acc;

    if (row.value === null || row.value === undefined || row.value === "") {
      acc[trimmedKey] = 0;
      return acc;
    }

    const numericValue = Number(row.value);
    acc[trimmedKey] = Number.isNaN(numericValue) ? row.value : numericValue;
    return acc;
  }, {});

const totalCustomFieldsAmount = (customFields) =>
  Object.values(customFields || {}).reduce((sum, amount) => sum + Number(amount || 0), 0);

const totalRecordExpenditure = (record) =>
  Number(record.staffSalary || 0) +
  Number(record.rent || 0) +
  Number(record.powerBill || 0) +
  Number(record.maintenance || 0) +
  totalCustomFieldsAmount(record.customFields);

const renderCustomFieldList = (customFields) => {
  const entries = Object.entries(customFields || {});
  if (!entries.length) {
    return <span style={{ color: "#9ca3af", fontFamily: "Poppins", fontSize: "13px" }}>—</span>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: "18px" }}>
      {entries.map(([key, value]) => (
        <li key={key} style={{ fontFamily: "Poppins", fontSize: "13px" }}>
          <strong>{key}</strong>: {formatCurrency(value)}
        </li>
      ))}
    </ul>
  );
};

function StoreExpenditures() {
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [tempFilters, setTempFilters] = useState({ ...DEFAULT_FILTERS }); // Temporary filters before submit
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [monthSearchTerm, setMonthSearchTerm] = useState("");

  const [expenditures, setExpenditures] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [selectedExpenditureId, setSelectedExpenditureId] = useState(null);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [editForm, setEditForm] = useState(getInitialFormState());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    month: DEFAULT_FILTERS.month,
    year: DEFAULT_FILTERS.year,
    staffSalary: "",
    rent: "",
    powerBill: "",
    maintenance: "",
    customFields: [],
  });

  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Header Search States
  const [showHeadersSearch, setShowHeadersSearch] = useState({
    code: false,
    period: false
  });

  const [headerSearchTerms, setHeaderSearchTerms] = useState({
    code: "",
    period: ""
  });

  const toggleHeaderSearch = (key) => {
    setShowHeadersSearch(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleHeaderSearchChange = (key, value) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: value }));
  };

  const clearHeaderSearch = (key) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showHeadersSearch[searchKey];
    const searchTerm = headerSearchTerms[searchKey];

    return (
      <th
        onClick={() => toggleHeaderSearch(searchKey)}
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
              onChange={(e) => handleHeaderSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => { e.stopPropagation(); clearHeaderSearch(searchKey); }}
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
      if (!event.target.closest('[data-search-header]')) {
        setShowHeadersSearch({
          code: false,
          period: false
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
        setShowHeadersSearch({
          code: false,
          period: false
        });
        setHeaderSearchTerms({
          code: "",
          period: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const showError = useCallback((message) => {
    setError(message || "Something went wrong. Please try again.");
    setIsErrorModalOpen(true);
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message || "Action completed successfully.");
    setIsSuccessModalOpen(true);
  }, []);

  useEffect(() => {
    if (storeId) return;
    try {
      // Get store ID from user context - try multiple sources
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      let id = user?.storeId || user?.store?.id;
      
      // Fallback to other localStorage keys
      if (!id) {
        const selectedStore = localStorage.getItem("selectedStore");
        if (selectedStore) {
          const store = JSON.parse(selectedStore);
          id = store.id;
        }
      }
      
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }
      
      if (id) {
        setStoreId(id);
      } else {
        showError("Store information missing. Please re-login to continue.");
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      showError("Unable to determine store information. Please re-login.");
    }
  }, [showError, storeId]);

  const fetchExpenditures = useCallback(async () => {
    if (!storeId) return;
    setListLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        year: filters.year
      };
      
      // Only add months parameter if months are selected
      if (filters.months && filters.months.length > 0) {
        params.months = filters.months;
      }
      
      const res = await storeService.getStoreExpenditures(storeId, params);
      const expendituresData = res.data || res.expenditures || res || [];
      const paginationData = res.pagination || {};
      
      // Map backend response to frontend format
      const mappedExpenditures = Array.isArray(expendituresData) ? expendituresData.map(item => ({
        id: item.id,
        expenditureCode: item.expenditureCode || item.code || `EXP-${item.id}`,
        month: item.month,
        year: item.year || filters.year,
        staffSalary: parseFloat(item.staffSalary || 0),
        rent: parseFloat(item.rent || 0),
        powerBill: parseFloat(item.powerBill || 0),
        maintenance: parseFloat(item.maintenance || 0),
        customFields: item.customFields || {},
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })) : [];

      setExpenditures(mappedExpenditures);
      setPagination({
        page: paginationData.page || filters.page,
        limit: paginationData.limit || filters.limit,
        total: paginationData.total || mappedExpenditures.length,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || mappedExpenditures.length) / filters.limit) || 1,
      });

      if (mappedExpenditures.length === 0) {
        setSelectedExpenditureId(null);
        setSelectedExpenditure(null);
        setEditForm(getInitialFormState());
      } else {
        // Only keep selection if it's still visible, otherwise clear it
        const stillVisible = mappedExpenditures.find((entry) => entry.id === selectedExpenditureId);
        if (!stillVisible) {
          setSelectedExpenditureId(null);
          setSelectedExpenditure(null);
          setEditForm(getInitialFormState());
        }
      }
    } catch (err) {
      console.error("Failed to fetch expenditures", err);
      showError(err.response?.data?.message || err.message || "Failed to fetch expenditures");
    } finally {
      setListLoading(false);
    }
  }, [filters.limit, filters.months, filters.page, filters.year, selectedExpenditureId, showError, storeId]);


  const loadExpenditureDetails = useCallback(
    async (expenditureId, { silent = false } = {}) => {
      if (!storeId || !expenditureId) return;
      if (!silent) {
        setDetailLoading(true);
      }
      try {
        const res = await storeService.getStoreExpenditureById(storeId, expenditureId);
        const data = res.data || res.expenditure || res;
        
        if (data && data.id) {
          const mappedData = {
            id: data.id,
            expenditureCode: data.expenditureCode || data.code || `EXP-${data.id}`,
            month: data.month,
            year: data.year,
            staffSalary: parseFloat(data.staffSalary || 0),
            rent: parseFloat(data.rent || 0),
            powerBill: parseFloat(data.powerBill || 0),
            maintenance: parseFloat(data.maintenance || 0),
            customFields: data.customFields || {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
          
          setSelectedExpenditure(mappedData);
          setEditForm({
            staffSalary: mappedData.staffSalary || "",
            rent: mappedData.rent || "",
            powerBill: mappedData.powerBill || "",
            maintenance: mappedData.maintenance || "",
            customFields: convertCustomFieldsToRows(mappedData.customFields),
          });
        } else {
          throw new Error("Expenditure not found.");
        }
      } catch (err) {
        console.error("Failed to load expenditure details", err);
        showError(err.response?.data?.message || err.message || "Failed to load expenditure details");
      } finally {
        if (!silent) {
          setDetailLoading(false);
        }
      }
    },
    [showError, storeId]
  );

  useEffect(() => {
    if (storeId) {
      fetchExpenditures();
    }
  }, [fetchExpenditures, storeId]);

  useEffect(() => {
    if (storeId && selectedExpenditureId) {
      loadExpenditureDetails(selectedExpenditureId);
    }
  }, [loadExpenditureDetails, selectedExpenditureId, storeId]);

  const handleFilterChange = (field, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field !== "page" ? { page: 1 } : {}),
    }));
  };

  const onSubmit = () => {
    setFilters({ ...tempFilters });
  };

  const onCancel = () => {
    setTempFilters({ ...DEFAULT_FILTERS });
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handlePaginationChange = (direction) => {
    setFilters((prev) => {
      const totalPages = pagination.totalPages || 1;
      const nextPage = direction === "next" ? prev.page + 1 : prev.page - 1;
      if (nextPage < 1 || nextPage > totalPages) {
        return prev;
      }
      const newFilters = { ...prev, page: nextPage };
      setTempFilters(newFilters);
      return newFilters;
    });
  };

  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomFieldChange = (index, field, value) => {
    setEditForm((prev) => {
      const rows = [...(prev.customFields || [])];
      rows[index] = {
        ...rows[index],
        [field]: value,
      };
      return { ...prev, customFields: rows };
    });
  };

  const handleAddCustomField = () => {
    setEditForm((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { key: "", value: "" }],
    }));
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Expenditure Code",
      "Month",
      "Year",
      "Staff Salary",
      "Rent",
      "Power Bill",
      "Maintenance",
      "Custom Fields Total",
      "Total"
    ];
    const dataToExport = displayExpenditures && displayExpenditures.length > 0 ? displayExpenditures : [];
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        const customFieldsTotal = totalCustomFieldsAmount(item.customFields);
        const total = totalRecordExpenditure(item);
        arr.push({
          "S.No": x++,
          "Expenditure Code": item.expenditureCode || '-',
          "Month": monthLabel(item.month) || '-',
          "Year": item.year || '-',
          "Staff Salary": formatCurrency(item.staffSalary || 0),
          "Rent": formatCurrency(item.rent || 0),
          "Power Bill": formatCurrency(item.powerBill || 0),
          "Maintenance": formatCurrency(item.maintenance || 0),
          "Custom Fields Total": formatCurrency(customFieldsTotal),
          "Total": formatCurrency(total)
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Store_Expenditures");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "StoreExpenditures");
    } else {
      showError("Table is Empty");
    }
  };

  // Memoized filtered expenditures for header search
  const displayExpenditures = useMemo(() => {
    let filtered = expenditures;

    if (headerSearchTerms.code) {
      filtered = filtered.filter(item => {
        const code = (item.expenditureCode || `EXP-${item.id}`).toLowerCase();
        return code.includes(headerSearchTerms.code.toLowerCase());
      });
    }

    if (headerSearchTerms.period) {
      filtered = filtered.filter(item => {
        const period = `${monthLabel(item.month)} ${item.year}`.toLowerCase();
        return period.includes(headerSearchTerms.period.toLowerCase());
      });
    }

    return filtered;
  }, [expenditures, headerSearchTerms]);

  const handleRemoveCustomField = (index) => {
    setEditForm((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateExpenditure = async (event) => {
    event.preventDefault();
    if (!storeId || !selectedExpenditureId) {
      showError("Select an expenditure before updating.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        staffSalary: Number(editForm.staffSalary || 0),
        rent: Number(editForm.rent || 0),
        powerBill: Number(editForm.powerBill || 0),
        maintenance: Number(editForm.maintenance || 0),
        customFields: convertRowsToCustomFields(editForm.customFields),
      };
      
      const res = await storeService.updateStoreExpenditure(storeId, selectedExpenditureId, payload);
      const updatedData = res.data || res.expenditure || res;
      
      if (updatedData && updatedData.id) {
        const mappedData = {
          id: updatedData.id,
          expenditureCode: updatedData.expenditureCode || updatedData.code || `EXP-${updatedData.id}`,
          month: updatedData.month || selectedExpenditure.month,
          year: updatedData.year || selectedExpenditure.year,
          staffSalary: parseFloat(updatedData.staffSalary || 0),
          rent: parseFloat(updatedData.rent || 0),
          powerBill: parseFloat(updatedData.powerBill || 0),
          maintenance: parseFloat(updatedData.maintenance || 0),
          customFields: updatedData.customFields || {},
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt
        };
        
        setSelectedExpenditure(mappedData);
        showSuccess(res.message || "Store expenditure updated successfully.");
        await fetchExpenditures();
      } else {
        showSuccess("Store expenditure updated successfully.");
        await fetchExpenditures();
      }
    } catch (err) {
      console.error("Failed to update expenditure", err);
      showError(err.response?.data?.message || err.message || "Failed to update expenditure");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpenditure = async () => {
    if (!storeId || !selectedExpenditureId) return;
    const confirmed = window.confirm("Delete this expenditure record? This action cannot be undone.");
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await storeService.deleteStoreExpenditure(storeId, selectedExpenditureId);
      
      showSuccess(res.message || "Store expenditure deleted successfully.");
      setSelectedExpenditureId(null);
      setSelectedExpenditure(null);
      setEditForm(getInitialFormState());
      await fetchExpenditures();
    } catch (err) {
      console.error("Failed to delete expenditure", err);
      showError(err.response?.data?.message || err.message || "Failed to delete expenditure");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInputChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCustomFieldChange = (index, field, value) => {
    setCreateForm((prev) => {
      const rows = [...(prev.customFields || [])];
      rows[index] = {
        ...rows[index],
        [field]: value,
      };
      return { ...prev, customFields: rows };
    });
  };

  const handleAddCreateCustomField = () => {
    setCreateForm((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { key: "", value: "" }],
    }));
  };

  const handleRemoveCreateCustomField = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateExpenditure = async (event) => {
    event.preventDefault();
    if (!storeId) {
      showError("Store information missing.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        storeId: storeId,
        month: createForm.month,
        year: createForm.year,
        staffSalary: Number(createForm.staffSalary || 0),
        rent: Number(createForm.rent || 0),
        powerBill: Number(createForm.powerBill || 0),
        maintenance: Number(createForm.maintenance || 0),
        customFields: convertRowsToCustomFields(createForm.customFields),
      };
      
      const res = await storeService.createStoreExpenditure(payload);
      
      showSuccess(res.message || "Store expenditure created successfully.");
      setShowCreateForm(false);
      setCreateForm({
        month: DEFAULT_FILTERS.month,
        year: DEFAULT_FILTERS.year,
        staffSalary: "",
        rent: "",
        powerBill: "",
        maintenance: "",
        customFields: [],
      });
      await fetchExpenditures();
    } catch (err) {
      console.error("Failed to create expenditure", err);
      showError(err.response?.data?.message || err.message || "Failed to create expenditure");
    } finally {
      setActionLoading(false);
    }
  };


  const closeErrorModal = () => setIsErrorModalOpen(false);
  const closeSuccessModal = () => setIsSuccessModalOpen(false);

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Store Expenditures</h2>
          <p className="path">
            Expenditures
          </p>
        </div>
      </div>

      {!storeId && (
        <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`} style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontFamily: "Poppins" }}>Store information missing. Please re-login to continue.</p>
        </div>
      )}

      {storeId && (
        <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`}>
          <div className={`row g-3 ${styles.filtersRow}`} style={{ padding: "0 15px" }}>
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent" style={{ position: "relative" }}>
              <label>Month(s):</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={monthSearchTerm}
                  onChange={(e) => {
                    setMonthSearchTerm(e.target.value);
                    setShowMonthDropdown(true);
                  }}
                  onFocus={() => setShowMonthDropdown(true)}
                  onBlur={() => setTimeout(() => {
                    setShowMonthDropdown(false);
                    if (monthSearchTerm === "") {
                      setMonthSearchTerm("");
                    }
                  }, 200)}
                  placeholder={tempFilters.months.length > 0 ? `${tempFilters.months.length} month(s) selected` : "Select or Type"}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    height: '32px',
                    outline: '1.5px solid var(--primary-color)',
                    padding: '2px 10px',
                    borderRadius: '16px',
                    boxShadow: '2px 2px 4px #333',
                    fontFamily: 'Poppins',
                    fontSize: '13px',
                    border: 'none',
                    backgroundColor: 'white'
                  }}
                />
                {showMonthDropdown && (
                  <ul
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      zIndex: 1000,
                      background: "white",
                      width: "100%",
                      maxHeight: "200px",
                      overflowY: "auto",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      padding: "4px 0",
                      margin: "4px 0 0 0",
                      listStyle: "none",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    {MONTH_OPTIONS.filter(option => 
                      option.label.toLowerCase().includes(monthSearchTerm.toLowerCase())
                    ).map((option) => {
                      const isSelected = tempFilters.months.includes(option.value);
                      return (
                        <li
                          key={option.value}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            const newMonths = isSelected
                              ? tempFilters.months.filter(m => m !== option.value)
                              : [...tempFilters.months, option.value];
                            handleFilterChange("months", newMonths);
                            setMonthSearchTerm("");
                          }}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: "Poppins",
                            backgroundColor: isSelected ? "var(--primary-color)" : "transparent",
                            color: isSelected ? "#fff" : "#334155",
                          }}
                        >
                          {option.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {tempFilters.months && tempFilters.months.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                  {tempFilters.months.map((m) => (
                    <span
                      key={m}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "#e2e8f0",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "Poppins",
                      }}
                    >
                      {MONTH_OPTIONS.find((opt) => opt.value === m)?.label}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          const newMonths = tempFilters.months.filter((val) => val !== m);
                          handleFilterChange("months", newMonths);
                        }}
                        style={{
                          marginLeft: "6px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          color: "#ef4444",
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
              <label>Year:</label>
              <input
                type="number"
                value={tempFilters.year}
                onChange={(e) => handleFilterChange("year", Number(e.target.value) || DEFAULT_FILTERS.year)}
                style={{
                  width: "100%",
                  height: '32px',
                  outline: '1.5px solid var(--primary-color)',
                  padding: '2px 10px',
                  borderRadius: '16px',
                  boxShadow: '2px 2px 4px #333',
                  fontFamily: 'Poppins',
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: 'white'
                }}
              />
            </div>
            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
              <label>Rows per page:</label>
              <select 
                value={tempFilters.limit} 
                onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                style={{
                  width: "100%",
                  height: '32px',
                  outline: '1.5px solid var(--primary-color)',
                  padding: '2px 10px',
                  borderRadius: '16px',
                  boxShadow: '2px 2px 4px #333',
                  fontFamily: 'Poppins',
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: 'white',
                  cursor: "pointer",
                }}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.buttonsRow}>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button className="submitbtn" onClick={onSubmit}>
                Submit
              </button>
              <button className="cancelbtn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Expenditure Register
              </h4>
              <button 
                className="homebtn" 
                type="button" 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{ background: showCreateForm ? "#f3f4f6" : undefined }}
              >
                {showCreateForm ? "Cancel" : "Create New"}
              </button>
            </div>

            <div className={styles.exportSection}>
              <div className={styles.exportButtons}>
                {expenditures.length > 0 && (
                  <>
                    <button className={inventoryStyles.xls} onClick={() => onExport("XLS")} style={{ padding: "6px 12px", height: "auto" }}>
                      <p>Export to </p>
                      <img src={xls} alt="" style={{ height: "20px" }} />
                    </button>
                    <button className={inventoryStyles.xls} onClick={() => onExport("PDF")} style={{ padding: "6px 12px", height: "auto" }}>
                      <p>Export to </p>
                      <img src={pdf} alt="" style={{ height: "20px" }} />
                    </button>
                  </>
                )}
              </div>
              <div style={{ fontFamily: "Poppins", color: "#6b7280", fontSize: "13px" }}>
                Showing page {pagination.page} of {pagination.totalPages || 1}
              </div>
            </div>

            <div className={`${styles.tableContainer} table-responsive`}>
              <table className="table table-bordered borderedtable table-sm table-hover" style={{ fontFamily: "Poppins" }}>
                <thead className="table-light">
                  <tr>
                    {renderSearchHeader("Code", "code", "data-code-header")}
                    {renderSearchHeader("Period", "period", "data-period-header")}
                    <th>Staff Salary</th>
                    <th>Rent</th>
                    <th>Power Bill</th>
                    <th>Maintenance</th>
                    <th>Custom Fields</th>
                    <th>Total</th>
                  </tr>
                  {(headerSearchTerms.code || headerSearchTerms.period) && (
                    <tr>
                      <td colSpan="8" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                        {displayExpenditures.length} expenditures found
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {displayExpenditures.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                        {listLoading ? "Loading expenditures..." : "No expenditures found for the selected period."}
                      </td>
                    </tr>
                  )}
                  {displayExpenditures.map((record) => {
                    const isSelected = record.id === selectedExpenditureId;
                    return (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedExpenditureId(record.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent",
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>{record.expenditureCode || `EXP-${record.id}`}</td>
                        <td>
                          {monthLabel(record.month)} {record.year}
                        </td>
                        <td>{formatCurrency(record.staffSalary)}</td>
                        <td>{formatCurrency(record.rent)}</td>
                        <td>{formatCurrency(record.powerBill)}</td>
                        <td>{formatCurrency(record.maintenance)}</td>
                        <td>{renderCustomFieldList(record.customFields)}</td>
                        <td>{formatCurrency(totalRecordExpenditure(record))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {expenditures.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <p style={{ margin: 0, fontFamily: "Poppins", color: "#374151", fontSize: "14px" }}>
                  Total records: {pagination.total || expenditures.length}
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button className="cancelbtn" type="button" onClick={() => handlePaginationChange("prev")} disabled={filters.page === 1} style={{ padding: "4px 12px", fontSize: "14px" }}>
                    Previous
                  </button>
                  <button
                    className="homebtn"
                    type="button"
                    onClick={() => handlePaginationChange("next")}
                    disabled={filters.page >= (pagination.totalPages || 1)}
                    style={{ padding: "4px 12px", fontSize: "14px" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Expenditure Form */}
          {showCreateForm && (
            <div style={{ marginBottom: "24px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h4
                style={{
                  margin: 0,
                  marginBottom: "20px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Create New Expenditure
              </h4>
              <form onSubmit={handleCreateExpenditure}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label>Month</label>
                    <select
                      value={createForm.month}
                      onChange={(e) => handleCreateInputChange("month", Number(e.target.value))}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                        cursor: "pointer",
                      }}
                    >
                      {MONTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Year</label>
                    <input
                      type="number"
                      value={createForm.year}
                      onChange={(e) => handleCreateInputChange("year", Number(e.target.value) || DEFAULT_FILTERS.year)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Staff Salary (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.staffSalary}
                      onChange={(e) => handleCreateInputChange("staffSalary", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Rent (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.rent}
                      onChange={(e) => handleCreateInputChange("rent", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Power Bill (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.powerBill}
                      onChange={(e) => handleCreateInputChange("powerBill", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Maintenance (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.maintenance}
                      onChange={(e) => handleCreateInputChange("maintenance", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Notes</label>
                    <textarea
                      rows="2"
                      value={createForm.notes || ""}
                      onChange={(e) => handleCreateInputChange("notes", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h5 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600 }}>Custom Fields</h5>
                    <button type="button" className="homebtn" onClick={handleAddCreateCustomField}>
                      Add Field
                    </button>
                  </div>
                  {(createForm.customFields || []).length === 0 && (
                    <p style={{ fontFamily: "Poppins", color: "#6b7280", margin: 0 }}>No custom fields added.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(createForm.customFields || []).map((row, index) => (
                      <div
                        key={`create-${row.key}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Field name"
                          value={row.key}
                          onChange={(e) => handleCreateCustomFieldChange(index, "key", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #000",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontFamily: "Poppins",
                            backgroundColor: "#fff",
                            color: "#000",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={row.value}
                          onChange={(e) => handleCreateCustomFieldChange(index, "value", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #000",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontFamily: "Poppins",
                            backgroundColor: "#fff",
                            color: "#000",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCreateCustomField(index)}
                          style={{
                            border: "1px solid #ef4444",
                            background: "transparent",
                            color: "#ef4444",
                            borderRadius: "6px",
                            padding: "6px 12px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button className="homebtn" type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating..." : "Create Expenditure"}
                  </button>
                  <button
                    className="homebtn"
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateForm({
                        month: DEFAULT_FILTERS.month,
                        year: DEFAULT_FILTERS.year,
                        staffSalary: "",
                        rent: "",
                        powerBill: "",
                        maintenance: "",
                        customFields: [],
                      });
                    }}
                    style={{ background: "#f3f4f6", color: "#2563eb" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Expenditure Details - Only show when a row is selected */}
          {selectedExpenditure && (
            <div style={{ marginTop: "24px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Expenditure #{selectedExpenditure.expenditureCode || selectedExpenditure.id}
                </h4>
                <span style={{ fontFamily: "Poppins", color: "#6b7280" }}>
                  {monthLabel(selectedExpenditure.month)} {selectedExpenditure.year}
                </span>
              </div>

              {detailLoading ? (
                <p style={{ fontFamily: "Poppins", margin: 0 }}>Loading expenditure details...</p>
              ) : (
              <form onSubmit={handleUpdateExpenditure}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label>Staff Salary (₹)</label>
                    <input
                      type="number"
                      value={editForm.staffSalary}
                      onChange={(e) => handleEditInputChange("staffSalary", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Rent (₹)</label>
                    <input 
                      type="number" 
                      value={editForm.rent} 
                      onChange={(e) => handleEditInputChange("rent", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Power Bill (₹)</label>
                    <input
                      type="number"
                      value={editForm.powerBill}
                      onChange={(e) => handleEditInputChange("powerBill", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Maintenance (₹)</label>
                    <input
                      type="number"
                      value={editForm.maintenance}
                      onChange={(e) => handleEditInputChange("maintenance", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h5 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600 }}>Custom Fields</h5>
                    <button type="button" className="homebtn" onClick={handleAddCustomField}>
                      Add Field
                    </button>
                  </div>
                  {(editForm.customFields || []).length === 0 && (
                    <p style={{ fontFamily: "Poppins", color: "#6b7280", margin: 0 }}>No custom fields added.</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(editForm.customFields || []).map((row, index) => (
                      <div
                        key={`${row.key}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Field name"
                          value={row.key}
                          onChange={(e) => handleCustomFieldChange(index, "key", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #000",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontFamily: "Poppins",
                            backgroundColor: "#fff",
                            color: "#000",
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={row.value}
                          onChange={(e) => handleCustomFieldChange(index, "value", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #000",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontFamily: "Poppins",
                            backgroundColor: "#fff",
                            color: "#000",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(index)}
                          style={{
                            border: "1px solid #ef4444",
                            background: "transparent",
                            color: "#ef4444",
                            borderRadius: "6px",
                            padding: "6px 12px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button className="homebtn" type="submit" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="homebtn"
                    type="button"
                    onClick={handleDeleteExpenditure}
                    disabled={actionLoading}
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                  >
                    Delete
                  </button>
                  <button
                    className="homebtn"
                    type="button"
                    onClick={() => {
                      setSelectedExpenditureId(null);
                      setSelectedExpenditure(null);
                      setEditForm(getInitialFormState());
                    }}
                    disabled={actionLoading}
                    style={{ background: "#f3f4f6", color: "#374151" }}
                  >
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        </div>
      )}

      {(listLoading && expenditures.length === 0) && <Loading />}

      <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={closeErrorModal} />
      <SuccessModal isOpen={isSuccessModalOpen} message={successMessage} onClose={closeSuccessModal} />
    </div>
  );
}

export default StoreExpenditures;
