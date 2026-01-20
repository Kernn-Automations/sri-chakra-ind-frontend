import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaEdit, FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import storeService from "../../../services/storeService";

export default function StoreManageProducts() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customPrice: "",
    stockQuantity: "",
    minStockLevel: "",
    isEnabled: true
  });
  const [visiblePrices, setVisiblePrices] = useState({});
  const [storeId, setStoreId] = useState(null);

  // Header Search States
  const [showHeadersSearch, setShowHeadersSearch] = useState({
    name: false,
    SKU: false,
    category: false,
    status: false
  });

  const [headerSearchTerms, setHeaderSearchTerms] = useState({
    name: "",
    SKU: "",
    category: "",
    status: ""
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
          name: false,
          SKU: false,
          category: false,
          status: false
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
          name: false,
          SKU: false,
          category: false,
          status: false
        });
        setHeaderSearchTerms({
          name: "",
          SKU: "",
          category: "",
          status: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to get store ID from multiple sources
  const getStoreId = () => {
    try {
      // Priority 1: selectedStore from localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          if (store && store.id) {
            return store.id;
          }
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }
      
      // Priority 2: currentStoreId from localStorage
      const currentStoreId = localStorage.getItem("currentStoreId");
      if (currentStoreId) {
        const id = parseInt(currentStoreId);
        if (!isNaN(id)) {
          return id;
        }
      }
      
      // Priority 3: From user data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      if (user?.storeId) {
        return user.storeId;
      }
      if (user?.store?.id) {
        return user.store.id;
      }
      
      return null;
    } catch (err) {
      console.error("Error getting store ID:", err);
      return null;
    }
  };

  // Define fetchProducts before using it in useEffect
  const fetchProducts = React.useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      const response = await storeService.getStoreProducts(storeId);
      
      console.log("Store products response:", response);
      
      if (response.success && Array.isArray(response.data)) {
        // Map API response - GET /stores/:storeId/products returns full details with sales stats
        const mappedProducts = response.data.map((item) => ({
          id: item.productId || item.id, // Use productId for the product ID
          storeProductId: item.id, // Store the store product ID for updates
          name: item.productName || '-',
          SKU: item.sku || '-',
          category: item.category || null,
          basePrice: item.basePrice || 0,
          customPrice: item.customPrice || null,
          currentPrice: item.currentPrice || item.customPrice || item.basePrice || 0, // API uses 'currentPrice'
          stockQuantity: item.stock || 0, // API uses 'stock' in GET response
          minStockLevel: item.minStockLevel || null,
          isEnabled: item.isEnabled !== undefined ? item.isEnabled : true,
          isActive: item.isActive !== undefined ? item.isActive : true,
          unit: item.unit || '-',
          productType: item.productType || '-',
          salesCount: item.salesCount || 0, // Sales statistics
          totalSalesValue: item.totalSalesValue || 0, // Sales statistics
          status: item.isEnabled === false ? 'Disabled' : (item.isActive === false ? 'Inactive' : 'Active')
        }));
        console.log("Mapped products:", mappedProducts);
        setProducts(mappedProducts);
        
        // Store summary statistics if available
        if (response.summary) {
          setSummary(response.summary);
        }
      } else {
        const errorMsg = response.message || "Failed to load products";
        console.error("Failed to load products:", errorMsg, response);
        setError(errorMsg);
        setIsModalOpen(true);
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.message || err.message || "Failed to load products");
      setIsModalOpen(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    // Get store ID on mount
    const id = getStoreId();
    if (id) {
      console.log("Store ID retrieved:", id);
      setStoreId(id);
    } else {
      console.warn("Store ID not found on mount, will retry...");
      // Don't show error immediately, wait a bit and check again
      const timeout = setTimeout(() => {
        const retryId = getStoreId();
        if (retryId) {
          console.log("Store ID retrieved on retry:", retryId);
          setStoreId(retryId);
        } else {
          console.warn("Store ID still not found after retry");
          setError("Store ID not found. Please ensure you are logged in and have a store assigned.");
          setIsModalOpen(true);
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  // Listen for store change events
  useEffect(() => {
    const handleStoreChange = () => {
      const id = getStoreId();
      if (id && id !== storeId) {
        console.log("Store changed, updating store ID:", id);
        setStoreId(id);
      }
    };

    window.addEventListener('storeChanged', handleStoreChange);
    window.addEventListener('storage', handleStoreChange);
    
    return () => {
      window.removeEventListener('storeChanged', handleStoreChange);
      window.removeEventListener('storage', handleStoreChange);
    };
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
    // Removed the else block that was showing error immediately
    // Error will only show if store ID is not found after retry
  }, [storeId, fetchProducts]);

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setEditFormData({
      customPrice: product.customPrice || product.currentPrice || product.basePrice || "",
      stockQuantity: product.stockQuantity || "",
      minStockLevel: product.minStockLevel || "",
      isEnabled: product.isEnabled !== undefined ? product.isEnabled : true
    });
  };

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: field === 'isEnabled' ? value : value
    }));
  };

  const handleSavePrice = async (product) => {
    if (!storeId) {
      setError("Store ID not found");
      setIsModalOpen(true);
      return;
    }
    
    try {
      setLoading(true);
      // Prepare request body for PUT /stores/:storeId/products/pricing
      // product.id is the actual productId (e.g., 16), not the store product ID
      const requestBody = {
        productId: product.id // Actual product ID from mapping (item.productId)
      };

      // Only include fields that have been provided
      if (editFormData.customPrice !== "" && editFormData.customPrice !== null) {
        requestBody.customPrice = parseFloat(editFormData.customPrice);
      }
      if (editFormData.stockQuantity !== "" && editFormData.stockQuantity !== null) {
        requestBody.stockQuantity = parseInt(editFormData.stockQuantity);
      }
      if (editFormData.minStockLevel !== "" && editFormData.minStockLevel !== null) {
        requestBody.minStockLevel = parseInt(editFormData.minStockLevel);
      }
      if (editFormData.isEnabled !== undefined) {
        requestBody.isEnabled = editFormData.isEnabled;
      }

      // Use the store products pricing endpoint
      await storeService.updateStoreProductPricing(storeId, requestBody);
      await fetchProducts();
      setEditingProduct(null);
      setEditFormData({
        customPrice: "",
        stockQuantity: "",
        minStockLevel: "",
        isEnabled: true
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({
      customPrice: "",
      stockQuantity: "",
      minStockLevel: "",
      isEnabled: true
    });
  };

  const togglePriceVisibility = (productId) => {
    setVisiblePrices((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const filteredProducts = products.filter((product) => {
    // Global search term check
    const matchesGlobal = searchTerm === "" || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.SKU?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesGlobal) return false;

    // Header search terms check
    if (headerSearchTerms.name && !product.name?.toLowerCase().includes(headerSearchTerms.name.toLowerCase())) {
      return false;
    }
    if (headerSearchTerms.SKU && !(product.SKU || product.sku)?.toLowerCase().includes(headerSearchTerms.SKU.toLowerCase())) {
      return false;
    }
    if (headerSearchTerms.category) {
      const categoryName = product.category?.name || product.category || "";
      if (!categoryName.toLowerCase().includes(headerSearchTerms.category.toLowerCase())) {
        return false;
      }
    }
    if (headerSearchTerms.status) {
      if (!product.status?.toLowerCase().includes(headerSearchTerms.status.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <p className="path">
          <span onClick={() => navigate("/store/products")}>Products</span>{" "}
          <i className="bi bi-chevron-right"></i> Manage Products
        </p>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Manage Products and Prices</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>View and update product information and pricing</p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '500px'
        }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: '18px'
          }} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid #000',
              fontFamily: 'Poppins',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#fff',
              color: '#000',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div className={styles.orderStatusCard} style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '4px' }}>
              {summary.catalogSize || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>Total Products</div>
          </div>
          <div className={styles.orderStatusCard} style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#28a745', marginBottom: '4px' }}>
              {summary.priceUpdates30d || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>Price Updates (30d)</div>
          </div>
          <div className={styles.orderStatusCard} style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc3545', marginBottom: '4px' }}>
              {summary.outOfStock || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>Out of Stock</div>
          </div>
          <div className={styles.orderStatusCard} style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#17a2b8', marginBottom: '4px' }}>
              {summary.newProducts || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins' }}>New Products</div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className={styles.orderStatusCard}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
          Products List ({filteredProducts.length})
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-bordered borderedtable table-sm" style={{ fontFamily: 'Poppins' }}>
            <thead className="table-light">
              <tr>
                {renderSearchHeader("Product Name", "name", "data-name-header")}
                {renderSearchHeader("SKU", "SKU", "data-sku-header")}
                {renderSearchHeader("Category", "category", "data-category-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Price</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Stock</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Min Stock</th>
                {renderSearchHeader("Status", "status", "data-status-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(headerSearchTerms.name || headerSearchTerms.SKU || headerSearchTerms.category || headerSearchTerms.status) && (
                <tr>
                  <td colSpan="8" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {filteredProducts.length} products found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ padding: '20px', fontFamily: 'Poppins' }}>
                    {loading ? 'Loading products...' : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, i) => (
                  <tr key={product.id} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>
                        {product.name}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '12px', color: '#666' }}>
                        {product.SKU || product.sku || '-'}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        <span className="badge bg-secondary" style={{ fontFamily: 'Poppins', fontSize: '11px' }}>
                          {product.category?.name || product.category || '-'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.customPrice}
                            onChange={(e) => handleFormChange('customPrice', e.target.value)}
                            placeholder="Price"
                            style={{
                              width: '100px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #000',
                              fontFamily: 'Poppins',
                              fontSize: '13px',
                              backgroundColor: '#fff',
                              color: '#000'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                              ₹{visiblePrices[product.id] ? Number(product.currentPrice || product.customPrice || product.basePrice || 0).toFixed(2) : '••••'}
                            </span>
                            <button
                              className="btn btn-sm btn-link p-0"
                              onClick={() => togglePriceVisibility(product.id)}
                              style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '0', minWidth: 'auto' }}
                            >
                              {visiblePrices[product.id] ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            value={editFormData.stockQuantity}
                            onChange={(e) => handleFormChange('stockQuantity', e.target.value)}
                            placeholder="Stock"
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #000',
                              fontFamily: 'Poppins',
                              fontSize: '13px',
                              backgroundColor: '#fff',
                              color: '#000'
                            }}
                          />
                        ) : (
                          <span style={{ 
                            color: product.stockQuantity <= (product.minStockLevel || 0) ? '#dc3545' : 'inherit',
                            fontWeight: product.stockQuantity <= (product.minStockLevel || 0) ? 600 : 'normal'
                          }}>
                            {Number(product.stockQuantity || 0).toFixed(2)} {product.unit ? product.unit : ''}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            value={editFormData.minStockLevel}
                            onChange={(e) => handleFormChange('minStockLevel', e.target.value)}
                            placeholder="Min"
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #000',
                              fontFamily: 'Poppins',
                              fontSize: '13px',
                              backgroundColor: '#fff',
                              color: '#000'
                            }}
                          />
                        ) : (
                          <span>{product.minStockLevel || '-'}</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {editingProduct === product.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={editFormData.isEnabled}
                              onChange={(e) => handleFormChange('isEnabled', e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '11px' }}>{editFormData.isEnabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        ) : (
                          <span className={`badge ${product.isEnabled && product.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontFamily: 'Poppins', fontSize: '11px' }}>
                            {product.isEnabled === false ? 'Disabled' : (product.isActive === false ? 'Inactive' : 'Active')}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingProduct === product.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSavePrice(product)}
                              style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleCancelEdit}
                              style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditClick(product)}
                            style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                          >
                            <FaEdit style={{ fontSize: '12px', marginRight: '4px' }} />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </div>
  );
}

