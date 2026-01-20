import React, { useState } from "react";
import DetailsTab from "./DetailsTab";
import PerformanceTab from "./PerformanceTab";
import styles from "../../Dashboard/Warehouses/Components/WarehouseTabSection.module.css";

function EmployeeTabSection({ employee }) {
  const [activeTab, setActiveTab] = useState("Details");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return <DetailsTab employee={employee} />;
      case "Performance":
        return <PerformanceTab employee={employee} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        {["Details", "Performance"].map((tab) => (
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

export default EmployeeTabSection;















