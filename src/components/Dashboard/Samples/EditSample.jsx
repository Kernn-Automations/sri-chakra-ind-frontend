import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import { useParams } from "react-router-dom";
import Loading from "@/components/Loading";
import { FaChevronLeft } from "react-icons/fa";
import styles from "./Samples.module.css";

function EditSample({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const { sampleId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sample, setSample] = useState(null);

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
    if (sampleId) {
      fetchSample();
    }
    fetchProducts();
    fetchWarehouses();
  }, [sampleId]);

  const fetchSample = async () => {
    try {
      setLoading(true);
      const response = await axiosAPI.get(`/samples/${sampleId}`);
      const sampleData = response.data;
      setSample(sampleData);
      
      // Pre-fill form data
      setFormData({
        sampleName: sampleData.name || sampleData.sampleName || "",
        productId: sampleData.linkedProductId || sampleData.productId || "",
        warehouseId: sampleData.warehouseId || "",
        quantity: sampleData.quantity || "",
        description: sampleData.description || "",
        expiryDate: sampleData.expiryDate ? sampleData.expiryDate.split('T')[0] : "",
        status: sampleData.status || "active",
        notes: sampleData.notes || "",
        type: sampleData.type || "product",
        price: sampleData.price || ""
      });
    } catch (error) {
      console.error("Error fetching sample:", error);
      alert("Failed to load sample data");
      navigate("/samples");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
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
    }
  };

  const fetchWarehouses = async () => {
    try {
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = "/warehouses";
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      }
      
      const response = await axiosAPI.get(endpoint);
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      console.error("Failed to load warehouses");
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
        type: formData.type, // Backend expects 'type'
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

      console.log('Sending updated sample data to backend:', sampleData);
      const response = await axiosAPI.put(`/samples/${sampleId}`, sampleData);
      
      alert("Sample updated successfully");

      // Navigate back to samples view
      navigate("/samples/view");
      
    } catch (error) {
      console.error("Error updating sample:", error);
      alert(error?.response?.data?.message || "Failed to update sample");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!sample) {
    return (
      <div className="container-fluid">
        <div className="row m-0 p-3">
          <div className="col text-center">
            <p>Sample not found</p>
            <button className="btn btn-primary" onClick={() => navigate("/samples")}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/samples")}>Samples</span>{" "}
        <i className="bi bi-chevron-right"></i> Edit Sample
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
              Update
            </button>
            <button
              className="cancelbtn"
              onClick={() => navigate("/samples/view")}
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

export default EditSample;
