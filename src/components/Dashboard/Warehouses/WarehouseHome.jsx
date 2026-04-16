import React from "react";
import NewWarehouseViewModal from "./NewWarehouseViewModal";
import DeleteWarehouseViewModal from "./DeleteWarehouseViewModal";
import OngoingWarehousesPage from "./OngoingWarehouse";
import { useState } from "react";

function WarehouseHome({ navigate, managers, products, isAdmin }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWarehouseCreated = () => {
    setRefreshKey((prev) => prev + 1); // 🔁 trigger refetch
  };
  return (
    <>
      <div className="row m-0 p-3">
        <div className="col">
          <div
            style={{
              marginBottom: "16px",
              padding: "16px 18px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #fff7ed, #eff6ff)",
              border: "1px solid #dbeafe",
              color: "#334155",
              lineHeight: 1.7,
            }}
          >
            <strong>Warehouse setup guide:</strong> Create the warehouse first, then enter only opening stock you already physically hold. For steel items, keep one clean stock unit in the product master and let the system show derived views like sheets, coils, bundles, or rmt from that same stock.
          </div>
          {isAdmin && (
            <>
              <NewWarehouseViewModal
                managers={managers}
                products={products}
                onSuccess={handleWarehouseCreated}
              />
              <DeleteWarehouseViewModal />
            </>
          )}
        </div>
      </div>

      {/* Direct Embed of Ongoing Warehouses */}
      <div className="p-3">
        <OngoingWarehousesPage navigate={navigate} refreshKey={refreshKey} />
      </div>
    </>
  );
}

export default WarehouseHome;
