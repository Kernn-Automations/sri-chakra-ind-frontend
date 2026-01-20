import React, { useEffect, useState } from "react";
import styles from "./Products.module.css";
import { useAuth } from "@/Auth";
import TaxSelector from "./TaxSelector";
import ImageUpload from "./ImageUpload";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import axios from "axios";

function AddProduct({ navigate }) {
  const { axiosAPI } = useAuth();

  // -------------------------
  // Master data
  // -------------------------
  const [categories, setCategories] = useState([]);
  const [pricingList, setPricingList] = useState([]);
  const [taxeslist, setTaxeslist] = useState([]);

  // -------------------------
  // UI state
  // -------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState();

  const closeModal = () => setIsModalOpen(false);

  // -------------------------
  // Product fields
  // -------------------------
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [baseprice, setBaseprice] = useState("");
  const [purchaseprice, setPurchaseprice] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  const [productType, setProductType] = useState(""); // packed | loose
  const [measurementType, setMeasurementType] = useState(""); // weight | length | area | count
  const [unit, setUnit] = useState("");

  const [packageWeight, setPackageWeight] = useState("");
  const [packageWeightUnit, setPackageWeightUnit] = useState("");

  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [images, setImages] = useState([null]);

  const user = JSON.parse(localStorage.getItem("user"));

  // -------------------------
  // Unit maps
  // -------------------------
  const MEASUREMENT_UNITS = {
    weight: ["mg", "g", "kg", "ton", "mt"],
    length: ["mm", "cm", "m", "ft", "inch", "yard", "rmt"],
    area: ["sq_mm", "sq_cm", "sq_m", "sq_ft", "sq_yard"],
    count: ["nos", "pcs", "bundle", "sheet", "coil", "panel", "set"],
  };

  const PACKAGE_UNITS = [
    "g",
    "kg",
    "ton",
    "mt",
    "pcs",
    "bundle",
    "coil",
    "sheet",
  ];

  // -------------------------
  // Fetch initial data
  // -------------------------
  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const [res1, res2, res3] = await Promise.all([
          axiosAPI.get("/categories/list"),
          axiosAPI.get("/pricing/lists/fetch"),
          axiosAPI.get("/tax"),
        ]);
        setCategories(res1.data.categories || []);
        setPricingList(res2.data.pricingLists || []);
        setTaxeslist(res3.data.taxes || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load data");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [axiosAPI]);

  // -------------------------
  // Validation
  // -------------------------
  const validateFields = () => {
    if (!name || !sku || !category || !description) return false;
    if (!baseprice || !purchaseprice || !thresholdValue) return false;
    if (!productType || !measurementType) return false;

    if (productType === "loose") {
      if (!unit) return false;
    }

    if (productType === "packed") {
      if (!packageWeight || !packageWeightUnit) return false;
    }

    return true;
  };

  // -------------------------
  // Submit product
  // -------------------------
  const onCreateProduct = async () => {
    if (!validateFields()) {
      setError("Please fill all required fields.");
      setIsModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("SKU", sku);
    formData.append("description", description);
    formData.append("categoryId", category);
    formData.append("basePrice", baseprice);
    formData.append("purchasePrice", purchaseprice);
    formData.append("thresholdValue", thresholdValue);
    formData.append("productType", productType);
    formData.append("measurementType", measurementType);

    if (productType === "loose") {
      formData.append("unit", unit);
    }

    if (productType === "packed") {
      formData.append("packageWeight", packageWeight);
      formData.append("packageWeightUnit", packageWeightUnit);
    }

    images.forEach((img) => {
      if (img) formData.append("images", img.file);
    });

    selectedTaxes.forEach((taxId) => {
      formData.append("taxIds[]", taxId);
    });

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccessful(res.data.message);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create product");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/products")}>Products</span>{" "}
        <i className="bi bi-chevron-right"></i> Add Product
      </p>

      <div className="row m-0 p-3">
        <div className={`col-3 ${styles.longform}`}>
          <label>Created By</label>
          <input value={user?.name || ""} disabled />
        </div>
      </div>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Product Details</h5>

        <div className={`col-3 ${styles.longform}`}>
          <label>Product Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">--select--</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Product Type</label>
          <select
            value={productType}
            onChange={(e) => {
              setProductType(e.target.value);
              setUnit("");
              setPackageWeight("");
              setPackageWeightUnit("");
            }}
          >
            <option value="">--select--</option>
            <option value="packed">Packed</option>
            <option value="loose">Loose</option>
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Measurement Type</label>
          <select
            value={measurementType}
            onChange={(e) => {
              setMeasurementType(e.target.value);
              setUnit("");
            }}
          >
            <option value="">--select--</option>
            <option value="weight">Weight</option>
            <option value="length">Length</option>
            <option value="area">Area</option>
            <option value="count">Count</option>
          </select>
        </div>

        {productType === "loose" && measurementType && (
          <div className={`col-3 ${styles.longform}`}>
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">--select--</option>
              {MEASUREMENT_UNITS[measurementType].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}

        {productType === "packed" && (
          <>
            <div className={`col-3 ${styles.longform}`}>
              <label>Package Weight</label>
              <input
                value={packageWeight}
                onChange={(e) => setPackageWeight(e.target.value)}
              />
            </div>

            <div className={`col-3 ${styles.longform}`}>
              <label>Package Unit</label>
              <select
                value={packageWeightUnit}
                onChange={(e) => setPackageWeightUnit(e.target.value)}
              >
                <option value="">--select--</option>
                {PACKAGE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className={`col-6 ${styles.taxform}`}>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Images</h5>
        <ImageUpload images={images} setImages={setImages} />
      </div>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Taxes</h5>
        <TaxSelector
          selectedTaxes={selectedTaxes}
          setSelectedTaxes={setSelectedTaxes}
        />
      </div>

      <div className="row m-0 p-3">
        <h5 className={styles.head}>Pricing</h5>

        <div className={`col-3 ${styles.longform}`}>
          <label>Sale Price</label>
          <input
            value={baseprice}
            onChange={(e) => setBaseprice(e.target.value)}
          />
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Purchase Price</label>
          <input
            value={purchaseprice}
            onChange={(e) => setPurchaseprice(e.target.value)}
          />
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Min Stock</label>
          <input
            value={thresholdValue}
            onChange={(e) => setThresholdValue(e.target.value)}
          />
        </div>
      </div>

      <div className="row m-0 justify-content-center p-3">
        {!loading && !successful && (
          <div className="col-4">
            <button className="submitbtn" onClick={onCreateProduct}>
              Create
            </button>
            <button className="cancelbtn" onClick={() => navigate("/products")}>
              Cancel
            </button>
          </div>
        )}
        {successful && (
          <div className="col-6">
            <button className="submitbtn" onClick={() => navigate("/products")}>
              {successful}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default AddProduct;
