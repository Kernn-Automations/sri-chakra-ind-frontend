import React, { useState } from "react";
import DetailsTab from "./DetailsTab";
import OrdersTab from "./OrdersTab";
import styles from "../../Dashboard/Warehouses/Components/WarehouseTabSection.module.css";

function CustomerTabSection({ customer }) {
  const [activeTab, setActiveTab] = useState("Details");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return <DetailsTab customer={customer} />;
      case "Orders":
        return <OrdersTab customer={customer} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        {["Details", "Orders"].map((tab) => (
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

export default CustomerTabSection;

