import React, { useState, useEffect } from "react";
import styles from "./Payments.module.css";
import { useAuth } from "@/Auth";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";

function CreateCreditNote({ navigate }) {
  const [customers, setCustomers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [status, setStatus] = useState("Pending");
  const [note, setNote] = useState("");

  const [selectedSKU, setSelectedSKU] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [particulars, setParticulars] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [success, setSucess] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
    navigate("/payments/credit-notes");
  };

  // 🔹 Fetch customers and products initially
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          axiosAPI.get("/customers"),
          axiosAPI.get("/products"),
        ]);

        setCustomers(custRes.data.customers || []);
        setAvailableProducts(prodRes.data.products || []);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchInitialData();
  }, [axiosAPI]);

  // 🔹 Fetch sales orders when customer changes
  useEffect(() => {
    const fetchSalesOrders = async () => {
      if (!selectedCustomer) {
        setSalesOrders([]);
        return;
      }
      try {
        const orderRes = await axiosAPI.get(
          `/sales-orders?customerId=${selectedCustomer}`
        );
        console.log(orderRes);
        setSalesOrders(orderRes.data.salesOrders || []);
      } catch (err) {
        console.error("Error fetching sales orders:", err);
      }
    };
    fetchSalesOrders();
  }, [selectedCustomer, axiosAPI]);

  // 🔹 Handle Product Selection
  const onProductSelect = (e) => {
    const sku = e.target.value;
    setSelectedSKU(sku);
    const product = availableProducts.find((p) => p.SKU === sku);
    setSelectedProduct(product || null);
  };

  // 🔹 Add product to list
  const handleAddProduct = () => {
    const errs = {};
    if (!selectedSKU) errs.sku = true;
    if (!qty || qty <= 0) errs.qty = true;
    if (!particulars.trim()) errs.particulars = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const existing = products.find((p) => p.SKU === selectedSKU);
    if (existing) {
      alert("Product already added!");
      return;
    }

    const newProduct = {
      ...selectedProduct,
      quantity: parseFloat(qty),
      particulars: particulars.trim(),
      amount: selectedProduct.purchasePrice * qty,
      taxBreakdown:
        selectedProduct.taxes?.reduce((acc, t) => {
          acc[t.name] =
            (t.percentage / 100) * selectedProduct.purchasePrice * qty;
          return acc;
        }, {}) || {},
    };

    setProducts((prev) => [...prev, newProduct]);
    setSelectedProduct(null);
    setSelectedSKU("");
    setQty("");
    setParticulars("");
    setErrors({});
  };

  // 🔹 Remove Product
  const handleDeleteProduct = (sku) => {
    setProducts(products.filter((p) => p.SKU !== sku));
  };

  // 🔹 Submit Credit Note
  const handleSubmit = async () => {
    if (!selectedCustomer || products.length === 0) {
      alert("Please fill all fields and add at least one product.");
      return;
    }

    const payload = {
      customerId: selectedCustomer,
      salesOrderId: selectedOrder,
      note,
      status,
      creditNoteDetails: products.map((p) => ({
        productName: p.name,
        quantity: p.quantity,
        price: p.purchasePrice,
        particulars: p.particulars,
        productType: p.productType,
        packageWeight: p.packageWeight,
        packageWeightUnit: p.packageWeightUnit,
      })),
    };

    try {
      setLoading(true);
      const res = await axiosAPI.post("/credit-notes/manual", payload);
      console.log("Response:", res);
      setSucess(res.data.message || "✅ Credit Note Created Successfully!");
      setIsModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/payments/credit-notes")}>
          Credit-Notes
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Create Credit-Note
      </p>

      {/* Form Section */}
      <div className="row m-0 p-3">
        <div className={`col-3 ${styles.longform}`}>
          <label>Customer :</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">--select--</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Sales Orders :</label>
          <select
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            disabled={!selectedCustomer}
          >
            <option value="">--select--</option>
            {salesOrders.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} - {s.orderNumber}
              </option>
            ))}
          </select>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Status :</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      <div className="row m-0 p-3 pt-1 ps-5">
        <div className={`col-3 ${styles.taxform}`}>
          <textarea
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* Product Table */}
      <div className="row m-0 p-3 justify-content-center">
        <h5 className={styles.head}>Products</h5>
        <div className="col-lg-10">
          <table className="table table-bordered borderedtable">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Particulars</th>
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
                  <td>₹{p.purchasePrice}</td>
                  <td>{p.particulars}</td>

                  <td>₹{p.amount?.toFixed(2)}</td>
                  <td>
                    <button
                      className={styles.removebtn}
                      onClick={() => handleDeleteProduct(p.SKU)}
                    >
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
                <td>
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
                  <input
                    type="text"
                    value={particulars}
                    onChange={(e) => setParticulars(e.target.value)}
                    placeholder="Particulars"
                    className={errors.particulars ? styles.errorinput : ""}
                  />
                </td>
                <td colSpan={2}>
                  <button className={styles.addbtn} onClick={handleAddProduct}>
                    + Add Product
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Submit Button */}
          <div className="text-center mt-5">
            <button
              className={`submitbtn`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Create"}
            </button>

            <button
              className={`cancelbtn`}
              onClick={() => navigate("/payments/credit-notes")}
            >
              cancel
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && error && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {isModalOpen && success && (
        <SuccessModal
          isOpen={isModalOpen}
          message={success}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default CreateCreditNote;
