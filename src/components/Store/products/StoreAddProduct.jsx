import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaPlus, FaTimes } from "react-icons/fa";

export default function StoreAddProduct({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [categories, setCategories] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    SKU: "",
    categoryId: "",
    unit: "",
    description: "",
    basePrice: "",
    purchasePrice: "",
    thresholdValue: "",
    productType: "",
    packageWeight: "",
    packageWeightUnit: "kg"
  });

  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [images, setImages] = useState([null]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (successful) {
      navigate('/store/products');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, taxesRes] = await Promise.all([
        axiosAPI.get("/categories/list"),
        axiosAPI.get("/tax")
      ]);
      setCategories(categoriesRes.data?.categories || []);
      setTaxes(taxesRes.data?.taxes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load form data");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaxToggle = (taxId) => {
    setSelectedTaxes(prev => 
      prev.includes(taxId) 
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  const handleImageChange = (index, file) => {
    const newImages = [...images];
    newImages[index] = file ? { file, preview: URL.createObjectURL(file) } : null;
    setImages(newImages);
  };

  const addImageSlot = () => {
    setImages([...images, null]);
  };

  const removeImageSlot = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const validateForm = () => {
    if (!formData.name) {
      setError("Product name is required");
      setIsModalOpen(true);
      return false;
    }
    if (!formData.SKU) {
      setError("SKU is required");
      setIsModalOpen(true);
      return false;
    }
    if (!formData.categoryId) {
      setError("Category is required");
      setIsModalOpen(true);
      return false;
    }
    if (!formData.basePrice) {
      setError("Base price is required");
      setIsModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const submitFormData = new FormData();
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== null) {
          submitFormData.append(key, formData[key]);
        }
      });

      // Add taxes
      selectedTaxes.forEach(taxId => {
        submitFormData.append("taxIds[]", taxId);
      });

      // Add images
      images.forEach((image) => {
        if (image && image.file) {
          submitFormData.append("images", image.file);
        }
      });

      await axiosAPI.post("/products/add", submitFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessful(true);
      setError("Product added successfully!");
      setIsModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add product");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-sm btn-outline-secondary mb-3"
          onClick={() => navigate('/store/products')}
          style={{ fontFamily: 'Poppins' }}
        >
          ← Back to Products
        </button>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Add New Product</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>Create a new product in your catalog</p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Product Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
                required
              />
            </div>
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                SKU <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.SKU}
                onChange={(e) => handleChange('SKU', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
                required
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Category <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Unit
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g., kg, pieces, liters"
                style={{ fontFamily: 'Poppins' }}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Base Price <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.basePrice}
                onChange={(e) => handleChange('basePrice', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
                required
              />
            </div>
            <div className="col-md-6">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Purchase Price
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Description
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{ fontFamily: 'Poppins' }}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Taxes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {taxes.map(tax => (
                  <label key={tax.id} style={{ fontFamily: 'Poppins', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedTaxes.includes(tax.id)}
                      onChange={() => handleTaxToggle(tax.id)}
                      style={{ marginRight: '4px' }}
                    />
                    {tax.name} ({tax.rate}%)
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12">
              <label style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Product Images
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {images.map((image, index) => (
                  <div key={index} style={{ position: 'relative', width: '120px', height: '120px', border: '1px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {image ? (
                      <>
                        <img src={image.preview} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        <button
                          type="button"
                          onClick={() => removeImageSlot(index)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                        >
                          <FaTimes size={12} />
                        </button>
                      </>
                    ) : (
                      <label style={{ cursor: 'pointer', textAlign: 'center', padding: '8px' }}>
                        <FaPlus size={24} style={{ color: '#999', marginBottom: '4px' }} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(index, e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                        <div style={{ fontSize: '11px', color: '#999' }}>Add Image</div>
                      </label>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={addImageSlot}
                    style={{ width: '120px', height: '120px', border: '1px dashed #ddd', borderRadius: '8px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                  >
                    <FaPlus size={24} style={{ color: '#999', marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#999' }}>Add More</div>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12" style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ fontFamily: 'Poppins' }}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/store/products')}
                style={{ fontFamily: 'Poppins' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </div>
  );
}

