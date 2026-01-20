import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";
import LoadingAnimation from "@/components/LoadingAnimation";
import ErrorModal from "@/components/ErrorModal";
import inventoryAni from "../../../images/animations/fetchingAnimation.gif";
import styles from "./Inventory.module.css";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-logo.jpg";
import pdf from "../../../images/pdf.jpg.jpg";

function CurrentStock({ navigate }) {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [filteredStock, setFilteredStock] = useState([]);
  const [limit, setLimit] = useState(10);

  // Add search state variables for searchable fields
  const [productNameSearchTerm, setProductNameSearchTerm] = useState("");
  const [showProductNameSearch, setShowProductNameSearch] = useState(false);
  const [productCodeSearchTerm, setProductCodeSearchTerm] = useState("");
  const [showProductCodeSearch, setShowProductCodeSearch] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
  const [showWarehouseSearch, setShowWarehouseSearch] = useState(false);

  // Add debugging logs
  useEffect(() => {
    console.log('CurrentStock - Component mounted');
    console.log('CurrentStock - Initial state:', {
      selectedDivision,
      showAllDivisions,
      user: !!user
    });
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    console.log('CurrentStock - User data loaded:', userData);
    
    // Fetch warehouses and current stock
    fetchWarehouses();
    // Also fetch current stock immediately
    fetchCurrentStock();
  }, []);

  useEffect(() => {
    // Refetch stock when warehouse selection changes
    if (warehouses.length > 0) {
      console.log('CurrentStock - Warehouse changed, refetching stock');
      fetchCurrentStock();
    }
  }, [selectedWarehouse]);

  // Monitor division changes and refetch data when division changes
  useEffect(() => {
    console.log('CurrentStock - Division changed:', {
      selectedDivision,
      divisionId: selectedDivision?.id,
      showAllDivisions
    });
    
    const divisionId = selectedDivision?.id;
    if (divisionId) {
      console.log('CurrentStock - Fetching stock for division:', divisionId);
      fetchCurrentStock();
    } else if (showAllDivisions) {
      console.log('CurrentStock - Showing all divisions, fetching stock');
      fetchCurrentStock();
    } else {
      console.log('CurrentStock - No division ID available, clearing stock');
      setCurrentStock([]);
      setWarehouses([]);
    }
  }, [selectedDivision?.id, showAllDivisions]);

  // Add a fallback effect to fetch data if no division is selected after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedDivision?.id && !showAllDivisions && currentStock.length === 0) {
        console.log('CurrentStock - No division selected after delay, trying to fetch data anyway');
        fetchCurrentStock();
      }
    }, 3000); // Wait 3 seconds before trying to fetch without division

    return () => clearTimeout(timer);
  }, [selectedDivision?.id, showAllDivisions, currentStock.length]);

  // Filter stock based on warehouse selection and search terms
  useEffect(() => {
    let filtered = currentStock;
    
    // Filter by warehouse
    if (selectedWarehouse !== "all") {
      const selectedWarehouseName = warehouses.find(w => w.id == selectedWarehouse)?.name;
      if (selectedWarehouseName) {
        filtered = filtered.filter(item => 
          item.warehouseName === selectedWarehouseName
        );
      }
    }
    
    // Filter by Product Name search
    if (productNameSearchTerm) {
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(productNameSearchTerm.toLowerCase())
      );
    }
    
    // Filter by Product Code search
    if (productCodeSearchTerm) {
      filtered = filtered.filter(item => 
        item.productCode.toLowerCase().includes(productCodeSearchTerm.toLowerCase())
      );
    }
    
    // Filter by Warehouse search
    if (warehouseSearchTerm) {
      filtered = filtered.filter(item => 
        item.warehouseName.toLowerCase().includes(warehouseSearchTerm.toLowerCase())
      );
    }
    
    setFilteredStock(filtered);
    console.log('CurrentStock - Stock filtered:', {
      originalCount: currentStock.length,
      filteredCount: filtered.length,
      selectedWarehouse,
      productNameSearchTerm,
      productCodeSearchTerm,
      warehouseSearchTerm
    });
  }, [currentStock, selectedWarehouse, warehouses, productNameSearchTerm, productCodeSearchTerm, warehouseSearchTerm]);

  // Add ESC key functionality to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showProductNameSearch) {
          setShowProductNameSearch(false);
          setProductNameSearchTerm("");
        }
        if (showProductCodeSearch) {
          setShowProductCodeSearch(false);
          setProductCodeSearchTerm("");
        }
        if (showWarehouseSearch) {
          setShowWarehouseSearch(false);
          setWarehouseSearchTerm("");
        }
      }
    };

    if (showProductNameSearch || showProductCodeSearch || showWarehouseSearch) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showProductNameSearch, showProductCodeSearch, showWarehouseSearch]);

  // Add click outside functionality to exit search mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any of the search headers
      const productNameHeader = document.querySelector('[data-productname-header]');
      const productCodeHeader = document.querySelector('[data-productcode-header]');
      const warehouseHeader = document.querySelector('[data-warehouse-header]');
      
      if (showProductNameSearch && productNameHeader && !productNameHeader.contains(event.target)) {
        setShowProductNameSearch(false);
        setProductNameSearchTerm("");
      }
      
      if (showProductCodeSearch && productCodeHeader && !productCodeHeader.contains(event.target)) {
        setShowProductCodeSearch(false);
        setProductCodeSearchTerm("");
      }
      
      if (showWarehouseSearch && warehouseHeader && !warehouseHeader.contains(event.target)) {
        setShowWarehouseSearch(false);
        setWarehouseSearchTerm("");
      }
    };

    if (showProductNameSearch || showProductCodeSearch || showWarehouseSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductNameSearch, showProductCodeSearch, showWarehouseSearch]);

  const fetchWarehouses = async () => {
    try {
      console.log('CurrentStock - Fetching warehouses...');
      // Get warehouses from the inventory response instead of separate API call
      // This ensures we have the exact warehouses that have stock data
      const userData = JSON.parse(localStorage.getItem("user"));
      const roles = userData?.roles || [];
      
      // We'll get warehouses from the inventory response
      // For now, set an empty array and populate it after fetching inventory
      setWarehouses([]);
    } catch (err) {
      console.error("CurrentStock - Error fetching warehouses:", err);
      setError("Failed to load warehouses");
    }
  };

  const fetchCurrentStock = async () => {
    try {
      console.log('CurrentStock - Starting fetchCurrentStock...');
      setLoading(true);
      setError(null);
      
      // Check if API URL is available
      const apiUrl = import.meta.env.VITE_API_URL;
      console.log('CurrentStock - API URL:', apiUrl);
      
      if (!apiUrl) {
        const errorMsg = "API URL is not configured. Please check your environment variables.";
        console.error('CurrentStock -', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // Get division ID from division context for proper filtering
      const divisionId = selectedDivision?.id;
      
      console.log('CurrentStock - Division check:', {
        divisionId,
        selectedDivision,
        showAllDivisions,
        hasDivision: !!divisionId
      });
      
      // Wait for division to be available, but don't block if it's taking too long
      if (!divisionId && !showAllDivisions) {
        console.log('CurrentStock - No division ID and not showing all divisions, but will try to fetch anyway');
        // Don't return immediately, try to fetch anyway
      }
      
      const userData = JSON.parse(localStorage.getItem("user"));
      const roles = userData?.roles || [];
      
      console.log('CurrentStock - User roles:', roles);
      
      // Use the correct inventory endpoint - try working endpoints first
      let endpoint = "/dashboard/inventory"; // Use the working endpoint from InventoryHome
      const params = {};
      
      // Use proper division filtering logic
      if (showAllDivisions) {
        params.showAllDivisions = 'true';
        console.log('CurrentStock - Showing all divisions');
      } else if (divisionId && divisionId !== 'all') {
        params.divisionId = divisionId;
        console.log('CurrentStock - Using specific division:', divisionId);
      } else {
        console.log('CurrentStock - No specific division, will try to fetch all');
        // Try to fetch without division filter
        params.showAllDivisions = 'true';
      }
      
      const isAdmin = roles.includes("Admin") || roles.includes("Super Admin");
      console.log('CurrentStock - Is admin:', isAdmin);
      
      if (!isAdmin) {
        // Non-admin users get stock based on their role access
        // They can only see warehouses they have access to
        if (selectedWarehouse !== "all") {
          params.warehouseId = selectedWarehouse;
        }
      } else {
        // Admin users can see all warehouses
        if (selectedWarehouse !== "all") {
          params.warehouseId = selectedWarehouse;
        }
      }
      
      console.log('CurrentStock - API call params:', params);
      console.log('CurrentStock - Full API URL will be:', `${apiUrl}${endpoint}`);
      
      let res;
      try {
        // Try the working dashboard endpoint first
        console.log('CurrentStock - Trying dashboard endpoint:', endpoint);
        res = await axiosAPI.get(endpoint, { params });
        console.log('CurrentStock - Dashboard endpoint response:', res.data);
      } catch (mainError) {
        console.log('CurrentStock - Dashboard endpoint failed, trying inventory endpoints...');
        console.log('CurrentStock - Main error:', mainError.message);
        // Try inventory-specific endpoints
        const fallbackEndpoints = [
          "/warehouse/inventory/current",
          "/warehouse/inventory",
          "/inventory/stock",
          "/stock/current",
          "/products/stock"
        ];
        
        for (const fallbackEndpoint of fallbackEndpoints) {
          try {
            console.log('CurrentStock - Trying fallback endpoint:', fallbackEndpoint);
            res = await axiosAPI.get(fallbackEndpoint, { params });
            console.log('CurrentStock - Fallback endpoint success:', fallbackEndpoint, res.data);
            break; // Success, exit loop
          } catch (fallbackError) {
            console.log('CurrentStock - Fallback endpoint failed:', fallbackEndpoint, fallbackError.message);
            continue; // Try next endpoint
          }
        }
        
        // If all fallbacks failed, throw the original error
        if (!res) {
          console.error('CurrentStock - All endpoints failed');
          throw mainError;
        }
      }
      
      // Transform the data to show current stock using the correct backend structure
      if (res.data && res.data.inventory) {
        const inventoryData = res.data.inventory;
        console.log('CurrentStock - Processing inventory data:', inventoryData);
        
        let transformedStock = [];
        
        if (Array.isArray(inventoryData) && inventoryData.length > 0) {
          // Transform the inventory data to match the table structure
          transformedStock = inventoryData.map((item, index) => {
            const transformed = {
              id: item.id || index,
              productName: item.product?.name || item.name || "N/A",
              productCode: item.product?.SKU || item.SKU || item.productCode || "N/A",
              warehouseName: item.warehouse?.name || item.warehouseName || "N/A",
              currentStock: parseFloat(item.stockQuantity || item.quantity || item.currentStock) || 0,
              unit: item.product?.unit || item.unit || "kg",
              unitPrice: parseFloat(item.product?.basePrice || item.basePrice || item.unitPrice) || 0,
              stockValue: parseFloat(item.stockValue || (item.stockQuantity * item.product?.basePrice) || 0) || 0,
              isLowStock: item.isLowStock || false,
              stockStatus: item.stockStatus || "normal",
              lastUpdated: item.lastUpdated || item.updatedAt || new Date().toISOString(),
              productType: item.product?.productType || item.productType || "unknown"
            };
            
            return transformed;
          });
          
          console.log('CurrentStock - Transformed stock data:', transformedStock);
          
          // Extract unique warehouses from the inventory data
          const uniqueWarehouses = [];
          const warehouseMap = new Map();
          
          inventoryData.forEach(item => {
            if (item.warehouse && item.warehouse.id && !warehouseMap.has(item.warehouse.id)) {
              warehouseMap.set(item.warehouse.id, item.warehouse);
              uniqueWarehouses.push({
                id: item.warehouse.id,
                name: item.warehouse.name
              });
            }
          });
          
          console.log('CurrentStock - Extracted warehouses:', uniqueWarehouses);
          
          // Update warehouses state with the actual warehouses from inventory
          setWarehouses(uniqueWarehouses);
        } else {
          // No data found for this division
          console.log('CurrentStock - No inventory data found');
          setCurrentStock([]);
          setWarehouses([]);
          setError(`No inventory data found for the selected division`);
        }
        
        setCurrentStock(transformedStock);
      } else if (res.data && res.data.data) {
        // Handle case where data is nested under 'data' key
        console.log('CurrentStock - Data found under data key:', res.data.data);
        const inventoryData = res.data.data;
        
        if (Array.isArray(inventoryData) && inventoryData.length > 0) {
          const transformedStock = inventoryData.map((item, index) => ({
            id: item.id || index,
            productName: item.productName || item.product?.name || item.name || "N/A",
            productCode: item.productCode || item.product?.SKU || item.SKU || "N/A",
            warehouseName: item.warehouseName || item.warehouse?.name || "N/A",
            currentStock: parseFloat(item.currentStock || item.stockQuantity || item.quantity) || 0,
            unit: item.unit || item.product?.unit || "kg",
            unitPrice: parseFloat(item.unitPrice || item.product?.basePrice || item.basePrice) || 0,
            stockValue: parseFloat(item.stockValue || (item.currentStock * item.unitPrice)) || 0,
            isLowStock: item.isLowStock || false,
            stockStatus: item.stockStatus || "normal",
            lastUpdated: item.lastUpdated || item.updatedAt || new Date().toISOString(),
            productType: item.productType || item.product?.productType || "unknown"
          }));
          
          setCurrentStock(transformedStock);
          
          // Extract warehouses
          const uniqueWarehouses = [];
          const warehouseMap = new Map();
          
          inventoryData.forEach(item => {
            const warehouseName = item.warehouseName || item.warehouse?.name;
            if (warehouseName && !warehouseMap.has(warehouseName)) {
              warehouseMap.set(warehouseName, true);
              uniqueWarehouses.push({
                id: uniqueWarehouses.length + 1,
                name: warehouseName
              });
            }
          });
          
          setWarehouses(uniqueWarehouses);
        } else {
          setCurrentStock([]);
          setWarehouses([]);
          setError("No inventory data found");
        }
      } else if (res.data && res.data.stockByWarehouse) {
        // Handle dashboard inventory data structure
        console.log('CurrentStock - Processing dashboard inventory data:', res.data);
        const dashboardData = res.data;
        
        // Transform dashboard data to stock format
        let transformedStock = [];
        
        if (dashboardData.stockByWarehouse && Array.isArray(dashboardData.stockByWarehouse)) {
          transformedStock = dashboardData.stockByWarehouse.map((item, index) => ({
            id: index,
            productName: item.warehouse || "N/A",
            productCode: `WH-${index + 1}`,
            warehouseName: item.warehouse || "N/A",
            currentStock: parseFloat(item.stock || 0),
            unit: "units",
            unitPrice: 0,
            stockValue: 0,
            isLowStock: false,
            stockStatus: "normal",
            lastUpdated: new Date().toISOString(),
            productType: "warehouse"
          }));
          
          // Extract warehouses
          const uniqueWarehouses = dashboardData.stockByWarehouse.map((item, index) => ({
            id: index + 1,
            name: item.warehouse || `Warehouse ${index + 1}`
          }));
          
          setCurrentStock(transformedStock);
          setWarehouses(uniqueWarehouses);
        } else {
          setCurrentStock([]);
          setWarehouses([]);
          setError("No stock data found in dashboard response");
        }
      } else {
        console.log('CurrentStock - No inventory data in response structure:', res.data);
        setError("No inventory data in response");
        setCurrentStock([]);
        setWarehouses([]);
      }
    } catch (err) {
      console.error('CurrentStock - Error in fetchCurrentStock:', err);
      console.error('CurrentStock - Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      
      setError(err?.response?.data?.message || err?.message || "Failed to load current stock");
      setCurrentStock([]);
      setWarehouses([]);
    } finally {
      setLoading(false);
      console.log('CurrentStock - fetchCurrentStock completed');
    }
  };

  const handleWarehouseChange = (e) => {
    setSelectedWarehouse(e.target.value);
  };

  const closeErrorModal = () => {
    setError(null);
  };

  const onExport = (type) => {
    if (filteredStock.length === 0) {
      setError("No data to export");
      return;
    }

    const columnsXLS = [
      "S.No",
      "Product Name",
      "Product Code",
      "Warehouse",
      "Current Stock",
      "Unit",
      "Unit Price",
      "Total Value",
      "Last Updated"
    ];

    const rows = filteredStock.map((item, index) => [
      index + 1,
      item.productName,
      item.productCode,
      item.warehouseName,
      item.currentStock,
      item.unit,
      `₹${item.unitPrice}`,
      `₹${item.stockValue.toLocaleString()}`,
      item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'
    ]);

    if (type === "XLS") {
      handleExportExcel(columnsXLS, rows, "Current Stock Report");
    } else if (type === "PDF") {
      handleExportPDF(columnsXLS, rows, "Current Stock Report");
    }
  };

  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("Super Admin");

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/inventory")}>Inventory</span>{" "}
        <i className="bi bi-chevron-right"></i> Current Stock
      </p>

      {/* Loading Animation */}
      {loading && <LoadingAnimation gif={inventoryAni} msg="Loading current stock..." />}

      {/* Show loading when waiting for division */}
      {!loading && !selectedDivision?.id && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-info">
                <strong>Please select a division to view current stock</strong>
                <br />
                <small>Waiting for division selection...</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}

      {!loading && selectedDivision?.id && (
        <div className="container-fluid">
          {/* Header */}
          <div className="row m-0 p-3">
            <div className="col">
              <h4 className="mb-3">Current Stock</h4>
              <p className="text-muted">
                {isAdmin 
                  ? "Showing all stock across the company" 
                  : "Showing stock based on your role access"
                }
              </p>
            </div>
          </div>

          {/* Show empty state when no data */}
          {currentStock.length === 0 && !error && (
            <div className="row m-0 p-3">
              <div className="col text-center">
                <div className="alert alert-warning">
                  <strong>No inventory data found</strong>
                  <br />
                  <small>There are no products in stock for the selected division.</small>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards - Only show when there's data */}
          {currentStock.length > 0 && (
            <>
              {/* First Row - 5 main cards */}
              <div className="row m-0 p-3 justify-content-center">
                <div className="col-md-2">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <h5 className="card-title">Total Products</h5>
                      <h3>{filteredStock.length}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <h5 className="card-title">In Stock</h5>
                      <h3>
                        {filteredStock.filter(item => item.currentStock > 0).length}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-warning text-white">
                    <div className="card-body">
                      <h5 className="card-title">Low Stock</h5>
                      <h3>
                        {filteredStock.filter(item => item.isLowStock).length}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-danger text-white">
                    <div className="card-body">
                      <h5 className="card-title">Out of Stock</h5>
                      <h3>
                        {filteredStock.filter(item => item.currentStock === 0).length}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <h5 className="card-title">Total Value</h5>
                      <h3>
                        ₹{(filteredStock.reduce((total, item) => total + item.stockValue, 0) / 100000).toFixed(2)}L
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row - 2 centered small horizontal cards */}
              <div className="row m-0 p-3 justify-content-center">
                <div className="col-md-3">
                  <div className="card bg-secondary text-white">
                    <div className="card-body text-center">
                      <h6 className="card-title mb-1">Packed Products</h6>
                      <h4 className="mb-0">
                        {filteredStock.filter(item => item.productType === "packed").length}
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-dark text-white">
                    <div className="card-body text-center">
                      <h6 className="card-title mb-1">Loose Products</h6>
                      <h4 className="mb-0">
                        {filteredStock.filter(item => item.productType === "loose").length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Search and Filter Section - Only show when there's data */}
          {currentStock.length > 0 && (
            <div className="row m-0 p-3">
              <div className="col-md-3">
                <label htmlFor="warehouseSelect" className="form-label">
                  Warehouse
                </label>
                <select
                  id="warehouseSelect"
                  className="form-select"
                  value={selectedWarehouse}
                  onChange={handleWarehouseChange}
                >
                  <option value="all">-- All Warehouses --</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name || warehouse.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button 
                  className="submitbtn me-2"
                  onClick={fetchCurrentStock}
                >
                  Submit
                </button>
                <button 
                  className="cancelbtn"
                  onClick={() => navigate('/inventory')}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          
          {/* Stock Table - Only show when there's data */}
          {currentStock.length > 0 && (
            <div className="row m-0 p-3 justify-content-around">

              <div className="col-lg-7">
                <button className={styles.xls} onClick={() => onExport("XLS")}>
                  <p>Export to </p>
                  <img src={xls} alt="" />
                </button>
                <button className={styles.xls} onClick={() => onExport("PDF")}>
                  <p>Export to </p>
                  <img src={pdf} alt="" />
                </button>
              </div>
              <div className={`col-lg-2 ${styles.entity}`}>
                <label htmlFor="">Entity :</label>
                <select
                  name=""
                  id=""
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="col-lg-10">
                <table className="table table-hover table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th 
                        onClick={() => setShowProductNameSearch(!showProductNameSearch)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        data-productname-header
                      >
                        {showProductNameSearch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Search by product name..."
                              value={productNameSearchTerm}
                              onChange={(e) => setProductNameSearchTerm(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '2px 6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '120px',
                                height: '28px',
                                color: '#000',
                                backgroundColor: '#fff'
                              }}
                              autoFocus
                            />
                            {productNameSearchTerm && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductNameSearchTerm("");
                                }}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #dc3545',
                                  borderRadius: '4px',
                                  background: '#dc3545',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  minWidth: '24px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            Product Name
                          </>
                        )}
                      </th>
                      <th 
                        onClick={() => setShowProductCodeSearch(!showProductCodeSearch)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        data-productcode-header
                      >
                        {showProductCodeSearch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Search by product code..."
                              value={productCodeSearchTerm}
                              onChange={(e) => setProductCodeSearchTerm(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '2px 6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '120px',
                                height: '28px',
                                color: '#000',
                                backgroundColor: '#fff'
                              }}
                              autoFocus
                            />
                            {productCodeSearchTerm && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductCodeSearchTerm("");
                                }}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #dc3545',
                                  borderRadius: '4px',
                                  background: '#dc3545',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  minWidth: '24px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            Product Code
                          </>
                        )}
                      </th>
                      <th 
                        onClick={() => setShowWarehouseSearch(!showWarehouseSearch)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        data-warehouse-header
                      >
                        {showWarehouseSearch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Search by warehouse..."
                              value={warehouseSearchTerm}
                              onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '2px 6px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '120px',
                                height: '28px',
                                color: '#000',
                                backgroundColor: '#fff'
                              }}
                              autoFocus
                            />
                            {warehouseSearchTerm && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWarehouseSearchTerm("");
                                }}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #dc3545',
                                  borderRadius: '4px',
                                  background: '#dc3545',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  minWidth: '24px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            Warehouse
                          </>
                        )}
                      </th>
                      <th>Current Stock</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                      <th>Last Updated</th>
                    </tr>
                    {(showProductNameSearch && productNameSearchTerm) || (showProductCodeSearch && productCodeSearchTerm) || (showWarehouseSearch && warehouseSearchTerm) ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '8px', fontSize: '12px', color: '#666', backgroundColor: '#f8f9fa' }}>
                          {filteredStock ? `${filteredStock.length} item(s) found` : 'Searching...'}
                        </td>
                      </tr>
                    ) : null}
                  </thead>
                  <tbody>
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={9}>NO DATA FOUND</td>
                      </tr>
                    ) : (
                      filteredStock.slice(0, limit).map((item, index) => (
                        <tr key={item.id || index} className="animated-row">
                          <td>{index + 1}</td>
                          <td>{item.productName}</td>
                          <td>{item.productCode}</td>
                          <td>{item.warehouseName}</td>
                          <td>
                            <span className={`badge ${
                              item.isLowStock 
                                ? 'bg-warning' 
                                : item.currentStock > 0 
                                  ? 'bg-success' 
                                  : 'bg-danger'
                            }`}>
                              {item.currentStock}
                            </span>
                            {item.isLowStock && (
                              <small className="text-warning d-block">Low Stock</small>
                            )}
                          </td>
                          <td>{item.unit}</td>
                          <td>₹{item.unitPrice}</td>
                          <td>₹{item.stockValue.toLocaleString()}</td>
                          <td>
                            {item.lastUpdated 
                              ? new Date(item.lastUpdated).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                }).split('/').join('-')
                              : 'N/A'
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default CurrentStock;
