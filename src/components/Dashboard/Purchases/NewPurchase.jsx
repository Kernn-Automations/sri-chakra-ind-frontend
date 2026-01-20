import React, { useEffect, useState } from "react";
import styles from "./Purchases.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import success from "../../../images/animations/SuccessAnimation.gif";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function NewPurchase({ navigate }) {
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [apiproducts, setApiproducts] = useState([]);
  const [selectedSKU, setSelectedSKU] = useState("");
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState({});
  const [taxSummary, setTaxSummary] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);

  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouse, setWarehouse] = useState();
  const [supplier, setSupplier] = useState();

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successmsg, setSuccessmsg] = useState("");

  const { axiosAPI } = useAuth();
  const user = JSON.parse(localStorage.getItem("user"));
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const now = new Date();
    const indianTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    setCurrentDate(indianTime.toISOString().slice(0, 10));
    setCurrentTime(indianTime.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoints
        let warehousesEndpoint = "/warehouse";
        let suppliersEndpoint = "/suppliers";
        let productsEndpoint = "/products/list";
        
        if (currentDivisionId && currentDivisionId !== '1') {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
          suppliersEndpoint += `?divisionId=${currentDivisionId}`;
          productsEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          warehousesEndpoint += `?showAllDivisions=true`;
          suppliersEndpoint += `?showAllDivisions=true`;
          productsEndpoint += `?showAllDivisions=true`;
        }
        
        console.log('NewPurchase - Fetching data with endpoints:');
        console.log('NewPurchase - Warehouses:', warehousesEndpoint);
        console.log('NewPurchase - Suppliers:', suppliersEndpoint);
        console.log('NewPurchase - Products:', productsEndpoint);
        console.log('NewPurchase - Division ID:', currentDivisionId);
        console.log('NewPurchase - Division Name:', currentDivisionName);
        
        const [w, s, p] = await Promise.all([
          axiosAPI.get(warehousesEndpoint),
          axiosAPI.get(suppliersEndpoint),
          axiosAPI.get(productsEndpoint),
        ]);
        setWarehouses(w.data.warehouses);
        setSuppliers(s.data.suppliers);
        setApiproducts(p.data.products);
        setAvailableProducts(p.data.products);
      } catch (e) {
        setError(e.response?.data?.message || "Error loading data");
        setIsModalOpen(true);
      }
    };
    fetchInitial();
  }, []);

  const calculateTaxBreakdown = (price, taxes) => {
    let breakdown = {};
    let totalTax = 0;

    if (!Array.isArray(taxes) || taxes.length === 0) {
      return { breakdown, totalTax };
    }

    taxes.forEach((tax) => {
      const percent = parseFloat(tax.percentage || 0);
      const taxAmt = (price * percent) / 100;
      breakdown[tax.name] = (breakdown[tax.name] || 0) + taxAmt;
      totalTax += taxAmt;
    });

    return { breakdown, totalTax };
  };

  const handleAddProduct = () => {
    const errs = {};
    if (!selectedSKU) errs.sku = true;
    if (!qty || qty <= 0) errs.qty = true;
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const prod = apiproducts.find((p) => p.SKU === selectedSKU);
    const purchasePrice = parseFloat(prod.purchasePrice);
    const quantity = parseInt(qty);

    const { breakdown, totalTax } = calculateTaxBreakdown(
      purchasePrice,
      prod.taxes
    );
    const finalPrice = purchasePrice + totalTax;
    const total = finalPrice * quantity;

    const newItem = {
      ...prod,
      quantity,
      taxBreakdown: breakdown,
      totalTax,
      amount: total,
    };

    setProducts((prev) => [...prev, newItem]);
    setAvailableProducts((prev) => prev.filter((p) => p.SKU !== prod.SKU));
    setSelectedSKU("");
    setQty("");
    setSelectedProduct(null);
    setErrors({});
  };

  useEffect(() => {
    const summary = {};
    let netTotal = 0;

    products.forEach((prod) => {
      netTotal += prod.amount;
      Object.entries(prod.taxBreakdown).forEach(([name, amt]) => {
        summary[name] = (summary[name] || 0) + amt;
      });
    });

    setTotalAmount(netTotal);
    setTaxSummary(summary);
  }, [products]);

  const handleDeleteProduct = (sku) => {
    const product = products.find((p) => p.SKU === sku);
    setProducts((prev) => prev.filter((p) => p.SKU !== sku));
    setAvailableProducts((prev) => [...prev, product]);
  };

  const onSubmit = async () => {
    if (!warehouse || !supplier || !products.length) {
      setError("Please select all fields and add at least one product.");
      setIsModalOpen(true);
      return;
    }

    const items = products.map((p) => ({
      productId: p.id,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
    }));

    try {
      setLoading(true);
      const res = await axiosAPI.post("/purchases", {
        warehouseId: warehouse,
        supplierId: supplier,
        items,
      });
      setSuccessmsg(res.data.message);
      setShowSuccess(true);
      setTimeout(() => navigate("/purchases"), 2100);
    } catch (e) {
      setError(e.response?.data?.message || "Submission failed");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onProductSelect = (e) => {
    const sku = e.target.value;
    setSelectedSKU(sku);
    const prod = apiproducts.find((p) => p.SKU === sku);
    setSelectedProduct(prod);
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/purchases")}>Purchase</span>{" "}
        <i className="bi bi-chevron-right"></i> + New Purchase Order
      </p>

      {!loading && !showSuccess && (
        <>
          {/* Header Info */}
          <div className="row m-0 p-3">
            <div className={`col-3 ${styles.longform}`}>
              <label>Date :</label>
              <input type="date" value={currentDate} readOnly />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>Time :</label>
              <input type="text" value={currentTime} readOnly />
            </div>
            <div className={`col-3 ${styles.longform}`}>
              <label>User ID :</label>
              <input type="text" value={user?.employeeId} readOnly />
            </div>
          </div>

          {/* Warehouse and Supplier */}
          <div className="row m-0 p-3">
          <h5 className={styles.head}>TO</h5>
            <CustomSearchDropdown
              label="Warehouse"
              onSelect={setWarehouse}
              options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
              showSelectAll={false}
            />
            <CustomSearchDropdown
              label="Vendor"
              onSelect={setSupplier}
              options={suppliers?.map((s) => ({ value: s.id, label: s.name }))}
              showSelectAll={false}
            />
          </div>

          {/* Product Table */}
          <div className="row m-0 p-3 justify-content-center">
            <h5 className={styles.head}>Products</h5>
            <div className="col-lg-9">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Taxes</th>
                    <th>Net</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.SKU}>
                      <td>{i + 1}</td>
                      <td>{p.SKU}</td>
                      <td>{p.name}</td>
                     <td>
                      {p.productType === "packed"
                        ? `packets (${p.packageWeight} ${p.packageWeightUnit})`
                        : p.unit}
                    </td>
                      <td>{p.quantity}</td>
                      <td>₹{parseFloat(p.purchasePrice).toFixed(2)}</td>
                      <td>
                        {Object.entries(p.taxBreakdown).map(([name, amt]) => (
                          <div key={name}>
                            {name}: ₹{amt.toFixed(2)}
                          </div>
                        ))}
                      </td>
                      <td>₹{p.amount.toFixed(2)}</td>
                      <td>
                        <button className={styles.removebtn} onClick={() => handleDeleteProduct(p.SKU)}>
                          <i className="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Add Product Row */}
                  <tr className={styles.tableform}>
                    <td>#</td>
                    <td colSpan={2}>
                      <select
                        value={selectedSKU}
                        onChange={onProductSelect}
                        className={errors.sku ? styles.errorinput : ""}
                      >
                        <option value="">--select product--</option>
                        {availableProducts.map((p) => (
                          <option key={p.SKU} value={p.SKU}>
                            {p.SKU} - {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{selectedProduct?.unit}</td>

                    <td colSpan={1}>
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="Qty"
                        className={errors.qty ? styles.errorinput : ""}
                      />
                    </td>
                    <td>{selectedProduct?.purchasePrice}</td>
                    <td>
                      {selectedProduct?.taxes?.map((t) => (
                        <div key={t.name}>
                          {t.name} ({t.percentage}%)
                        </div>
                      ))}
                    </td>
                    <td colSpan={2}>
                      <button
                        className={styles.addbtn}
                        onClick={handleAddProduct}
                      >
                        + Add Product
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tax Summary */}
              <div className={`pt-3 ${styles.taxes}`}>
                <strong>Total Purchase Amount:</strong> ₹
                {totalAmount.toFixed(2)}
                <br />
                {Object.entries(taxSummary).map(([name, amount]) => (
                  <div key={name}>
                    <strong>{name}:</strong> ₹{amount.toFixed(2)}
                  </div>
                ))}
                <div className={`mt-2 ${styles.total}`}>
                  <strong>Grand Total:</strong> ₹
                  {(
                    totalAmount +
                    Object.values(taxSummary).reduce((a, b) => a + b, 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Submit/Cancel */}
          <div className="row m-0 p-3 pt-4 justify-content-center">
            <div className="col-3">
              <button className="submitbtn" onClick={onSubmit}>
                Order
              </button>
              <button
                className="cancelbtn"
                onClick={() => navigate("/purchases")}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {showSuccess && <LoadingAnimation gif={success} msg={successmsg} />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
    </>
  );
}

export default NewPurchase;
