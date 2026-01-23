import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import TaxSelector from "./TaxSelector";
import ImageUpload from "./ImageUpload";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import axios from "axios";
import { CheckCircle, X, AlertCircle } from "lucide-react";

function AddProduct({ navigate }) {
  const { axiosAPI } = useAuth();

  /* -------------------------
   * MASTER DATA
   * ------------------------- */
  const [categories, setCategories] = useState([]);
  const [taxeslist, setTaxeslist] = useState([]);

  /* -------------------------
   * UI STATE
   * ------------------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState("");

  /* -------------------------
   * PRODUCT FIELDS
   * ------------------------- */
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [purchasePrice, setPurchasePrice] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  const [productType, setProductType] = useState("");
  const [measurementType, setMeasurementType] = useState("");
  const [unit, setUnit] = useState("");

  const [packageWeight, setPackageWeight] = useState("");
  const [packageWeightUnit, setPackageWeightUnit] = useState("");

  const [unitPrices, setUnitPrices] = useState([]);
  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [images, setImages] = useState([null]);

  const [taxSearch, setTaxSearch] = useState("");

  const [conversionUnits, setConversionUnits] = useState([]);

  const getInventoryUnit = () => {
    if (measurementType === "weight") return "kg";
    if (measurementType === "length") return "m";
    if (measurementType === "area") return "sq_m";
    if (measurementType === "count") return "nos";
    return "";
  };

  useEffect(() => {
    const inventoryUnit = getInventoryUnit();
    if (!inventoryUnit) return;

    setConversionUnits((prev) => {
      const existing = prev.map((c) => c.fromUnit);

      const needed = unitPrices
        .map((u) => u.unit)
        .filter((u) => u && u !== inventoryUnit && !existing.includes(u));

      return [
        ...prev,
        ...needed.map((u) => ({
          fromUnit: u,
          toUnit: inventoryUnit,
          conversionType: "FIXED",
          factor: "",
          length: "",
          width: "",
          thickness: "",
          density: "",
          roundingRule: "NONE",
        })),
      ];
    });
  }, [unitPrices, measurementType]);

  const updateConversion = (index, key, value) => {
    setConversionUnits((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    );
  };

  const removeConversion = (fromUnit) => {
    setConversionUnits((prev) => prev.filter((c) => c.fromUnit !== fromUnit));
  };

  const filteredTaxes = taxeslist.filter(
    (t) =>
      t.name.toLowerCase().includes(taxSearch.toLowerCase()) ||
      String(t.rate).includes(taxSearch),
  );

  const totalTaxPercentage = selectedTaxes.reduce((total, taxId) => {
    const tax = taxeslist.find((t) => t.id === taxId);
    if (!tax) return total;

    let taxPercent = parseFloat(tax.percentage || 0);

    if (tax.isCess && tax.cessPercentage) {
      taxPercent += parseFloat(tax.cessPercentage);
    }

    return total + taxPercent;
  }, 0);

  /* -------------------------
   * UNIT MAPS
   * ------------------------- */
  const MEASUREMENT_UNITS = {
    weight: ["mg", "g", "kg", "ton", "mt"],
    length: ["mm", "cm", "m", "ft", "inch", "yard", "rmt"],
    area: ["sq_mm", "sq_cm", "sq_m", "sq_ft", "sq_yd"],
    count: ["nos", "pcs", "bundle", "sheet", "coil", "panel", "set"],
  };

  const ALL_UNITS = [
    "mg",
    "g",
    "kg",
    "ton",
    "mt",
    "sq_mm",
    "sq_cm",
    "sq_m",
    "sq_ft",
    "sq_yd",
    "mm",
    "cm",
    "m",
    "ft",
    "inch",
    "yard",
    "rmt",
    "nos",
    "pcs",
    "bundle",
    "sheet",
    "coil",
    "panel",
    "set",
  ];

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

  /* -------------------------
   * FETCH MASTER DATA
   * ------------------------- */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [categoriesRes, taxesRes] = await Promise.all([
          axiosAPI.get("/categories/list"),
          axiosAPI.get("/tax"),
        ]);
        setCategories(categoriesRes.data.categories || []);
        setTaxeslist(taxesRes.data.taxes || []);
      } catch {
        setError("Failed to load data");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [axiosAPI]);

  /* -------------------------
   * AUTO-HIDE SUCCESS MESSAGE
   * ------------------------- */
  useEffect(() => {
    if (successful) {
      const timer = setTimeout(() => {
        setSuccessful("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successful]);

  /* -------------------------
   * INDIAN NUMBER FORMATTING
   * ------------------------- */
  const formatIndianNumber = (num) => {
    if (!num) return "";
    const number = parseFloat(num);
    if (isNaN(number)) return "";
    return number.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  const parseIndianNumber = (str) => {
    if (!str) return "";
    return str.replace(/,/g, "");
  };

  /* -------------------------
   * VALIDATION
   * ------------------------- */
  const validate = () => {
    if (!name || !sku || !category)
      return "Name, SKU and Category are required";

    if (!purchasePrice || !thresholdValue)
      return "Purchase price and min stock are required";

    if (!productType || !measurementType)
      return "Product type and measurement type are required";

    if (productType === "loose" && !unit)
      return "Base unit is required for loose products";

    if (productType === "packed" && (!packageWeight || !packageWeightUnit))
      return "Package weight and unit are required";

    if (!unitPrices.length) return "At least one unit price must be added";

    const defaults = unitPrices.filter((u) => u.isDefault);
    if (defaults.length !== 1)
      return "Exactly one unit price must be marked as default";

    return null;
  };

  /* -------------------------
   * UNIT PRICE HANDLERS
   * ------------------------- */
  const addUnitPrice = () => {
    setUnitPrices((p) => [...p, { unit: "", price: "", isDefault: false }]);
  };

  const updateUnitPrice = (index, key, value) => {
    setUnitPrices((prev) =>
      prev.map((u, i) =>
        i === index
          ? {
              ...u,
              [key]: value,
              ...(key === "isDefault" && { isDefault: true }),
            }
          : key === "isDefault"
            ? { ...u, isDefault: false }
            : u,
      ),
    );
  };

  const removeUnitPrice = (index) => {
    setUnitPrices((prev) => prev.filter((_, i) => i !== index));
  };

  /* -------------------------
   * SUBMIT
   * ------------------------- */
  const onCreate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setIsModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("SKU", sku);
    formData.append("description", description);
    formData.append("categoryId", category);
    formData.append("purchasePrice", purchasePrice);
    formData.append("thresholdValue", thresholdValue);
    formData.append("productType", productType);
    formData.append("measurementType", measurementType);

    if (productType === "loose") formData.append("unit", unit);
    if (productType === "packed") {
      formData.append("packageWeight", packageWeight);
      formData.append("packageWeightUnit", packageWeightUnit);
    }

    formData.append("unitPrices", JSON.stringify(unitPrices));
    selectedTaxes.forEach((t) => formData.append("taxIds[]", t));
    images.forEach((img) => img && formData.append("images", img.file));

    formData.append(
      "conversionUnits",
      JSON.stringify(
        conversionUnits.filter(
          (c) =>
            (c.conversionType === "FIXED" && c.factor) ||
            (c.conversionType === "FORMULA" && c.density),
        ),
      ),
    );

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (res.status === 201) {
        setSuccessful(res.data.message || "Product created successfully");

        setName("");
        setSku("");
        setCategory("");
        setDescription("");
        setPurchasePrice("");
        setThresholdValue("");
        setProductType("");
        setMeasurementType("");
        setUnit("");
        setPackageWeight("");
        setPackageWeightUnit("");
        setUnitPrices([]);
        setSelectedTaxes([]);
        setImages([null]);

        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create product");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
   * RENDER
   * ------------------------- */
  return (
    <div style={styles.page}>
      {/* SUCCESS NOTIFICATION */}
      {successful && (
        <div style={styles.successBanner}>
          <div style={styles.successContent}>
            <CheckCircle size={20} />
            <span>{successful}</span>
          </div>
          <button style={styles.closeBtn} onClick={() => setSuccessful("")}>
            <X size={18} />
          </button>
        </div>
      )}

      <div style={styles.header}>
        <h2 style={styles.title}>Add New Product</h2>
        <p style={styles.subtitle}>
          Fill in the details below to create a new product
        </p>
      </div>

      {/* PRODUCT DETAILS */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Product Details</h4>
          <span style={styles.badge}>Required</span>
        </div>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Product Name *</label>
            <input
              style={styles.input}
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>SKU *</label>
            <input
              style={styles.input}
              placeholder="Enter SKU code"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Category *</label>
            <select
              style={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            placeholder="Enter product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      {/* CONFIG */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Product Configuration</h4>
          <span style={styles.badge}>Required</span>
        </div>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Product Type *</label>
            <select
              style={styles.input}
              value={productType}
              onChange={(e) => {
                setProductType(e.target.value);
                setMeasurementType("");
                setUnit("");
                setUnitPrices([]);
              }}
            >
              <option value="">Select type</option>
              <option value="loose">Loose</option>
              <option value="packed">Packed</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Measurement Type *</label>
            <select
              style={{
                ...styles.input,
                ...(!productType && styles.inputDisabled),
              }}
              value={measurementType}
              disabled={!productType}
              onChange={(e) => {
                setMeasurementType(e.target.value);
                setUnit("");
                setUnitPrices([]);
              }}
            >
              <option value="">Select measurement</option>
              {Object.keys(MEASUREMENT_UNITS).map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {productType === "loose" && measurementType && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Base Unit *</label>
              <select
                style={styles.input}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="">Select unit</option>
                {MEASUREMENT_UNITS[measurementType].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* UNIT PRICING */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Unit-wise Pricing</h4>
          <span style={styles.infoText}>
            <AlertCircle size={14} style={{ marginRight: 4 }} />
            Exactly one default unit required
          </span>
        </div>

        {unitPrices.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Price (₹)</th>
                  <th style={styles.th}>Default</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {unitPrices.map((u, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>
                      <select
                        style={styles.tableInput}
                        value={u.unit}
                        onChange={(e) =>
                          updateUnitPrice(i, "unit", e.target.value)
                        }
                      >
                        <option value="">Select unit</option>
                        {ALL_UNITS.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.priceInputWrapper}>
                        <span style={styles.rupeeSymbol}>₹</span>
                        <input
                          style={styles.priceInput}
                          type="text"
                          placeholder="0.00"
                          value={u.price ? formatIndianNumber(u.price) : ""}
                          onChange={(e) => {
                            const value = parseIndianNumber(e.target.value);
                            updateUnitPrice(i, "price", value);
                          }}
                          onBlur={(e) => {
                            const value = parseIndianNumber(e.target.value);
                            if (value) {
                              updateUnitPrice(i, "price", value);
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td style={styles.tdCenter}>
                      <input
                        type="radio"
                        checked={u.isDefault}
                        onChange={() => updateUnitPrice(i, "isDefault", true)}
                        style={styles.radio}
                      />
                    </td>
                    <td style={styles.tdCenter}>
                      <button
                        style={styles.removeBtn}
                        onClick={() => removeUnitPrice(i)}
                        title="Remove unit"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <AlertCircle size={32} color="#94a3b8" />
            <p style={styles.emptyText}>No unit prices added yet</p>
          </div>
        )}

        <button style={styles.addBtn} onClick={addUnitPrice}>
          + Add Unit Price
        </button>
      </section>

      {/* UNIT CONVERSIONS */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Unit Conversions</h4>
          <span style={styles.infoText}>
            Required to sell in multiple units
          </span>
        </div>

        {conversionUnits.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>
            No conversion rules required
          </p>
        ) : (
          conversionUnits.map((c, i) => (
            <div
              key={c.fromUnit}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <strong>
                {c.fromUnit} → {c.toUnit}
              </strong>

              <div style={styles.grid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Conversion Type</label>
                  <select
                    style={styles.input}
                    value={c.conversionType}
                    onChange={(e) =>
                      updateConversion(i, "conversionType", e.target.value)
                    }
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="FORMULA">Formula</option>
                  </select>
                </div>

                {c.conversionType === "FIXED" && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Factor</label>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="e.g. 2.5"
                      value={c.factor}
                      onChange={(e) =>
                        updateConversion(i, "factor", e.target.value)
                      }
                    />
                  </div>
                )}

                {c.conversionType === "FORMULA" && (
                  <>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Length (m)</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={c.length}
                        onChange={(e) =>
                          updateConversion(i, "length", e.target.value)
                        }
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Width (m)</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={c.width}
                        onChange={(e) =>
                          updateConversion(i, "width", e.target.value)
                        }
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Thickness (mm)</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={c.thickness}
                        onChange={(e) =>
                          updateConversion(i, "thickness", e.target.value)
                        }
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Density (kg/m³)</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={c.density}
                        onChange={(e) =>
                          updateConversion(i, "density", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* TAX LINKING - NEW SECTION */}
      {/* TAX LINKING - IMPROVED SECTION */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Tax Linking</h4>
          <span style={styles.infoText}>
            <AlertCircle size={14} style={{ marginRight: 4 }} />
            Multiple taxes can be applied
          </span>
        </div>

        {/* SEARCH */}
        <input
          style={styles.taxSearch}
          placeholder="Search tax by name or rate…"
          value={taxSearch}
          onChange={(e) => setTaxSearch(e.target.value)}
        />

        {/* TAX LIST */}
        <div style={styles.taxScrollArea}>
          {filteredTaxes.map((tax) => {
            const selected = selectedTaxes.includes(tax.id);

            return (
              <div
                key={tax.id}
                onClick={() =>
                  selected
                    ? setSelectedTaxes(
                        selectedTaxes.filter((id) => id !== tax.id),
                      )
                    : setSelectedTaxes([...selectedTaxes, tax.id])
                }
                style={{
                  ...styles.taxRow,
                  ...(selected && styles.taxRowSelected),
                }}
              >
                <div style={styles.taxContent}>
                  <div style={styles.taxHeader}>
                    <span style={styles.taxName}>{tax.name}</span>
                    <span style={styles.taxRate}>{tax.percentage}%</span>
                  </div>

                  <div style={styles.taxMeta}>
                    <span>HSN: {tax.hsnCode}</span>
                    <span>• Applicable on: {tax.applicableOn}</span>
                  </div>

                  <div style={styles.taxBadges}>
                    <span style={styles.badgeNeutral}>{tax.taxNature}</span>

                    {tax.isCess && (
                      <span style={styles.badgeWarning}>
                        Cess {tax.cessPercentage}%
                      </span>
                    )}

                    {tax.isAdditionalDuty && (
                      <span style={styles.badgeWarning}>Additional Duty</span>
                    )}

                    <span
                      style={
                        tax.status === "Active"
                          ? styles.badgeSuccess
                          : styles.badgeDisabled
                      }
                    >
                      {tax.status}
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  style={styles.taxCheckbox}
                />
              </div>
            );
          })}
        </div>

        {/* SELECTED SUMMARY */}
        {selectedTaxes.length > 0 && (
          <div style={styles.selectedBar}>
            <div style={styles.selectedInfo}>
              <span style={styles.selectedCount}>
                {selectedTaxes.length} tax
                {selectedTaxes.length > 1 ? "es" : ""} selected
              </span>

              <span style={styles.totalTax}>
                Total Tax: <strong>{totalTaxPercentage.toFixed(2)}%</strong>
              </span>
            </div>

            <button
              style={styles.clearTaxesBtn}
              onClick={() => setSelectedTaxes([])}
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* IMAGES - NEW SECTION 
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Product Images</h4>
          <span style={styles.infoText}>
            Upload high-quality product images
          </span>
        </div>
        <div style={styles.imageSection}>
          <ImageUpload images={images} setImages={setImages} />
        </div>
      </section>*/}

      {/* INVENTORY */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>Inventory Settings</h4>
          <span style={styles.badge}>Required</span>
        </div>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Purchase Price *</label>
            <div style={styles.priceInputWrapper}>
              <span style={styles.rupeeSymbol}>₹</span>
              <input
                style={styles.priceInput}
                type="text"
                placeholder="0.00"
                value={purchasePrice ? formatIndianNumber(purchasePrice) : ""}
                onChange={(e) => {
                  const value = parseIndianNumber(e.target.value);
                  setPurchasePrice(value);
                }}
                onBlur={(e) => {
                  const value = parseIndianNumber(e.target.value);
                  if (value) {
                    setPurchasePrice(value);
                  }
                }}
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Minimum Stock *</label>
            <input
              style={styles.input}
              type="number"
              placeholder="0"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div style={styles.actions}>
        <button style={styles.primaryBtn} onClick={onCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Product"}
        </button>
        <button
          style={styles.secondaryBtn}
          onClick={() => navigate("/products")}
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal
          isOpen
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

/* -------------------------
 * INLINE STYLES (UPDATED)
 * ------------------------- */
const styles = {
  page: {
    padding: "32px",
    background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
    minHeight: "100vh",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  successBanner: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#10b981",
    color: "white",
    padding: "16px 20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    zIndex: 1000,
    minWidth: "320px",
    animation: "slideIn 0.3s ease-out",
  },
  successContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: "500",
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "6px",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  card: {
    background: "#fff",
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    transition: "box-shadow 0.2s",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  badge: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  infoText: {
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "4px",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    background: "#fff",
  },
  inputDisabled: {
    background: "#f8fafc",
    cursor: "not-allowed",
    color: "#94a3b8",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "all 0.2s",
    outline: "none",
  },
  // NEW TAX SECTION STYLES

  // NEW IMAGE SECTION STYLES
  imageSection: {
    padding: "16px 0",
  },
  tableContainer: {
    overflowX: "auto",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
  },
  tr: {
    transition: "background 0.2s",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
  },
  tdCenter: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
  },
  tableInput: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  },
  priceInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  rupeeSymbol: {
    position: "absolute",
    left: "12px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    pointerEvents: "none",
    zIndex: 1,
  },
  priceInput: {
    padding: "12px 16px 12px 28px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    background: "#fff",
    width: "100%",
  },
  radio: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#003176",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#94a3b8",
  },
  emptyText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#64748b",
  },
  addBtn: {
    padding: "10px 20px",
    background: "#003176",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0, 49, 118, 0.2)",
  },
  removeBtn: {
    background: "#fee2e2",
    border: "none",
    color: "#dc2626",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  actions: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginTop: "32px",
    paddingTop: "24px",
  },
  primaryBtn: {
    background: "#003176",
    color: "#fff",
    padding: "14px 32px",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(0, 49, 118, 0.3)",
  },
  secondaryBtn: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "14px 32px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  // NEW TAX SECTION STYLES
  taxContainer: {
    padding: "16px 0",
  },
  taxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  taxItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  taxItemHover: {
    background: "#f1f5f9",
    borderColor: "#cbd5e1",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  taxInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  taxName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
  },
  taxRate: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  checkboxInput: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
    width: 0,
    height: 0,
  },
  checkboxCustom: {
    width: "20px",
    height: "20px",
    border: "2px solid #e2e8f0",
    borderRadius: "6px",
    position: "relative",
    transition: "all 0.2s",
    background: "#fff",
  },
  checkboxCustomChecked: {
    background: "#003176",
    borderColor: "#003176",
  },
  checkboxCustomCheckedAfter: {
    content: '""',
    position: "absolute",
    left: "5px",
    top: "2px",
    width: "6px",
    height: "10px",
    border: "solid white",
    borderWidth: "0 2px 2px 0",
    transform: "rotate(45deg)",
  },
  selectedTaxes: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#eff6ff",
    borderRadius: "10px",
    border: "1px solid #bfdbfe",
  },
  selectedCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e40af",
  },
  clearTaxesBtn: {
    background: "transparent",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  taxSearch: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    marginBottom: "16px",
    fontSize: "14px",
  },

  taxScrollArea: {
    maxHeight: "320px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "4px",
  },

  taxRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  taxRowSelected: {
    background: "#eff6ff",
    borderColor: "#60a5fa",
    boxShadow: "0 4px 12px rgba(59,130,246,0.15)",
  },

  taxCheckbox: {
    width: "18px",
    height: "18px",
    accentColor: "#003176",
    pointerEvents: "none",
  },

  selectedBar: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#e0f2fe",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "600",
  },
  taxContent: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  taxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  taxMeta: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  taxBadges: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "4px",
  },

  badgeNeutral: {
    background: "#e2e8f0",
    color: "#334155",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },

  badgeSuccess: {
    background: "#dcfce7",
    color: "#166534",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },

  badgeWarning: {
    background: "#ffedd5",
    color: "#9a3412",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },

  badgeDisabled: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  selectedInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  totalTax: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
};

export default AddProduct;
