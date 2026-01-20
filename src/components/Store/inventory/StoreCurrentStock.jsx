import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import inventoryAni from "../../../images/animations/fetchingAnimation.gif";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import storeService from "../../../services/storeService";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

function StoreCurrentStock() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState([]);
  const [error, setError] = useState(null);
  const [filteredStock, setFilteredStock] = useState([]);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState(null);

  // Column search states
  const [productNameSearchTerm, setProductNameSearchTerm] = useState("");
  const [showProductNameSearch, setShowProductNameSearch] = useState(false);
  const [productCodeSearchTerm, setProductCodeSearchTerm] = useState("");
  const [showProductCodeSearch, setShowProductCodeSearch] = useState(false);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showProductNameSearch) {
          setShowProductNameSearch(false);
          setProductNameSearchTerm("");
        }
        if (showProductCodeSearch) {
          setShowProductCodeSearch(false);
          setProductCodeSearchTerm("");
        }
      }
    };

    if (showProductNameSearch || showProductCodeSearch) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showProductNameSearch, showProductCodeSearch]);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-search-header]')) {
        setShowProductNameSearch(false);
        setShowProductCodeSearch(false);
      }
    };

    if (showProductNameSearch || showProductCodeSearch) {
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showProductNameSearch, showProductCodeSearch]);

  useEffect(() => {
    // Get store ID from multiple sources
    try {
      let id = null;
      
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          id = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }
      
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }
      
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
      fetchCurrentStock();
    }
  }, [storeId]);

  useEffect(() => {
    let filtered = currentStock;

    // Filter by global search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by Product Name column search
    if (productNameSearchTerm) {
      filtered = filtered.filter(item =>
        item.productName?.toLowerCase().includes(productNameSearchTerm.toLowerCase())
      );
    }

    // Filter by Product Code column search
    if (productCodeSearchTerm) {
      filtered = filtered.filter(item =>
        item.productCode?.toLowerCase().includes(productCodeSearchTerm.toLowerCase())
      );
    }

    setFilteredStock(filtered);
  }, [searchTerm, productNameSearchTerm, productCodeSearchTerm, currentStock]);

  const fetchCurrentStock = async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await storeService.getStoreInventory(storeId);
      
      // Handle different response formats
      const inventoryData = res.data?.inventory || res.inventory || res.data || res || [];
      
      const transformedStock = Array.isArray(inventoryData) ? inventoryData.map((item, index) => {
        const stockQuantity = parseFloat(item.stockQuantity || item.quantity || item.currentStock || 0);
        const unitPrice = parseFloat(item.product?.basePrice || item.product?.customPrice || item.basePrice || item.unitPrice || 0);
        const stockValue = stockQuantity * unitPrice;
        
        return {
          id: item.id || item.productId || index,
          productId: item.productId || item.product?.id,
          productName: item.product?.name || item.name || "N/A",
          productCode: item.product?.SKU || item.product?.sku || item.SKU || item.sku || item.productCode || "N/A",
          currentStock: stockQuantity,
          unit: item.product?.unit || item.unit || "kg",
          unitPrice: unitPrice,
          stockValue: stockValue,
          isLowStock: item.isLowStock || (stockQuantity > 0 && stockQuantity < 10) || false,
          stockStatus: item.stockStatus || (stockQuantity === 0 ? 'out_of_stock' : stockQuantity < 10 ? 'low' : 'normal'),
          lastUpdated: item.lastUpdated || item.updatedAt || item.createdAt || new Date().toISOString(),
          productType: item.product?.productType || item.productType || "unknown",
          // Recent movements if available
          recentMovements: item.recentMovements || item.movements || []
        };
      }) : [];
      
      setCurrentStock(transformedStock);
      setFilteredStock(transformedStock);
    } catch (err) {
      console.error('Error fetching current stock:', err);
      setError(err?.response?.data?.message || err?.message || "Failed to load current stock");
      setCurrentStock([]);
      setFilteredStock([]);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setError(null);
  };

  const stats = {
    totalProducts: filteredStock.length,
    inStock: filteredStock.filter(item => item.currentStock > 0).length,
    lowStock: filteredStock.filter(item => item.isLowStock).length,
    outOfStock: filteredStock.filter(item => item.currentStock === 0).length,
    totalValue: filteredStock.reduce((total, item) => total + item.stockValue, 0),
    packedProducts: filteredStock.filter(item => item.productType === "packed").length,
    looseProducts: filteredStock.filter(item => item.productType === "loose").length
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Product Name",
      "Product Code",
      "Current Stock",
      "Unit",
      "Unit Price",
      "Total Value",
      "Status"
    ];
    const dataToExport = filteredStock && filteredStock.length > 0 ? filteredStock : currentStock;
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          "Product Name": item.productName || '-',
          "Product Code": item.productCode || '-',
          "Current Stock": Number(item.currentStock || 0).toFixed(2),
          "Unit": item.unit || 'kg',
          "Unit Price": Number(item.unitPrice || 0).toFixed(2),
          "Total Value": Number(item.stockValue || 0).toFixed(2),
          "Status": item.stockStatus === 'normal' ? 'Normal' : item.stockStatus === 'low' ? 'Low' : 'Out of Stock'
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Current_Stock");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "CurrentStock");
    } else {
      setError("Table is Empty");
    }
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
        }}>Current Stock</h2>
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i className="bi bi-chevron-right"></i> Current Stock
        </p>
      </div>

      {/* Loading Animation */}
      {loading && <LoadingAnimation gif={inventoryAni} msg="Loading current stock..." />}

      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}

      {/* Summary Cards */}
      {!loading && currentStock.length > 0 && (
        <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
          <ReusableCard title="Total Products" value={stats.totalProducts.toString()} />
          <ReusableCard title="In Stock" value={stats.inStock.toString()} color="green.500" />
          <ReusableCard title="Low Stock" value={stats.lowStock.toString()} color="yellow.500" />
          <ReusableCard title="Out of Stock" value={stats.outOfStock.toString()} color="red.500" />
          <ReusableCard title="Total Value" value={`₹${(stats.totalValue / 100000).toFixed(2)}L`} color="blue.500" />
        </Flex>
      )}

      {/* Search and Filter */}
      {!loading && currentStock.length > 0 && (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search by product name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontFamily: 'Poppins',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'Poppins', fontSize: '14px', marginRight: '8px' }}>Show:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontFamily: 'Poppins',
                fontSize: '14px'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button 
            className="homebtn"
            onClick={() => navigate('/store/inventory')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1' }}
          >
            Back to Inventory
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && currentStock.length === 0 && !error && (
        <div className={styles.orderStatusCard}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h4 style={{ fontFamily: 'Poppins', color: '#666', marginBottom: '12px' }}>No inventory data found</h4>
            <p style={{ fontFamily: 'Poppins', color: '#999', margin: 0 }}>There are no products in stock for this store.</p>
          </div>
        </div>
      )}

      {/* Export buttons */}
      {!loading && filteredStock.length > 0 && (
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

      {/* Stock Table */}
      {!loading && filteredStock.length > 0 && (
        <div className={styles.orderStatusCard}>
          <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Current Stock Details
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered borderedtable table-sm" style={{ fontFamily: 'Poppins' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>S.No</th>
                  <th
                    onClick={() => setShowProductNameSearch(!showProductNameSearch)}
                    style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px', cursor: 'pointer', position: 'relative' }}
                    data-search-header="true"
                    data-product-name-header
                  >
                    {showProductNameSearch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={productNameSearchTerm}
                          onChange={(e) => setProductNameSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "2px 6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "12px",
                            minWidth: "120px",
                            height: "28px",
                            color: "#000",
                            backgroundColor: "#fff",
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {productNameSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductNameSearchTerm("");
                            }}
                            style={{
                              padding: "4px 8px",
                              border: "1px solid #dc3545",
                              borderRadius: "4px",
                              background: "#dc3545",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              minWidth: "24px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>Product Name</>
                    )}
                  </th>
                  <th
                    onClick={() => setShowProductCodeSearch(!showProductCodeSearch)}
                    style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px', cursor: 'pointer', position: 'relative' }}
                    data-search-header="true"
                    data-product-code-header
                  >
                    {showProductCodeSearch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search code..."
                          value={productCodeSearchTerm}
                          onChange={(e) => setProductCodeSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "2px 6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "12px",
                            minWidth: "120px",
                            height: "28px",
                            color: "#000",
                            backgroundColor: "#fff",
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {productCodeSearchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductCodeSearchTerm("");
                            }}
                            style={{
                              padding: "4px 8px",
                              border: "1px solid #dc3545",
                              borderRadius: "4px",
                              background: "#dc3545",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              minWidth: "24px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>Product Code</>
                    )}
                  </th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Current Stock</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Unit</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Unit Price</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Total Value</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.slice(0, limit).map((item, index) => (
                  <tr key={item.id || index} style={{ background: index % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{index + 1}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '12px', color: '#666' }}>{item.productCode}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                      {Number(item.currentStock || 0).toFixed(2)}
                    </td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{item.unit}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>₹{Number(item.unitPrice || 0).toFixed(2)}</td>
                    <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                      ₹{Number(item.stockValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${
                        item.stockStatus === 'normal' ? 'bg-success' : 
                        item.stockStatus === 'low' ? 'bg-warning' : 'bg-danger'
                      }`} style={{ fontFamily: 'Poppins', fontSize: '11px' }}>
                        {item.stockStatus === 'normal' ? 'Normal' : item.stockStatus === 'low' ? 'Low' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStock.length > limit && (
            <div style={{ marginTop: '16px', textAlign: 'center', fontFamily: 'Poppins', fontSize: '14px', color: '#666' }}>
              Showing {limit} of {filteredStock.length} products
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoreCurrentStock;

