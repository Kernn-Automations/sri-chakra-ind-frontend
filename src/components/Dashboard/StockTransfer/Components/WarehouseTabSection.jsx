import React, { useState } from "react";
import DetailsTab from "./DetailsTab";
import InventoryTab from "./InventoryTab";
import WarehouseActivityTab from "./WarehouseActivityTab";
import WarehouseStockSummaryTab from "./WarehouseStockSummaryTab";
import styles from './WarehouseTabSection.module.css';

function WarehouseTabSection({ warehouseDetails }) {
  const { warehouse, inventory, activities, stockSummary, ordersToDispatch, ordersToDeliver, totalTurnover } = warehouseDetails;

  const [activeTab, setActiveTab] = useState("Details");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return (
          <DetailsTab
            warehouse={{
              ...warehouse,
              manager: warehouseDetails.manager,
              ordersToDispatch,
              ordersToDeliver,
              totalTurnover,
            }}
          />
        );
      case "Inventory":
        return <InventoryTab inventory={inventory} />;
      case "Activity":
        return <WarehouseActivityTab activities={activities} />;
      case "StockSummary":
        return <WarehouseStockSummaryTab stockSummary={stockSummary} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        {["Details", "Inventory", "Activity", "StockSummary"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
}

export default WarehouseTabSection;
