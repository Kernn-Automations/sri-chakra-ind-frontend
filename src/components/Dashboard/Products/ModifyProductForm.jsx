import React, { useEffect, useState } from "react";
import styles from "./Products.module.css";
import { useAuth } from "@/Auth";
import ImageUpload from "./ImageUpload";
import TaxSelector from "./TaxSelector";
import PricingSlabs from "./PricingSlabs";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function ModifyProductForm({ onViewClick, productId, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [original, setOriginal] = useState({});
  const [fields, setFields] = useState({});
  const [modified, setModified] = useState({});
  const [categories, setCategories] = useState([]);
  const [pricingList, setPricingList] = useState([]);
  const [taxesList, setTaxesList] = useState([]);
  const [images, setImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successful, setSuccessful] = useState(null);
  const [showPurchasePrice, setShowPurchasePrice] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product details by ID
        const res = await axiosAPI.get(`/products/fetch/${productId}`);
        const p = res.data.product;

        // Populate base state
        setOriginal(p);
        setFields({
          name: p.name || "",
          SKU: p.SKU || "",
          categoryId: p.category?.id || "",
          unit: p.unit || "",
          description: p.description || "",
          basePrice: p.basePrice || "",
          purchasePrice: p.purchasePrice || "",
          thresholdValue: p.thresholdValue || "",
          pricingListId: p.pricingListId || "",
          productType: p.productType || "loose",
          packageWeight: p.packageWeight || "",
          packageWeightUnit: p.packageWeightUnit || "",
          selectedTaxes: p.taxes?.map((t) => t.id) || [],
          pricingSlabs: p.pricingSlabs || [],
        });

        // Handle existing image previews
        const mapped = p.imageUrls.map((url) => ({ preview: url }));
        setImages(mapped.length < 6 ? [...mapped, null] : mapped);

        // Fetch dropdowns
        const [catRes, priceRes, taxRes] = await Promise.all([
          axiosAPI.get("/categories/list"),
          axiosAPI.get("/pricing/lists/fetch"),
          axiosAPI.get("/tax"),
        ]);
        setCategories(catRes.data.categories);
        setPricingList(priceRes.data.pricingLists);
        setTaxesList(taxRes.data.taxes);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching product details");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId, axiosAPI]);

  const handleChange = (field, value) => {
    // 🛡️ Always ensure selectedTaxes is an array
    if (field === "selectedTaxes" && !Array.isArray(value)) {
      value = [];
    }
  
    setFields((prev) => ({ ...prev, [field]: value }));
  
    // If original[field] is an array, compare using JSON.stringify to detect deep changes
    const isModified = Array.isArray(value) && Array.isArray(original[field])
      ? JSON.stringify(value) !== JSON.stringify(original[field])
      : value !== original[field];
  
    setModified((prev) => ({
      ...prev,
      [field]: isModified,
    }));
  };
  

  const changedFields = Object.values(modified).filter((v) => v).length > 0;

  const updateProduct = async () => {
    const formData = new FormData();
    
    // Add all form fields (excluding images and selectedTaxes which are handled separately)
    Object.entries(fields).forEach(([key, value]) => {
      if (key === "selectedTaxes") {
        // Handle tax IDs array - append each tax ID individually
        (value || []).forEach((taxId) => {
          formData.append("taxIds", taxId);
        });
      } else if (key === "pricingSlabs") {
        // Handle pricing slabs JSON
        if (value && Array.isArray(value) && value.length > 0) {
          formData.append("pricingSlabs", JSON.stringify(value));
        }
      } else if (key !== "images") {
        // Handle regular fields - don't append empty strings for optional fields
        if (value !== "" || ["name", "SKU", "description", "basePrice", "purchasePrice", "productType"].includes(key)) {
          formData.append(key, value || "");
        }
      }
    });
  
    // Handle images - CRITICAL FIX: Only append new file objects, not existing URLs
    console.log("🖼️ Processing images for upload:");
    console.log("🖼️ Images array:", images);
    
    let fileCount = 0;
    let hasNewFiles = false;
    
    images.forEach((img, i) => {
      // Only append if it's a new file (has both file property and it's a File instance)
      if (img && img.file && img.file instanceof File) {
        formData.append("images", img.file);
        console.log(`📦 Appended image[${i}]:`, img.file.name, `(${img.file.size} bytes)`);
        fileCount++;
        hasNewFiles = true;
      } else if (img && img.preview && !img.file) {
        // This is an existing image (preview URL only) - don't append to FormData
        console.log(`⏭️ Skipping existing image[${i}]: ${img.preview}`);
      } else {
        console.log(`⏭️ Skipping empty slot[${i}]`);
      }
    });
    
    console.log(`📊 Total new files to upload: ${fileCount}`);
    console.log(`📊 Has new files: ${hasNewFiles}`);
  
    // Debug: Log all FormData entries
    console.log("📦 FormData contents:");
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`📦 ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`);
      } else {
        console.log(`📦 ${pair[0]}: ${pair[1]}`);
      }
    }
  
    try {
      setLoading(true);
      const res = await axiosAPI.put(`/products/update/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("✅ Update response:", res.data);
      setSuccessful("Updated Successfully");
    } catch (e) {
      console.error("❌ Update error:", e.response?.data || e.message);
      setError(e.response?.data?.message || "Error updating product");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, field, type = "text", options = null) => (
    <div className={`col-3 ${styles.longform}`}>
      <label>{label}</label>
      {options ? (
        <select
          value={fields[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          className={modified[field] ? styles.changedField : ""}
        >
          <option value="">--select--</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={fields[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className={modified[field] ? styles.changedField : ""}
        />
      )}
    </div>
  );

  return (
    <>
      <div className="row m-0 p-3">
        <h5 className={styles.head}>Modify Product</h5>
        {renderInput("Product Name", "name")}
        {renderInput("SKU", "SKU")}
        {renderInput("Category", "categoryId", "select", categories)}
        {renderInput("Unit", "unit", "select", 
          fields.productType === "packed" 
            ? [
                { id: "bags", name: "bags" },
                { id: "packets", name: "packets" },
              ]
            : [
                { id: "mg", name: "mg" },
                { id: "g", name: "g" },
                { id: "kg", name: "kg" },
                { id: "ton", name: "ton" },
                { id: "ml", name: "ml" },
                { id: "l", name: "litre" },
                { id: "gal", name: "gallons" },
              ]
        )}
        {renderInput("Product Type", "productType", "select", [
          { id: "packed", name: "Packed" },
          { id: "loose", name: "Loose" },
        ])}
        {fields.productType === "packed" && (
          <>
            {renderInput("Package Weight", "packageWeight")}
            {renderInput("Package Weight Unit", "packageWeightUnit", "select", [
              { id: "mg", name: "mg" },
              { id: "g", name: "g" },
              { id: "kg", name: "kg" },
              { id: "ton", name: "ton" },
              { id: "ml", name: "ml" },
              { id: "litre", name: "litre" },
            ])}
          </>
        )}
        {renderInput("Base Price", "basePrice")}
        {isAdmin && (
          <div className={`col-3 ${styles.longform}`}>
            <label>Purchase Price</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type={showPurchasePrice ? "text" : "password"}
                value={fields.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
                className={modified.purchasePrice ? styles.changedField : ""}
                style={{ flex: 1 }}
              />
              <span
                onClick={() => setShowPurchasePrice(!showPurchasePrice)}
                style={{ marginLeft: "8px", cursor: "pointer" }}
              >
                {showPurchasePrice ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </span>
            </div>
          </div>
        )}
        {renderInput("Threshold", "thresholdValue")}
        <div className={`col-6 ${styles.taxform}`}>
          <textarea
            value={fields.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className={modified.description ? styles.changedField : ""}
            placeholder="Description"
          ></textarea>
        </div>
      </div>

      <div className="row m-0 p-3">
        <ImageUpload images={images} setImages={setImages} />
      </div>

      <div className="row m-0 p-3">
      <div className="col-4">
              <TaxSelector
          selectedTaxes={fields.selectedTaxes || []}
          setSelectedTaxes={(v) => handleChange("selectedTaxes", v)}
        />
      </div>
    </div>

      <div className="row m-0 p-3">
        <PricingSlabs
          pricingSlabs={fields.pricingSlabs}
          setPricingSlabs={(v) => handleChange("pricingSlabs", v)}
        />
      </div>

      <div className="row m-0 justify-content-center p-3">
        {!loading && !successful && (
          <div className="col-4">
            <button className="submitbtn" onClick={updateProduct}>
              Update
            </button>
            <button className="cancelbtn" onClick={onViewClick}>
              Cancel
            </button>
          </div>
        )}
        {successful && (
          <div className="col-6">
            <button className="submitbtn" onClick={onViewClick}>
              {successful}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={() => setIsModalOpen(false)} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default ModifyProductForm;
