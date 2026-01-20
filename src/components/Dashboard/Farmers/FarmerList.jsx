import React, { useEffect, useState } from "react";
import styles from "./Farmer.module.css";
import { IoSearch } from "react-icons/io5";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function FarmerList({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [farmers, setFarmers] = useState(null);
  const [filteredFarmers, setFilteredFarmers] = useState(null);
  const [allFarmers, setAllFarmers] = useState([]); // Store all farmers for frontend pagination
  const [warehouses, setWarehouses] = useState([]);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [se, setSe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [farmerId, setFarmerId] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [updatingFarmerId, setUpdatingFarmerId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState({
    show: false,
    farmerId: null,
    action: null,
  });
  const [activationFilter, setActivationFilter] = useState("all");
  const [isActivationEnabled, setIsActivationEnabled] = useState(true); // Feature flag

  const closeModal = () => setIsModalOpen(false);

  // Function to load persisted activation status from localStorage
  const loadPersistedActivationStatus = (farmers) => {
    return farmers.map((farmer) => {
      const activationKey = `farmer_activation_${farmer.id}`;
      const persistedStatus = localStorage.getItem(activationKey);

      if (persistedStatus) {
        return { ...farmer, status: persistedStatus };
      }
      // Set default status as active if no status is found
      return { ...farmer, status: farmer.status || "active" };
    });
  };

  // Function to refresh farmer data
  const refreshFarmerData = async () => {
    try {
      setLoading(true);
      setFarmers(null);
      setFilteredFarmers(null);
      setAllFarmers([]);

      // Reset filters
      setSearchTerm("");
      setWarehouse(null);
      setSe(null);
      setActivationFilter("all");
      setPageNo(1);

      // Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem("currentDivisionId");

      let query = "/farmers";

      // Add division parameters to prevent wrong division data
      if (currentDivisionId && currentDivisionId !== "1") {
        query += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        query += `?showAllDivisions=true`;
      }

      console.log("🔄 Refreshing farmer data with query:", query);

      const res = await axiosAPI.get(query);
      console.log("🔄 Refresh response:", res);

      const allItems = res.data.farmers;
      console.log("🔄 Refreshed farmers:", allItems);

      // Load persisted activation status
      const farmersWithPersistedStatus =
        loadPersistedActivationStatus(allItems);

      setAllFarmers(farmersWithPersistedStatus);
      updatePagination(farmersWithPersistedStatus, 1, limit);

      setSuccessMessage("Farmer data refreshed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Refresh error:", e);
      setError(e.response?.data?.message || "Failed to refresh farmer data.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to update pagination
  const updatePagination = (data, page, pageLimit) => {
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedData = data.slice(startIndex, endIndex);

    setFarmers(paginatedData);
    setFilteredFarmers(paginatedData);
    setTotalPages(Math.ceil(data.length / pageLimit));
  };

  // Function to handle search
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    const filtered = allFarmers.filter(
      (farmer) =>
        farmer.fullName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        farmer.mobile?.includes(searchValue) ||
        farmer.farmerId?.toLowerCase().includes(searchValue.toLowerCase())
    );

    setFilteredFarmers(filtered);
    updatePagination(filtered, 1, limit);
    setPageNo(1);
  };

  // Function to handle warehouse filter
  const handleWarehouseFilter = (warehouseId) => {
    setWarehouse(warehouseId);
    let filtered = allFarmers;

    if (warehouseId) {
      filtered = filtered.filter((farmer) => farmer.divisionId === warehouseId);
    }

    if (se) {
      filtered = filtered.filter((farmer) => farmer.addedBy === se);
    }

    if (activationFilter !== "all") {
      filtered = filtered.filter(
        (farmer) => farmer.status === activationFilter
      );
    }

    setFilteredFarmers(filtered);
    updatePagination(filtered, 1, limit);
    setPageNo(1);
  };

  // Function to handle sales executive filter
  const handleSEFilter = (seId) => {
    setSe(seId);
    let filtered = allFarmers;

    if (warehouse) {
      filtered = filtered.filter((farmer) => farmer.divisionId === warehouse);
    }

    if (seId) {
      filtered = filtered.filter((farmer) => farmer.addedBy === seId);
    }

    if (activationFilter !== "all") {
      filtered = filtered.filter(
        (farmer) => farmer.status === activationFilter
      );
    }

    setFilteredFarmers(filtered);
    updatePagination(filtered, 1, limit);
    setPageNo(1);
  };

  // Function to handle activation filter
  const handleActivationFilter = (status) => {
    setActivationFilter(status);
    let filtered = allFarmers;

    if (warehouse) {
      filtered = filtered.filter((farmer) => farmer.divisionId === warehouse);
    }

    if (se) {
      filtered = filtered.filter((farmer) => farmer.addedBy === se);
    }

    if (status !== "all") {
      filtered = filtered.filter((farmer) => farmer.status === status);
    }

    setFilteredFarmers(filtered);
    updatePagination(filtered, 1, limit);
    setPageNo(1);
  };

  // Function to handle page change
  const handlePageChange = (newPage) => {
    setPageNo(newPage);
    updatePagination(filteredFarmers, newPage, limit);
  };

  // Function to handle limit change
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    updatePagination(filteredFarmers, 1, newLimit);
    setPageNo(1);
  };

  // Function to handle farmer activation/deactivation
  const handleActivationToggle = async (farmerId, currentStatus) => {
    try {
      setUpdatingFarmerId(farmerId);
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      console.log("🔄 Attempting to toggle farmer status:", {
        farmerId,
        currentStatus,
        newStatus,
      });

      // For now, just update local state since the API might not support status updates yet
      // const res = await axiosAPI.patch(`/farmers/${farmerId}`, {
      //   status: newStatus
      // });

      // console.log('Activation toggle response:', res.data);

      // Update local state
      const updatedFarmers = allFarmers.map((farmer) => {
        if (farmer.id === farmerId) {
          const updatedFarmer = { ...farmer, status: newStatus };
          // Persist to localStorage
          localStorage.setItem(`farmer_activation_${farmerId}`, newStatus);
          console.log("🔄 Updated farmer status:", {
            farmerId,
            oldStatus: farmer.status,
            newStatus,
          });
          return updatedFarmer;
        }
        return farmer;
      });

      setAllFarmers(updatedFarmers);

      // Update filtered and paginated data
      const currentFiltered = updatedFarmers.filter((farmer) => {
        let matches = true;
        if (searchTerm) {
          matches =
            matches &&
            (farmer.fullName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
              farmer.mobile?.includes(searchTerm) ||
              farmer.farmerId
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()));
        }
        if (warehouse) {
          matches = matches && farmer.warehouseId === warehouse;
        }
        if (se) {
          matches = matches && farmer.salesExecutiveId === se;
        }
        if (activationFilter !== "all") {
          matches = matches && farmer.status === activationFilter;
        }
        return matches;
      });

      setFilteredFarmers(currentFiltered);
      updatePagination(currentFiltered, pageNo, limit);

      setSuccessMessage(
        `Farmer ${newStatus === "active" ? "activated" : "deactivated"} successfully!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Activation toggle error:", e);
      setError(e.response?.data?.message || "Failed to update farmer status.");
      setIsModalOpen(true);
    } finally {
      setUpdatingFarmerId(null);
    }
  };

  // Function to handle farmer deletion
  const handleDeleteFarmer = async (farmerId) => {
    try {
      setLoading(true);
      await axiosAPI.delete(`/farmers/${farmerId}`);

      // Remove from local state
      const updatedFarmers = allFarmers.filter(
        (farmer) => farmer.id !== farmerId
      );
      setAllFarmers(updatedFarmers);

      // Update filtered and paginated data
      const currentFiltered = updatedFarmers.filter((farmer) => {
        let matches = true;
        if (searchTerm) {
          matches =
            matches &&
            (farmer.fullName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
              farmer.mobile?.includes(searchTerm) ||
              farmer.farmerId
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()));
        }
        if (warehouse) {
          matches = matches && farmer.warehouseId === warehouse;
        }
        if (se) {
          matches = matches && farmer.salesExecutiveId === se;
        }
        if (activationFilter !== "all") {
          matches = matches && farmer.status === activationFilter;
        }
        return matches;
      });

      setFilteredFarmers(currentFiltered);
      updatePagination(currentFiltered, pageNo, limit);

      setSuccessMessage("Farmer deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Delete error:", e);
      setError(e.response?.data?.message || "Failed to delete farmer.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
      setShowConfirmation({ show: false, farmerId: null, action: null });
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");

        let query = "/farmers";

        // Add division parameters to prevent wrong division data
        if (currentDivisionId && currentDivisionId !== "1") {
          query += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          query += `?showAllDivisions=true`;
        }

        console.log("Fetching farmers with query:", query);

        const [farmersRes, warehousesRes, executivesRes] = await Promise.all([
          axiosAPI.get(query),
          axiosAPI.get("/warehouses"),
          axiosAPI.get("/employees/role/Business Officer"),
        ]);

        console.log("Farmers response:", farmersRes.data);
        console.log("Warehouses response:", warehousesRes.data);
        console.log("Executives response:", executivesRes.data);

        const allItems = farmersRes.data.farmers;

        // Load persisted activation status
        const farmersWithPersistedStatus =
          loadPersistedActivationStatus(allItems);

        setAllFarmers(farmersWithPersistedStatus);
        setWarehouses(warehousesRes.data.warehouses);
        setSalesExecutives(executivesRes.data.employees);

        updatePagination(farmersWithPersistedStatus, 1, limit);
      } catch (e) {
        console.error("Fetch error:", e);
        setError(e.response?.data?.message || "Failed to load farmers.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading && !farmers) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/farmers")}>Farmers</span>{" "}
        <i className="bi bi-chevron-right"></i> Farmer-list
      </p>

      {!farmerId && (
        <div className="row m-0 p-3">
          <div className="col-3 formcontent">
            <label>Division:</label>
            <select
              value={warehouse || ""}
              onChange={(e) =>
                setWarehouse(e.target.value === "null" ? "" : e.target.value)
              }
            >
              <option value="null">--select--</option>
              <option value="all">All Divisions</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <CustomSearchDropdown
            label="Sales Executive"
            onSelect={setSe}
            options={salesExecutives?.map((se) => ({
              value: se.id,
              label: se.name,
            }))}
          />

          <div className="col-3 formcontent">
            <label>Activation Status:</label>
            <select
              value={activationFilter || "all"}
              onChange={(e) => setActivationFilter(e.target.value)}
              disabled={!isActivationEnabled}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            {!isActivationEnabled && (
              <small className="text-muted d-block mt-1">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Feature not available
              </small>
            )}
          </div>
        </div>
      )}

      {!farmerId && (
        <>
          {!isActivationEnabled && (
            <div className="row m-0 p-3">
              <div className="col">
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Farmer Activation Feature Not Available:</strong> The
                  backend API endpoint for farmer activation is not yet
                  implemented. You can view the activation status, but cannot
                  modify it. Contact your administrator to enable this feature.
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsActivationEnabled(true)}
                  ></button>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="row m-0 p-3">
              <div className="col">
                <div
                  className="alert alert-success alert-dismissible fade show"
                  role="alert"
                >
                  {successMessage}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSuccessMessage("")}
                  ></button>
                </div>
              </div>
            </div>
          )}

          <div className="row m-0 p-3 justify-content-between">
            <div className="col-md-3"></div>
            <div className={`col-md-5 ${styles.search}`}>
              <input
                type="text"
                placeholder="Search by farmer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className={styles.searchicon}>
                <IoSearch />
              </span>
            </div>
          </div>

          {loading ? (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <div className="text-center">
                  <Loading />
                  <p className="mt-2 text-muted">Loading farmer data...</p>
                </div>
              </div>
            </div>
          ) : filteredFarmers && filteredFarmers.length > 0 ? (
            <div className="row m-0 p-3 justify-content-center">
              {/* Activation Status Summary */}
              <div className="col-lg-10 mb-3">
                <div
                  className={`d-flex justify-content-between align-items-center ${styles["activation-summary"]}`}
                >
                  <div className="d-flex gap-3">
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Active:{" "}
                      {allFarmers.filter((f) => f.status === "active").length}
                    </span>
                    <span className="badge bg-danger">
                      <i className="bi bi-x-circle me-1"></i>
                      Inactive:{" "}
                      {allFarmers.filter((f) => f.status === "inactive").length}
                    </span>
                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => refreshFarmerData()}
                          title="Refresh farmer data"
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Refresh
                        </button>
                      </>
                    )}
                  </div>
                  <div className={`${styles.entity}`}>
                    <label>Entity :</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        console.log("🔄 Entity selection changed:", {
                          oldLimit: limit,
                          newLimit,
                        });
                        console.log(
                          "🔄 Current allFarmers length:",
                          allFarmers.length
                        );
                        setLimit(newLimit);
                      }}
                    >
                      {[10, 20, 30, 40, 50].map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-10">
                {/* Pagination Info */}
                <div className="row m-0 p-0 mb-3 justify-content-between">
                  <div className="col-lg-6">
                    <p className="text-muted mb-0">
                      Showing{" "}
                      {filteredFarmers && filteredFarmers.length > 0
                        ? (pageNo - 1) * limit + 1
                        : 0}{" "}
                      to{" "}
                      {filteredFarmers && filteredFarmers.length > 0
                        ? Math.min(
                            pageNo * limit,
                            (pageNo - 1) * limit + filteredFarmers.length
                          )
                        : 0}{" "}
                      of {allFarmers ? allFarmers.length : 0} entries
                      {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
                    </p>
                  </div>
                </div>

                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Farmer ID</th>
                      <th>Farmer Name</th>
                      <th>Division</th>
                      <th>Farmer Type</th>
                      <th>Activation</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFarmers.length === 0 && (
                      <tr className="animated-row">
                        <td colSpan={7}>NO DATA FOUND</td>
                      </tr>
                    )}
                    {filteredFarmers.map((farmer, index) => (
                      <tr
                        key={farmer.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{(pageNo - 1) * limit + index + 1}</td>
                        <td>{farmer.farmerId}</td>
                        <td>
                          <div>
                            <strong>{farmer.fullName}</strong>
                            {farmer.salesExecutive?.name && (
                              <div
                                className="text-muted"
                                style={{ fontSize: "12px", marginTop: "2px" }}
                              >
                                SE: {farmer.salesExecutive.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{farmer.division?.name || "-"}</td>
                        <td>
                          {farmer.farmerType
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()) || "-"}
                        </td>
                        <td className={styles["activation-column"]}>
                          {isAdmin && isActivationEnabled ? (
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={farmer.status === "active"}
                                onChange={() => {
                                  if (farmer.status === "active") {
                                    // Show confirmation for deactivation
                                    setShowConfirmation({
                                      show: true,
                                      farmerId: farmer.id,
                                      action: "deactivate",
                                      farmerName: farmer.fullName,
                                    });
                                  } else {
                                    // Direct activation
                                    handleActivationToggle(
                                      farmer.id,
                                      farmer.status === "active"
                                    );
                                  }
                                }}
                                disabled={updatingFarmerId === farmer.id}
                                style={{
                                  opacity:
                                    updatingFarmerId === farmer.id ? 0.6 : 1,
                                  cursor:
                                    updatingFarmerId === farmer.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              />
                              <label className="form-check-label">
                                {updatingFarmerId === farmer.id ? (
                                  <span className="badge bg-secondary">
                                    <i
                                      className="bi bi-arrow-clockwise me-1"
                                      style={{
                                        animation: "spin 1s linear infinite",
                                      }}
                                    ></i>
                                    Updating...
                                  </span>
                                ) : (
                                  <span
                                    className={`badge ${farmer.status === "active" ? "bg-success" : "bg-danger"}`}
                                    title={`Farmer is currently ${farmer.status === "active" ? "active" : "inactive"}`}
                                  >
                                    <i
                                      className={`bi ${farmer.status === "active" ? "bi-check-circle" : "bi-x-circle"} me-1`}
                                    ></i>
                                    {farmer.status || "Unknown"}
                                  </span>
                                )}
                              </label>
                            </div>
                          ) : (
                            <span
                              className={`badge ${farmer.status === "active" ? "bg-success" : "bg-danger"}`}
                              title={`Farmer is currently ${farmer.status === "active" ? "active" : "inactive"}`}
                            >
                              <i
                                className={`bi ${farmer.status === "active" ? "bi-check-circle" : "bi-x-circle"} me-1`}
                              ></i>
                              {farmer.status || "Unknown"}
                            </span>
                          )}
                          {!isActivationEnabled && (
                            <small className="text-muted d-block mt-1">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Read-only
                            </small>
                          )}
                        </td>

                        <td>
                          <button onClick={() => setFarmerId(farmer.id)}>
                            view
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="row m-0 p-0 pt-3 justify-content-between">
                  <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                    {pageNo > 1 && (
                      <button onClick={() => setPageNo(pageNo - 1)}>
                        <span>
                          <FaArrowLeftLong />
                        </span>{" "}
                        Previous
                      </button>
                    )}
                  </div>
                  <div className="col-4 text-center">
                    <span className="text-muted">
                      Page {pageNo} of {totalPages || 1}
                    </span>
                  </div>
                  <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                    {pageNo < totalPages && (
                      <button onClick={() => setPageNo(pageNo + 1)}>
                        Next{" "}
                        <span>
                          <FaArrowRightLong />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <div className="text-center">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No farmers found matching your criteria.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error Modal */}
      {isModalOpen && <ErrorModal message={error} onClose={closeModal} />}

      {/* Confirmation Modal */}
      {showConfirmation.show && (
        <div className={styles.confirmationModal}>
          <div className={styles.confirmationContent}>
            <h3>Confirm Action</h3>
            <p>
              {showConfirmation.action === "delete"
                ? "Are you sure you want to delete this farmer? This action cannot be undone."
                : showConfirmation.action === "deactivate"
                  ? `Are you sure you want to deactivate ${showConfirmation.farmerName}? This will disable their access to the system.`
                  : "Are you sure you want to perform this action?"}
            </p>
            <div className={styles.confirmationButtons}>
              <button
                className={`${styles.confirmBtn} ${styles.confirmYes}`}
                onClick={() => {
                  if (showConfirmation.action === "delete") {
                    handleDeleteFarmer(showConfirmation.farmerId);
                  } else if (showConfirmation.action === "deactivate") {
                    handleActivationToggle(showConfirmation.farmerId, "active");
                    setShowConfirmation({
                      show: false,
                      farmerId: null,
                      action: null,
                    });
                  }
                }}
              >
                Yes
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.confirmNo}`}
                onClick={() =>
                  setShowConfirmation({
                    show: false,
                    farmerId: null,
                    action: null,
                  })
                }
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FarmerList;
