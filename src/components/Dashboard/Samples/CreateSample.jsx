import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "./Samples.module.css";

function CreateSample({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [formData, setFormData] = useState({
    sampleName: "",
    productId: "",
    warehouseId: "",
    quantity: "",
    description: "",
    expiryDate: "",
    status: "active",
    notes: "",
    type: "product",
    price: ""
  });

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = "/products/list";
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      }
      
      console.log('Fetching products from endpoint:', endpoint);
      const response = await axiosAPI.get(endpoint);
      console.log('Products API response:', response.data);
      
      // Handle different possible response structures
      let productsData = [];
      if (response.data && Array.isArray(response.data)) {
        // Direct array response
        productsData = response.data;
      } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
        // Nested products array
        productsData = response.data.products;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Nested data array
        productsData = response.data.data;
      }
      
      console.log('Processed products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      console.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = "/warehouses";
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      }
      
      console.log('Fetching warehouses from endpoint:', endpoint);
      const response = await axiosAPI.get(endpoint);
      console.log('Warehouses API response:', response.data);
      
      // Handle different possible response structures
      let warehousesData = [];
      if (response.data && Array.isArray(response.data)) {
        // Direct array response
        warehousesData = response.data;
      } else if (response.data && response.data.warehouses && Array.isArray(response.data.warehouses)) {
        // Nested warehouses array
        warehousesData = response.data.warehouses;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Nested data array
        warehousesData = response.data.data;
      }
      
      console.log('Processed warehouses data:', warehousesData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      console.error("Failed to load warehouses");
      setWarehouses([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sampleName || !formData.productId || !formData.warehouseId || !formData.quantity || !formData.type) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      
      // Transform form data to match backend API requirements
      const sampleData = {
        name: formData.sampleName, // Backend expects 'name' not 'sampleName'
        sampleId: `SAMP-${Date.now()}`, // Generate unique sample ID
        type: formData.type || 'product', // Backend expects 'type'
        linkedProductId: formData.productId || null, // Backend expects 'linkedProductId'
        divisionId: currentDivisionId,
        warehouseId: formData.warehouseId,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price) || 0,
        description: formData.description || '',
        status: formData.status || 'active',
        expiryDate: formData.expiryDate || null,
        notes: formData.notes || ''
      };

      console.log('Sending sample data to backend:', sampleData);
      const response = await axiosAPI.post("/samples", sampleData);
      
      alert("Sample created successfully");

      // Reset form
      setFormData({
        sampleName: "",
        productId: "",
        warehouseId: "",
        quantity: "",
        description: "",
        expiryDate: "",
        status: "active",
        notes: "",
        type: "product",
        price: ""
      });

      // Navigate back to samples home
      navigate("/samples");
      
    } catch (error) {
      console.error("Error creating sample:", error);
      alert(error?.response?.data?.message || "Failed to create sample");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/samples")}>Samples</span>{" "}
        <i className="bi bi-chevron-right"></i> Add Sample
      </p>

      {/* Basic Information */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Basic Information</h5>
        <div className={`col-3 ${styles.longform}`}>
          <label>Sample Name :</label>
          <input
            type="text"
            name="sampleName"
            value={formData.sampleName}
            onChange={handleInputChange}
            placeholder="Enter sample name"
            required
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Product :</label>
          <select
            name="productId"
            value={formData.productId}
            onChange={handleInputChange}
            required
          >
            <option value="">--select--</option>
            {products && products.length > 0 ? (
              products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name || product.productName || 'Unnamed Product'}
                </option>
              ))
            ) : (
              <option value="" disabled>No products available</option>
            )}
          </select>
          {products && products.length === 0 && (
            <small className="text-muted">No products found. Please check if products exist in your division.</small>
          )}
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Warehouse :</label>
          <select
            name="warehouseId"
            value={formData.warehouseId}
            onChange={handleInputChange}
            required
          >
            <option value="">--select--</option>
            {warehouses && warehouses.length > 0 ? (
              warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name || warehouse.warehouseName || 'Unnamed Warehouse'}
                </option>
              ))
            ) : (
              <option value="" disabled>No warehouses available</option>
            )}
          </select>
          {warehouses && warehouses.length === 0 && (
            <small className="text-muted">No warehouses found. Please check if warehouses exist in your division.</small>
          )}
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Quantity :</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Enter quantity"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Type :</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
          >
            <option value="product">Product</option>
            <option value="gift">Gift</option>
          </select>
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Price :</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Enter price"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Sample Details */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Sample Details</h5>
        <div className={`col-12 ${styles.longform}`}>
          <label>Description :</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter sample description"
            rows="3"
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Expiry Date :</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
          />
        </div>
        <div className={`col-3 ${styles.longform}`}>
          <label>Status :</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="testing">Testing</option>
            <option value="expired">Expired</option>
            <option value="disposed">Disposed</option>
          </select>
        </div>
      </div>

      {/* Additional Information */}
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Additional Information</h5>
        <div className={`col-12 ${styles.longform}`}>
          <label>Notes :</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional notes about the sample"
            rows="3"
          />
        </div>
      </div>

      {/* Actions */}
      {!submitting && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-3">
            <button className="submitbtn" onClick={handleSubmit}>
              Create
            </button>
            <button
              className="cancelbtn"
              onClick={() => navigate("/samples")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {submitting && <Loading />}
    </>
  );
}

export default CreateSample;
