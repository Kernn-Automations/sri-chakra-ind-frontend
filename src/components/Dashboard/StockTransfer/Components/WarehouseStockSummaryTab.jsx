import React, { useState, useMemo } from "react";
import styles from "./WarehouseStockSummaryTab.module.css";

function WarehouseStockSummaryTab({ stockSummary = {} }) {
  // ✅ Flatten the nested stock summary into product-wise structure
  const flattened = useMemo(() => {
    const map = {};

    for (const year in stockSummary) {
      for (const month in stockSummary[year]) {
        for (const day in stockSummary[year][month]) {
          const dateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          const products = stockSummary[year][month][day];

          if (!products || typeof products !== "object") continue;

          for (const productId in products) {
            const product = products[productId];
            if (!product) continue;

            const { productName, opening, inward, outward, closing } = product;

            if (!map[productId]) {
              map[productId] = {
                productName: productName || "NA",
                summary: [],
              };
            }

            map[productId].summary.push({
              date: dateString,
              opening,
              inward,
              outward,
              closing,
            });
          }
        }
      }
    }

    // Sort each product's summary by date
    for (const productId in map) {
      map[productId].summary.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return map;
  }, [stockSummary]);

  const productIds = Object.keys(flattened);
  const [selectedProduct, setSelectedProduct] = useState(productIds[0] || "");

  if (productIds.length === 0) {
    return <div className={styles.empty}>No stock summary available.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Tabs for each product */}
      <div className={styles.tabList}>
        {productIds.map((productId) => (
          <button
            key={productId}
            className={`${styles.tab} ${selectedProduct === productId ? styles.active : ""}`}
            onClick={() => setSelectedProduct(productId)}
          >
            {flattened[productId].productName}
          </button>
        ))}
      </div>

      {/* Stock summary table */}
      <div className={styles.tableWrapper}>
        <table className="table table-bordered borderedtable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opening</th>
              <th>Inward</th>
              <th>Outward</th>
              <th>Closing</th>
            </tr>
          </thead>
          <tbody>
            {flattened[selectedProduct]?.summary?.map((entry, index) => (
              <tr key={index}>
                <td>{entry.date}</td>
                <td>{entry.opening ?? "-"}</td>
                <td className="text-success">{entry.inward != null ? `+${entry.inward}` : "-"}</td>
                <td className="text-danger">{entry.outward != null ? `-${entry.outward}` : "-"}</td>
                <td>{entry.closing ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WarehouseStockSummaryTab;
