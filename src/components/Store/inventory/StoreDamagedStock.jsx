import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { Modal, Button } from "react-bootstrap";
import storeService from "../../../services/storeService";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

function StoreDamagedStock() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [damagedReports, setDamagedReports] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(""); // Empty for all, or "pending", "approved", etc.
  
  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    quantity: 0,
    damageReason: "",
    description: ""
  });

  const [products, setProducts] = useState([]);

  // Filtered data states
  const [filteredReports, setFilteredReports] = useState([]);

  // Search Visibility states
  const [showSearch, setShowSearch] = useState({
    reportCode: false,
    product: false,
    reason: false
  });

  // Search Term states
  const [searchTerms, setSearchTerms] = useState({
    reportCode: "",
    product: "",
    reason: ""
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

  // Get store ID from localStorage
  useEffect(() => {
    try {
      // Get store ID from multiple sources
      let id = null;
      
      // Try from selectedStore in localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          id = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }
      
      // Fallback to currentStoreId
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }
      
      // Fallback to user object
      if (!id) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        id = user?.storeId || user?.store?.id;
      }
      
      if (id) {
        setStoreId(id);
      } else {
        setError("Store information missing. Please re-login to continue.");
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      setError("Unable to determine store information. Please re-login.");
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
      fetchDamagedReports();
    }
  }, [storeId, page, limit, statusFilter]);

  const fetchProducts = async () => {
    if (!storeId) return;
    
    try {
      const res = await axiosAPI.get(`/stores/${storeId}/inventory`);
      if (res.data && res.data.inventory) {
        const productsList = res.data.inventory.map(item => ({
          id: item.product?.id || item.productId,
          name: item.product?.name || item.name,
          code: item.product?.SKU || item.SKU || item.productCode
        }));
        setProducts(productsList);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const fetchDamagedReports = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const res = await storeService.getStoreDamagedGoods(storeId, params);
      
      // Handle backend response format
      const reportsData = res.data || res.damagedGoods || res || [];
      const paginationData = res.pagination || {};
      
      // Map backend response to UI format
      const mappedReports = Array.isArray(reportsData) ? reportsData.map(report => ({
        id: report.id,
        reportCode: report.reportCode || `DAM${String(report.id).padStart(6, '0')}`,
        productId: report.productId,
        productName: report.product?.name || report.productName || "N/A",
        productSKU: report.product?.SKU || report.product?.sku || "N/A",
        quantity: report.quantity || 0,
        damageReason: report.damageReason || report.reason || "N/A",
        status: report.status || "pending",
        reportedBy: report.reportedByEmployee?.name || report.reportedBy || "N/A",
        reportedAt: report.createdAt || report.reportedAt || report.date,
        image: report.image || report.imageUrl || null
      })) : [];
      
      setDamagedReports(mappedReports);
      setTotal(paginationData.total || mappedReports.length);
      setTotalPages(paginationData.totalPages || Math.ceil((paginationData.total || mappedReports.length) / limit) || 1);
    } catch (err) {
      console.error('Error fetching damaged reports:', err);
      setError(err.response?.data?.message || err.message || "Error fetching damaged goods reports");
    } finally {
      setLoading(false);
    }
  };

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          reportCode: false,
          product: false,
          reason: false
        });
        setSearchTerms({
          reportCode: "",
          product: "",
          reason: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-search-header]')) {
        setShowSearch({
          reportCode: false,
          product: false,
          reason: false
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Filtering Logic
  useEffect(() => {
    let filtered = damagedReports;
    if (searchTerms.reportCode) {
      filtered = filtered.filter(item => 
        item.reportCode?.toLowerCase().includes(searchTerms.reportCode.toLowerCase())
      );
    }
    if (searchTerms.product) {
      filtered = filtered.filter(item => 
        item.productName?.toLowerCase().includes(searchTerms.product.toLowerCase()) ||
        item.productSKU?.toLowerCase().includes(searchTerms.product.toLowerCase())
      );
    }
    if (searchTerms.reason) {
      filtered = filtered.filter(item => 
        item.damageReason?.toLowerCase().includes(searchTerms.reason.toLowerCase())
      );
    }
    setFilteredReports(filtered);
  }, [damagedReports, searchTerms.reportCode, searchTerms.product, searchTerms.reason]);

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setFormData({
      ...formData,
      productId: productId,
      productName: product ? product.name : ""
    });
  };

  // File change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Image file:', imageFile);

    // Validation
    if (!formData.productId || formData.productId === '') {
      setError('Please select a product');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (!formData.damageReason || formData.damageReason.trim() === '') {
      setError('Please select a damage reason');
      return;
    }
    if (!formData.description || formData.description.trim() === '') {
      setError('Please enter a reason');
      return;
    }
    if (!imageFile) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const storeId = user.storeId || user.store?.id;

      if (!storeId) {
        setError("Store ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('storeId', storeId);
      formDataToSend.append('productId', formData.productId);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('damageReason', formData.damageReason);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('imageFile', imageFile); // Field name MUST be 'imageFile'

      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log('Field:', key, 'Value:', value);
      }

      // Use formData method from axiosAPI
      const response = await axiosAPI.formData(
        `/stores/${storeId}/damaged-goods`,
        formDataToSend
      );

      console.log('Success:', response.data);
      
      // Reset form and refresh reports
      setFormData({
        productId: "",
        productName: "",
        quantity: 0,
        damageReason: "",
        description: ""
      });
      setImageFile(null);
      setShowForm(false);
      fetchDamagedReports();
      
      alert("Damaged goods reported successfully!");
    } catch (err) {
      console.error('Error:', err.response?.data);
      setError(err?.response?.data?.message || err?.message || "Failed to report damaged goods");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const closeViewModal = () => {
    setShowDetailsModal(false);
    setSelectedReport(null);
  };

  const closeErrorModal = () => {
    setError(null);
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Report Code",
      "Product",
      "Quantity",
      "Damage Reason",
      "Status",
      "Reported By"
    ];
    const dataToExport = filteredReports.length > 0 ? filteredReports : (damagedReports || []);
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          "Date": item.reportedAt ? new Date(item.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : 'N/A',
          "Report Code": item.reportCode || '-',
          "Product": item.productName || '-',
          "Quantity": item.quantity || 0,
          "Damage Reason": item.damageReason || '-',
          "Status": item.status || 'pending',
          "Reported By": item.reportedBy || 'N/A'
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Damaged_Stock");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "DamagedStock");
    } else {
      setError("Table is Empty");
    }
  };

  const mockStats = {
    thisWeek: damagedReports.filter(r => {
      const reportDate = new Date(r.reportedAt || r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length,
    thisMonth: damagedReports.filter(r => {
      const reportDate = new Date(r.reportedAt || r.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return reportDate >= monthAgo;
    }).length,
    totalValue: damagedReports.reduce((sum, r) => sum + (r.estimatedValue || 0), 0),
    pendingReports: damagedReports.filter(r => r.status === 'pending').length
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Damaged Stock</h2>
        {/* Breadcrumb Navigation */}
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i class="bi bi-chevron-right"></i> Damaged Stock
        </p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div className="col" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="homebtn"
            onClick={() => setShowForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1' }}
          >
            Report Damaged Stock
          </button>
        </div>
      </div>

      {/* Report Form Modal */}
      <style>{`
        .store-damaged-modal .modal-content {
          background-color: var(--primary-light) !important;
          border: none !important;
          border-radius: 8px !important;
        }
        .store-damaged-modal .modal-header {
          background-color: var(--primary-light) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
        }
        .store-damaged-modal .modal-body {
          background-color: var(--primary-light) !important;
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        .store-damaged-modal .inputcolumn-mdl {
          width: 460px !important;
          display: flex !important;
          align-items: center !important;
          margin-bottom: 10px !important;
        }
        .store-damaged-modal .inputcolumn-mdl label {
          width: 180px !important;
          text-align: right !important;
          padding-right: 20px !important;
          margin-bottom: 0 !important;
          flex-shrink: 0 !important;
        }
        .store-damaged-modal .inputcolumn-mdl input,
        .store-damaged-modal .inputcolumn-mdl select {
          width: 240px !important;
          flex: 0 0 240px !important;
          height: 24px !important;
        }
        .store-damaged-modal .inputcolumn-mdl textarea {
          width: 240px !important;
          flex: 0 0 240px !important;
          height: 80px !important;
          margin-left: 0 !important;
        }
        .store-damaged-modal .inputcolumn-mdl input[type="file"] {
          width: 240px !important;
          flex: 0 0 240px !important;
        }
      `}</style>
      <Modal 
        show={showForm} 
        onHide={() => {
          setShowForm(false);
          setError(null);
          // Reset form on close
          setFormData({
            productId: "",
            productName: "",
            quantity: 0,
            damageReason: "",
            description: ""
          });
          setImageFile(null);
        }} 
        size="md" 
        centered
        dialogClassName="store-damaged-modal"
        contentClassName="mdl"
      >
        <Modal.Header closeButton style={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          backgroundColor: 'var(--primary-light)',
          padding: '20px'
        }}>
          <Modal.Title className="mdl-title" style={{ 
            fontFamily: 'Poppins',
            color: 'black',
            fontSize: '24px',
            fontWeight: 500,
            paddingTop: '10px',
            marginBottom: '20px'
          }}>
            Report Damaged Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          padding: '20px',
          backgroundColor: 'var(--primary-light)'
        }}>
          {error && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#fee', 
              border: '1px solid #fcc', 
              borderRadius: '4px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} id="damaged-stock-form">
            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Product: <span style={{color: 'red'}}>*</span></label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Quantity: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Damage Reason: <span style={{color: 'red'}}>*</span></label>
                <select
                  value={formData.damageReason}
                  onChange={(e) => setFormData({ ...formData, damageReason: e.target.value })}
                  required
                >
                  <option value="">Select reason</option>
                  <option value="Expired">Expired</option>
                  <option value="Damaged Package">Damaged Package</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Reason: <span style={{color: 'red'}}>*</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the reason for damage..."
                  rows="3"
                  required
                />
              </div>
            </div>

            {/* Image File Input */}
            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Image File (Required): <span style={{color: 'red'}}>*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  style={{ display: 'block', marginTop: '5px' }}
                />
                {imageFile && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    ✅ Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            <div className="row justify-content-center p-3">
              <div className="col-5" style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  type="submit" 
                  className="submitbtn" 
                  disabled={loading}
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    // Let the form's onSubmit handle it, but ensure it works
                    const form = document.getElementById('damaged-stock-form');
                    if (form && !form.checkValidity()) {
                      form.reportValidity();
                      e.preventDefault();
                      return false;
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button 
                  type="button" 
                  className="cancelbtn"
                  disabled={loading}
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                    // Reset form on cancel
                    setFormData({
                      productId: "",
                      productName: "",
                      quantity: 0,
                      damageReason: "",
                      description: ""
                    });
                    setImageFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Export buttons */}
      {damagedReports.length > 0 && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-5">
            <button className={inventoryStyles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={inventoryStyles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports Table */}
      <div className={styles.orderStatusCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Damage Reports
          </h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ marginRight: '8px', fontFamily: 'Poppins', fontSize: '14px' }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset to first page when filter changes
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'Poppins' }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ marginRight: '8px', fontFamily: 'Poppins', fontSize: '14px' }}>Per Page:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1); // Reset to first page when limit changes
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'Poppins' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered borderedtable" style={{ fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Date</th>
                {renderSearchHeader("Report Code", "reportCode", "data-report-code")}
                {renderSearchHeader("Product", "product", "data-product")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Quantity</th>
                {renderSearchHeader("Damage Reason", "reason", "data-reason")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(searchTerms.reportCode || searchTerms.product || searchTerms.reason) && (
                <tr>
                  <td colSpan={7} style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {filteredReports.length} reports found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '20px' }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, i) => (
                  <tr key={report.id || i}>
                    <td>
                      {report.reportedAt 
                        ? new Date(report.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : 'N/A'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{report.reportCode}</td>
                    <td>
                      {report.productName}
                      {report.productSKU && <span style={{ color: '#666', fontSize: '12px', marginLeft: '4px' }}>({report.productSKU})</span>}
                    </td>
                    <td>{report.quantity}</td>
                    <td>{report.damageReason}</td>
                    <td>
                      <span className={`badge ${
                        report.status === 'approved' ? 'bg-success' :
                        report.status === 'rejected' ? 'bg-danger' :
                        'bg-warning text-dark'
                      }`}>
                        {report.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openViewModal(report)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '20px' }}>
                    No Damaged Goods Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontFamily: 'Poppins', color: '#666', fontSize: '14px' }}>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} reports
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                style={{ fontFamily: 'Poppins' }}
              >
                <FaArrowLeftLong style={{ marginRight: '4px' }} />
                Previous
              </button>
              <span style={{ fontFamily: 'Poppins', padding: '0 12px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loading}
                style={{ fontFamily: 'Poppins' }}
              >
                Next
                <FaArrowRightLong style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}

      {/* View Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Damage Report Details</h5>
                <button type="button" className="btn-close" onClick={closeViewModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Report Code:</strong></div>
                  <div className="col-8">{selectedReport.reportCode || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Product:</strong></div>
                  <div className="col-8">
                    {selectedReport.productName || 'N/A'}
                    {selectedReport.productSKU && <span style={{ color: '#666', marginLeft: '8px' }}>({selectedReport.productSKU})</span>}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Quantity:</strong></div>
                  <div className="col-8">{selectedReport.quantity || '0'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Damage Reason:</strong></div>
                  <div className="col-8">{selectedReport.damageReason || selectedReport.reason || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Status:</strong></div>
                  <div className="col-8">
                    <span className={`badge ${
                      selectedReport.status === 'approved' ? 'bg-success' :
                      selectedReport.status === 'rejected' ? 'bg-danger' :
                      'bg-warning text-dark'
                    }`}>
                      {selectedReport.status || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Reported By:</strong></div>
                  <div className="col-8">{selectedReport.reportedBy || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Reported At:</strong></div>
                  <div className="col-8">
                    {selectedReport.reportedAt 
                      ? new Date(selectedReport.reportedAt).toLocaleString("en-IN")
                      : 'N/A'}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Image:</strong></div>
                  <div className="col-8">
                    {selectedReport.image ? (
                      <img 
                        src={selectedReport.image} 
                        alt="Damage report" 
                        style={{ 
                          width: '200px', 
                          height: '200px', 
                          objectFit: 'cover', 
                          borderRadius: '6px', 
                          border: '1px solid #eee' 
                        }} 
                      />
                    ) : (
                      <span className="text-muted">No image available</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeViewModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {loading && <Loading />}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}
    </div>
  );
}

export default StoreDamagedStock;

