import React from "react";
import styles from "./InventoryTab.module.css"; // Custom CSS module

function InventoryTab({ inventory = [] }) {
  return (
    <div className={styles.gridContainer}>
      {inventory.length === 0 ? (
        <div className={styles.emptyState}>No inventory available.</div>
      ) : (
        inventory.map((item, index) => {
          const imageUrl =
            item.images && item.images.length > 0
              ? item.images[0]
              : "/placeholder.png";

          return (
            <div key={index} className={styles.card}>
              <img
                src={imageUrl}
                alt={item.name}
                className={styles.productImage}
              />
              <div className={styles.cardBody}>
                <h5 className={styles.productName}>{item.name}</h5>
                <p className={styles.productDetails}>
                  Quantity: <strong>{item.quantity}</strong>{" "}
                  {item.productType === "packed" ? "packets" : item.unit}
                </p>
                {item.productType === "packed" && (
                  <p className={styles.packInfo}>
                    Pack: {item.packageWeight} {item.packageWeightUnit}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default InventoryTab;
