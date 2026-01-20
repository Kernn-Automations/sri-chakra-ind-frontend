import React, { useState, useEffect } from "react";
import styles from "./Purchases.module.css";

const ConfirmStockInModal = ({
  isOpen,
  onClose,
  products = [],
  damagedGoods = [],
  setDamagedGoods,
  onConfirm, // Parent handles upload and API!
}) => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [tableRows, setTableRows] = useState(damagedGoods || []);

  useEffect(() => {
    setDamagedGoods && setDamagedGoods(tableRows);
    // eslint-disable-next-line
  }, [tableRows]);

  // Add a damaged good
  const handleAddProduct = () => {
    if (!selectedProduct || !qty) return;
    const product =
      products.find((p) => (p.SKU || p.sku) === selectedProduct) || {};
    if (!product.name) return;
    if (tableRows.some((row) => row.sku === (product.SKU || product.sku))) return;
    const maxQty = product.quantity || 0;
    if (Number(qty) <= 0 || Number(qty) > maxQty) return;

    setTableRows([
      ...tableRows,
      {
        sku: product.SKU || product.sku,
        name: product.name,
        unit: product.unit,
        orderedQty: product.quantity,
        damagedQty: Number(qty),
        net:
          Number(qty) *
          (parseFloat(product.purchasePrice || product.unitPrice || 0)),
        image: null,
        imagePreview: null,
      },
    ]);
    setSelectedProduct("");
    setQty("");
  };

  // Remove a damaged good
  const handleDelete = (idx) => {
    setTableRows(tableRows.filter((_, i) => i !== idx));
  };

  // Image upload
  const handleImageUpload = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const newRows = [...tableRows];
    newRows[idx].image = file;

    // For preview (optional)
    const reader = new FileReader();
    reader.onloadend = () => {
      newRows[idx].imagePreview = reader.result;
      setTableRows(newRows);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ minWidth: 1000 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Damaged Goods</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <table className={`table table-bordered ${styles.borderedtable}`}>
          <thead>
            <tr>
              <th>#</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Ordered Qty</th>
              <th>Damaged Qty</th>
              <th>Net Amount</th>
              <th>Action</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {/* Row to add a new damaged product */}
            <tr>
              <td>#</td>
              <td>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ minWidth: 120 }}
                >
                  <option value="">--select product--</option>
                  {products.map((prod) => (
                    <option key={prod.SKU || prod.sku} value={prod.SKU || prod.sku}>
                      {(prod.SKU || prod.sku) + " - " + prod.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {
                  products.find(
                    (p) => (p.SKU || p.sku) === selectedProduct
                  )?.name || ""
                }
              </td>
              <td>
                {
                  products.find(
                    (p) => (p.SKU || p.sku) === selectedProduct
                  )?.unit || ""
                }
              </td>
              <td>
                {
                  products.find(
                    (p) => (p.SKU || p.sku) === selectedProduct
                  )?.quantity || ""
                }
              </td>
              <td>
                <input
                  type="number"
                  value={qty}
                  min={1}
                  max={
                    products.find(
                      (p) => (p.SKU || p.sku) === selectedProduct
                    )?.quantity || 1
                  }
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="Damaged Qty"
                  style={{ width: 90 }}
                />
              </td>
              <td>
                {selectedProduct && qty
                  ? (
                      qty *
                      (parseFloat(
                        products.find(
                          (p) => (p.SKU || p.sku) === selectedProduct
                        )?.purchasePrice ||
                          products.find(
                            (p) => (p.SKU || p.sku) === selectedProduct
                          )?.unitPrice ||
                          0
                      ))
                    ).toFixed(2)
                  : ""}
              </td>
              <td>
                <button
                  className="btn btn-success"
                  style={{ fontWeight: "bold", fontSize: 13 }}
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || !qty}
                >
                  + Add Product
                </button>
              </td>
              <td></td>
            </tr>
            {/* Render damaged rows */}
            {tableRows.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{row.sku}</td>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{row.orderedQty}</td>
                <td>{row.damagedQty}</td>
                <td>{row.net.toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(idx)}
                    style={{ fontWeight: "bold", fontSize: 13 }}
                  >
                    Delete
                  </button>
                </td>
                <td>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, idx)}
                  />
                  {row.imagePreview && (
                    <img
                      src={row.imagePreview}
                      alt="Preview"
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        marginTop: 4,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
            {tableRows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>
                  No damaged goods added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ marginRight: 10 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (onConfirm) onConfirm(tableRows);
              onClose();
            }}
          >
            Confirm Stock In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStockInModal;
