import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

/* -------------------------
 * CREATE QUOTATION
 * ------------------------- */
function CreateQuotation() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  /* -------------------------
   * STATE
   * ------------------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Customer, 2: Products, 3: Review

  const [customerType, setCustomerType] = useState("existing");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const [prospect, setProspect] = useState({
    name: "",
    mobile: "",
    email: "",
    company: "",
  });

  const [products, setProducts] = useState([]);
  const [quotationItems, setQuotationItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  const [notes, setNotes] = useState("");
  const [validTill, setValidTill] = useState("");

  /* -------------------------
   * FETCH CUSTOMERS
   * ------------------------- */
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await axiosAPI.get("/customers");
        setCustomers(res.data?.customers || []);
      } catch {
        /* silent */
      }
    }
    fetchCustomers();
  }, [axiosAPI]);

  /* -------------------------
   * LOAD PRODUCTS
   * ------------------------- */
  async function loadProductsForExistingCustomer(customer) {
    try {
      setLoading(true);
      setSelectedCustomer(customer);
      const res = await axiosAPI.get(`/customers/${customer.id}`);
      console.log(res);
      setProducts(res.data?.productsAndDiscounting?.products || []);
      setQuotationItems([]);
    } catch {
      setError("Failed to load customer products");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductsForNewCustomer() {
    try {
      setLoading(true);
      const res = await axiosAPI.get("/products");
      console.log(res);
      setProducts(res.data?.products || []);
      setQuotationItems([]);
    } catch {
      setError("Failed to load products");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
   * HANDLE CUSTOMER TYPE CHANGE
   * ------------------------- */
  useEffect(() => {
    setSelectedCustomer(null);
    setQuotationItems([]);
    setProducts([]);

    if (customerType === "new") {
      loadProductsForNewCustomer();
    }
  }, [customerType]);

  const convertToMeters = (value, unit) => {
    const v = Number(value || 0);
    switch (unit) {
      case "mm":
        return v / 1000;
      case "cm":
        return v / 100;
      case "m":
        return v;
      case "ft":
        return v * 0.3048;
      case "inch":
        return v * 0.0254;
      default:
        return v;
    }
  };

  function updateItem(index, key, value) {
    setQuotationItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        let updated = { ...item, [key]: value };

        // When unit changes, reset RMT
        if (key === "unit") {
          updated.price = Number(
            item.unitPrices.find((u) => u.unit === value)?.price || 0,
          );
          updated.customPrice = null;
          updated.rmtFactor = "";
          updated.rmtMeters = 0;
        }

        // If RMT fields change → recalc meters
        if (
          updated.unit === "rmt" &&
          (key === "rmtFactor" || key === "rmtUnit")
        ) {
          updated.rmtMeters = convertToMeters(
            key === "rmtFactor" ? value : updated.rmtFactor,
            key === "rmtUnit" ? value : updated.rmtUnit,
          );
        }

        return updated;
      }),
    );
  }

  /* -------------------------
   * ADD PRODUCT
   * ------------------------- */
  function addProduct(product) {
    if (quotationItems.find((i) => i.productId === product.id)) return;

    const defaultUnit =
      product.defaultUnit || product.unitPrices?.find((u) => u.isDefault)?.unit;

    const defaultPrice =
      product.defaultPrice ||
      product.unitPrices?.find((u) => u.isDefault)?.price ||
      0;

    setQuotationItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.SKU || product.sku,
        unitPrices: product.unitPrices || [],
        unitConversions: product.unitConversions || [], // ✅ ADD THIS
        unit: defaultUnit,
        price: Number(defaultPrice),
        quantity: 1,
        customPrice: null,
        taxes: product.taxes || [],

        // ✅ NEW
        rmtFactor: "",
        rmtUnit: "mm",
        rmtMeters: 0,
      },
    ]);
  }

  function removeItem(index) {
    setQuotationItems((prev) => prev.filter((_, i) => i !== index));
  }

  const normalizeLengthToMeters = (value, unit) => {
    const v = Number(value || 0);
    switch (unit) {
      case "mm":
        return v / 1000;
      case "cm":
        return v / 100;
      case "m":
        return v;
      case "ft":
        return v * 0.3048;
      case "inch":
        return v * 0.0254;
      default:
        return v;
    }
  };

  const calculateWeightKg = (item) => {
    try {
      console.log("🧾 Calculating weight for item:", item);

      if (!item.unitConversions?.length) {
        console.error("❌ No unitConversions found for item", item.productId);
        return null;
      }

      const conv = item.unitConversions.find(
        (c) => c.fromUnit === item.unit && c.toUnit === "kg",
      );

      if (!conv) {
        console.error("❌ No KG conversion found", item.unitConversions);
        return null;
      }

      const quantity = Number(item.quantity || 0);
      if (!quantity || isNaN(quantity)) {
        console.error("❌ Invalid quantity:", item.quantity);
        return null;
      }

      // ---------------- FIXED CONVERSION ----------------
      if (conv.conversionType === "FIXED") {
        const factor = Number(conv.factor || 0);
        if (!factor) {
          console.error("❌ FIXED conversion missing factor", conv);
          return null;
        }
        const result = quantity * factor;
        return result;
      }

      // ---------------- FORMULA CONVERSION ----------------
      const formula = conv.formula;
      if (!formula) {
        console.error("❌ FORMULA conversion missing formula object", conv);
        return null;
      }

      const thicknessM = Number(formula.thickness) / 1000; // mm → m
      const widthM = Number(formula.width);
      const density = Number(formula.density);
      let lengthPerUnitM = Number(formula.length);

      if ([thicknessM, widthM, density, lengthPerUnitM].some((v) => isNaN(v))) {
        console.error("❌ Invalid formula numbers", formula);
        return null;
      }

      // ✅ RMT adjustment (length multiplier only)
      if (item.unit === "rmt") {
        if (!item.rmtFactor) {
          console.error("❌ RMT selected but rmtFactor missing", item);
          return null;
        }

        const factorMeters = normalizeLengthToMeters(
          item.rmtFactor,
          item.rmtUnit,
        );

        lengthPerUnitM = lengthPerUnitM * factorMeters;
      }

      const weightPerUnit = lengthPerUnitM * widthM * thicknessM * density;

      if (isNaN(weightPerUnit)) {
        console.error("❌ weightPerUnit became NaN", {
          lengthPerUnitM,
          widthM,
          thicknessM,
          density,
        });
        return null;
      }

      const totalKg = weightPerUnit * quantity;

      return totalKg > 0 ? totalKg : null;
    } catch (err) {
      console.error("🔥 Weight calculation crashed:", err, item);
      return null;
    }
  };

  /* -------------------------
   * CALCULATIONS
   * ------------------------- */
  const calculations = quotationItems.reduce(
    (acc, item) => {
      const unitPrice =
        item.customPrice !== null
          ? Number(item.customPrice)
          : Number(item.price);
      const baseAmount =
        item.unit === "rmt"
          ? unitPrice * item.quantity * Number(item.rmtFactor || 0)
          : unitPrice * item.quantity;

      let itemTaxAmount = 0;
      item.taxes?.forEach((tax) => {
        if (tax.taxNature !== "Exempt") {
          itemTaxAmount += (baseAmount * Number(tax.percentage)) / 100;
        }
      });

      acc.subtotal += baseAmount;
      acc.taxAmount += itemTaxAmount;
      acc.total += baseAmount + itemTaxAmount;

      return acc;
    },
    { subtotal: 0, taxAmount: 0, total: 0 },
  );

  /* -------------------------
   * VALIDATION
   * ------------------------- */
  const canProceedToStep2 =
    (customerType === "existing" && selectedCustomer) ||
    (customerType === "new" && prospect.name && prospect.mobile);

  const canProceedToStep3 = quotationItems.length > 0;

  /* -------------------------
   * SUBMIT
   * ------------------------- */
  async function createQuotation() {
    try {
      setLoading(true);

      const payload = {
        customerId: customerType === "existing" ? selectedCustomer.id : null,
        prospect:
          customerType === "new"
            ? {
                name: prospect.name,
                mobile: prospect.mobile,
                email: prospect.email,
                company: prospect.company,
              }
            : null,
        validTill,
        notes,
        items: quotationItems.map((i) => ({
          productId: i.productId,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice:
            i.customPrice !== null ? Number(i.customPrice) : Number(i.price),

          // ✅ NEW
          rmtFactor: i.unit === "rmt" ? Number(i.rmtFactor) : null,
          rmtUnit: i.unit === "rmt" ? i.rmtUnit : null,
        })),
      };

      const res = await axiosAPI.post("/quotations", payload);
      navigate(`/sales/quotations/${res.data.quotation.id}`);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create quotation");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
   * FILTERED DATA
   * ------------------------- */
  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  /* -------------------------
   * RENDER
   * ------------------------- */
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Create New Quotation</h2>
          <p style={styles.subtitle}>
            Follow the steps to create a professional quotation
          </p>
        </div>
        <button
          style={styles.cancelBtn}
          onClick={() => navigate("/sales/quotations")}
        >
          Cancel
        </button>
      </div>

      {/* PROGRESS STEPPER */}
      <div style={styles.stepper}>
        <div style={styles.stepperContainer}>
          {[
            { num: 1, label: "Customer" },
            { num: 2, label: "Products" },
            { num: 3, label: "Review" },
          ].map((step, idx) => (
            <React.Fragment key={step.num}>
              <div
                style={{
                  ...styles.stepItem,
                  ...(currentStep >= step.num ? styles.stepItemActive : {}),
                }}
              >
                <div
                  style={{
                    ...styles.stepCircle,
                    ...(currentStep >= step.num ? styles.stepCircleActive : {}),
                  }}
                >
                  {currentStep > step.num ? "✓" : step.num}
                </div>
                <span style={styles.stepLabel}>{step.label}</span>
              </div>
              {idx < 2 && <div style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: CUSTOMER */}
      {currentStep === 1 && (
        <div style={styles.stepContent}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Select Customer Type</h3>
            <div style={styles.radioGroup}>
              <label
                style={{
                  ...styles.radioCard,
                  ...(customerType === "existing"
                    ? styles.radioCardActive
                    : {}),
                }}
              >
                <input
                  type="radio"
                  checked={customerType === "existing"}
                  onChange={() => setCustomerType("existing")}
                  style={styles.radioInput}
                />
                <div style={styles.radioContent}>
                  <div style={styles.radioIcon}></div>
                  <div>
                    <div style={styles.radioTitle}>Existing Customer</div>
                    <div style={styles.radioDesc}>
                      Select from your customer database
                    </div>
                  </div>
                </div>
              </label>

              <label
                style={{
                  ...styles.radioCard,
                  ...(customerType === "new" ? styles.radioCardActive : {}),
                }}
              >
                <input
                  type="radio"
                  checked={customerType === "new"}
                  onChange={() => setCustomerType("new")}
                  style={styles.radioInput}
                />
                <div style={styles.radioContent}>
                  <div style={styles.radioIcon}></div>
                  <div>
                    <div style={styles.radioTitle}>New Prospect</div>
                    <div style={styles.radioDesc}>
                      Create quotation for a new customer
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {customerType === "existing" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Select Customer</h3>
              <div style={styles.searchWrapper}>
                <svg
                  style={styles.searchIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  style={styles.searchInput}
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div style={styles.customerList}>
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...styles.customerCard,
                      ...(selectedCustomer?.id === c.id
                        ? styles.customerCardActive
                        : {}),
                    }}
                    onClick={() => loadProductsForExistingCustomer(c)}
                  >
                    <div style={styles.customerAvatar}>
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.customerInfo}>
                      <div style={styles.customerName}>{c.name}</div>
                      <div style={styles.customerMeta}>
                        {c.mobile} {c.email && `• ${c.email}`}
                      </div>
                    </div>
                    {selectedCustomer?.id === c.id && (
                      <div style={styles.checkmark}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {customerType === "new" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Prospect Information</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Customer Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    style={styles.input}
                    placeholder="Enter customer name"
                    value={prospect.name}
                    onChange={(e) =>
                      setProspect({ ...prospect, name: e.target.value })
                    }
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Mobile Number <span style={styles.required}>*</span>
                  </label>
                  <input
                    style={styles.input}
                    placeholder="Enter mobile number"
                    value={prospect.mobile}
                    onChange={(e) =>
                      setProspect({ ...prospect, mobile: e.target.value })
                    }
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email (Optional)</label>
                  <input
                    style={styles.input}
                    placeholder="Enter email address"
                    type="email"
                    value={prospect.email}
                    onChange={(e) =>
                      setProspect({ ...prospect, email: e.target.value })
                    }
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Company (Optional)</label>
                  <input
                    style={styles.input}
                    placeholder="Enter company name"
                    value={prospect.company}
                    onChange={(e) =>
                      setProspect({ ...prospect, company: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div style={styles.stepActions}>
            <button
              style={{
                ...styles.primaryBtn,
                ...(canProceedToStep2 ? {} : styles.btnDisabled),
              }}
              disabled={!canProceedToStep2}
              onClick={() => canProceedToStep2 && setCurrentStep(2)}
            >
              Continue to Products →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PRODUCTS */}
      {currentStep === 2 && (
        <div style={styles.stepContent}>
          {products.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Add Products</h3>
              <div style={styles.searchWrapper}>
                <svg
                  style={styles.searchIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  style={styles.searchInput}
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div style={styles.productGrid}>
                {filteredProducts.map((p) => {
                  const isAdded = quotationItems.find(
                    (i) => i.productId === p.id,
                  );
                  return (
                    <button
                      key={p.id}
                      style={{
                        ...styles.productCard,
                        ...(isAdded ? styles.productCardAdded : {}),
                      }}
                      onClick={() => !isAdded && addProduct(p)}
                      disabled={!!isAdded}
                    >
                      <div style={styles.productName}>{p.name}</div>
                      {p.SKU && (
                        <div style={styles.productSku}>SKU: {p.SKU}</div>
                      )}
                      {isAdded && <div style={styles.addedBadge}>Added ✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {quotationItems.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Selected Items</h3>
              <div style={styles.itemsTable}>
                <div style={styles.tableHeader}>
                  <div style={styles.thProduct}>Product</div>
                  <div style={styles.thUnit}>Unit</div>
                  <div style={styles.thQty}>Qty</div>
                  <div style={styles.thPrice}>Unit Price (₹)</div>
                  <div style={styles.thTotal}>Total (₹)</div>
                  <div style={styles.thAction}></div>
                </div>

                {quotationItems.map((item, idx) => {
                  const unitPrice =
                    item.customPrice !== null
                      ? Number(item.customPrice)
                      : Number(item.price);
                  const baseAmount =
                    item.unit === "rmt"
                      ? unitPrice * item.quantity * Number(item.rmtFactor || 0)
                      : unitPrice * item.quantity;

                  let itemTax = 0;
                  item.taxes?.forEach((tax) => {
                    if (tax.taxNature !== "Exempt") {
                      itemTax += (baseAmount * Number(tax.percentage)) / 100;
                    }
                  });

                  return (
                    <div key={idx} style={styles.tableRow}>
                      <div style={styles.tdProduct}>
                        <div style={styles.itemName}>{item.name}</div>
                        {item.sku && (
                          <div style={styles.itemSku}>{item.sku}</div>
                        )}
                        {item.unit === "rmt" && item.rmtMeters > 0 && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            Weight: {calculateWeightKg(item)?.toFixed(2)} kg
                          </div>
                        )}
                      </div>

                      <div style={styles.tdUnit}>
                        <select
                          style={styles.selectSmall}
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(idx, "unit", e.target.value)
                          }
                        >
                          {item.unitPrices.map((u) => (
                            <option key={u.unit} value={u.unit}>
                              {u.unit}
                            </option>
                          ))}
                        </select>

                        {item.unit === "rmt" && (
                          <div style={{ marginTop: 6 }}>
                            <input
                              type="number"
                              placeholder="Width"
                              value={item.rmtFactor}
                              onChange={(e) =>
                                updateItem(idx, "rmtFactor", e.target.value)
                              }
                              style={{ ...styles.inputSmall, marginBottom: 4 }}
                            />
                            <select
                              value={item.rmtUnit}
                              onChange={(e) =>
                                updateItem(idx, "rmtUnit", e.target.value)
                              }
                              style={styles.selectSmall}
                            >
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                              <option value="ft">ft</option>
                              <option value="inch">inch</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div style={styles.tdQty}>
                        <input
                          style={styles.inputSmall}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", Number(e.target.value))
                          }
                        />
                      </div>

                      <div style={styles.tdPrice}>
                        <input
                          style={styles.inputSmall}
                          type="number"
                          step="0.01"
                          value={item.customPrice ?? item.price}
                          onChange={(e) =>
                            updateItem(idx, "customPrice", e.target.value)
                          }
                        />
                      </div>

                      <div style={styles.tdTotal}>
                        <div style={styles.totalValue}>
                          {(baseAmount + itemTax).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        {itemTax > 0 && (
                          <div style={styles.taxInfo}>
                            +₹
                            {itemTax.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            tax
                          </div>
                        )}
                      </div>

                      <div style={styles.tdAction}>
                        <button
                          style={styles.removeBtn}
                          onClick={() => removeItem(idx)}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SUMMARY */}
              <div style={styles.summary}>
                <div style={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {calculations.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span>Tax Amount</span>
                  <span>
                    ₹
                    {calculations.taxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div style={styles.summaryTotal}>
                  <span>Total Amount</span>
                  <span>
                    ₹
                    {calculations.total.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={styles.stepActions}>
            <button
              style={styles.secondaryBtn}
              onClick={() => setCurrentStep(1)}
            >
              ← Back
            </button>
            <button
              style={{
                ...styles.primaryBtn,
                ...(canProceedToStep3 ? {} : styles.btnDisabled),
              }}
              disabled={!canProceedToStep3}
              onClick={() => canProceedToStep3 && setCurrentStep(3)}
            >
              Continue to Review →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW */}
      {currentStep === 3 && (
        <div style={styles.stepContent}>
          <div style={styles.reviewGrid}>
            {/* CUSTOMER INFO */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Customer Details</h3>
              <div style={styles.reviewInfo}>
                <div style={styles.reviewLabel}>Name</div>
                <div style={styles.reviewValue}>
                  {customerType === "existing"
                    ? selectedCustomer?.name
                    : prospect.name}
                </div>
              </div>
              <div style={styles.reviewInfo}>
                <div style={styles.reviewLabel}>Mobile</div>
                <div style={styles.reviewValue}>
                  {customerType === "existing"
                    ? selectedCustomer?.mobile
                    : prospect.mobile}
                </div>
              </div>
              {((customerType === "existing" && selectedCustomer?.email) ||
                (customerType === "new" && prospect.email)) && (
                <div style={styles.reviewInfo}>
                  <div style={styles.reviewLabel}>Email</div>
                  <div style={styles.reviewValue}>
                    {customerType === "existing"
                      ? selectedCustomer?.email
                      : prospect.email}
                  </div>
                </div>
              )}
            </div>

            {/* QUOTATION SETTINGS */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Quotation Settings</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Valid Until</label>
                <input
                  style={styles.input}
                  type="date"
                  value={validTill}
                  onChange={(e) => setValidTill(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Add any notes or terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ITEMS SUMMARY */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Items Summary</h3>
            <div style={styles.reviewItems}>
              {quotationItems.map((item, idx) => {
                const unitPrice =
                  item.customPrice !== null
                    ? Number(item.customPrice)
                    : Number(item.price);
                const baseAmount =
                  item.unit === "rmt"
                    ? unitPrice * item.quantity * Number(item.rmtFactor || 0)
                    : unitPrice * item.quantity;

                return (
                  <div key={idx} style={styles.reviewItem}>
                    <div style={styles.reviewItemInfo}>
                      <div style={styles.reviewItemName}>{item.name}</div>
                      <div style={styles.reviewItemMeta}>
                        {item.unit === "rmt"
                          ? `${item.quantity} × ${item.rmtFactor || 0}${item.rmtUnit} (RMT) @ ₹${unitPrice}`
                          : `${item.quantity} × ${item.unit} @ ₹${unitPrice}`}
                        {item.unit === "rmt" && item.rmtMeters > 0 && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            Weight: {calculateWeightKg(item)?.toFixed(2)} kg
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={styles.reviewItemAmount}>
                      ₹{baseAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.reviewTotals}>
              <div style={styles.reviewTotalRow}>
                <span>Subtotal</span>
                <span>
                  ₹
                  {calculations.subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div style={styles.reviewTotalRow}>
                <span>Tax Amount</span>
                <span>
                  ₹
                  {calculations.taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div style={styles.reviewTotal}>
                <span>Grand Total</span>
                <span>
                  ₹
                  {calculations.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.stepActions}>
            <button
              style={styles.secondaryBtn}
              onClick={() => setCurrentStep(2)}
            >
              ← Back
            </button>
            <button style={styles.primaryBtn} onClick={createQuotation}>
              Create Quotation ✓
            </button>
          </div>
        </div>
      )}

      {loading && <Loading />}
      {showError && (
        <ErrorModal
          isOpen
          message={error}
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
}

/* -------------------------
 * STYLES
 * ------------------------- */
const styles = {
  page: {
    padding: "32px",
    background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
    minHeight: "100vh",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    color: "#64748b",
  },

  // STEPPER
  stepper: {
    background: "#fff",
    padding: "32px",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  stepperContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "600px",
    margin: "0 auto",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    opacity: 0.5,
    transition: "opacity 0.3s",
  },
  stepItemActive: {
    opacity: 1,
  },
  stepCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#e2e8f0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "16px",
    transition: "all 0.3s",
  },
  stepCircleActive: {
    background: "#003176",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,49,118,0.3)",
  },
  stepLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#64748b",
  },
  stepLine: {
    flex: 1,
    height: "2px",
    background: "#e2e8f0",
    margin: "0 16px",
    maxWidth: "120px",
  },

  // STEP CONTENT
  stepContent: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    margin: "0 0 20px 0",
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
  },

  // RADIO CARDS
  radioGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  radioCard: {
    padding: "20px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#fff",
  },
  radioCardActive: {
    borderColor: "#003176",
    background: "#f0f5ff",
  },
  radioInput: {
    display: "none",
  },
  radioContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  radioIcon: {
    fontSize: "32px",
  },
  radioTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  radioDesc: {
    fontSize: "13px",
    color: "#64748b",
  },

  // SEARCH
  searchWrapper: {
    position: "relative",
    marginBottom: "20px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "18px",
    height: "18px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 44px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
  },

  // CUSTOMER LIST
  customerList: {
    display: "grid",
    gap: "12px",
    maxHeight: "400px",
    overflowY: "auto",
  },
  customerCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  customerCardActive: {
    borderColor: "#003176",
    background: "#f0f5ff",
  },
  customerAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #003176, #0052cc)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  customerMeta: {
    fontSize: "13px",
    color: "#64748b",
  },
  checkmark: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
  },

  // FORM
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
  },
  required: {
    color: "#dc2626",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },

  // PRODUCTS
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  productCard: {
    padding: "16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    position: "relative",
  },
  productCardAdded: {
    borderColor: "#16a34a",
    background: "#f0fdf4",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  productName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  productSku: {
    fontSize: "12px",
    color: "#64748b",
  },
  addedBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "#16a34a",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
  },

  // ITEMS TABLE
  itemsTable: {
    marginBottom: "20px",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 120px 100px 140px 140px 40px",
    gap: "12px",
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "12px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  thProduct: { textAlign: "left" },
  thUnit: { textAlign: "left" },
  thQty: { textAlign: "left" },
  thPrice: { textAlign: "left" },
  thTotal: { textAlign: "right" },
  thAction: { textAlign: "right" },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 120px 100px 140px 140px 40px",
    gap: "12px",
    padding: "16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "8px",
    alignItems: "center",
  },
  tdProduct: {},
  tdUnit: {},
  tdQty: {},
  tdPrice: {},
  tdTotal: { textAlign: "right" },
  tdAction: { textAlign: "right" },
  itemName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "2px",
  },
  itemSku: {
    fontSize: "12px",
    color: "#64748b",
  },
  selectSmall: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  },
  inputSmall: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  },
  totalValue: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#0f172a",
  },
  taxInfo: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  removeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  // SUMMARY
  summary: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "2px solid #e2e8f0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "14px",
    color: "#64748b",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 0 0 0",
    marginTop: "8px",
    borderTop: "2px solid #e2e8f0",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
  },

  // REVIEW
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  reviewInfo: {
    marginBottom: "12px",
  },
  reviewLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  reviewValue: {
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: 500,
  },
  reviewItems: {
    marginBottom: "20px",
  },
  reviewItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  reviewItemInfo: {},
  reviewItemName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  reviewItemMeta: {
    fontSize: "13px",
    color: "#64748b",
  },
  reviewItemAmount: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#0f172a",
  },
  reviewTotals: {
    paddingTop: "16px",
    borderTop: "2px solid #e2e8f0",
  },
  reviewTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "14px",
    color: "#64748b",
  },
  reviewTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px 0 0 0",
    marginTop: "8px",
    borderTop: "2px solid #e2e8f0",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
  },

  // ACTIONS
  stepActions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "24px",
  },
  primaryBtn: {
    background: "#003176",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: "10px",
    border: "none",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,49,118,0.2)",
  },
  secondaryBtn: {
    background: "#fff",
    color: "#475569",
    padding: "14px 28px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

export default CreateQuotation;
