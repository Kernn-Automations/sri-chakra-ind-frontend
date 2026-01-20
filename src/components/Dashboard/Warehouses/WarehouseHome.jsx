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
