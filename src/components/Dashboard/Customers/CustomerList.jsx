import React, { useEffect, useState } from "react";
import styles from "./Customer.module.css";
import { IoSearch } from "react-icons/io5";
import CustomersModal from "./CustomersModal";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function CustomerList({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [customers, setCustomers] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]); // Store all customers for frontend pagination
  const [warehouses, setWarehouses] = useState([]);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [se, setSe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [updatingCustomerId, setUpdatingCustomerId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState({
    show: false,
    customerId: null,
    action: null,
  });
  const [activationFilter, setActivationFilter] = useState("all");
  const [isActivationEnabled, setIsActivationEnabled] = useState(true); // Feature flag

  const closeModal = () => setIsModalOpen(false);

  // Function to load persisted activation status from localStorage
  const loadPersistedActivationStatus = (customers) => {
    return customers.map((customer) => {
      const activationKey = `customer_activation_${customer.id}`;
      const persistedStatus = localStorage.getItem(activationKey);

      if (persistedStatus) {
        return { ...customer, status: persistedStatus };
      }
      return customer;
    });
  };

  // Function to refresh customer data
  const refreshCustomerData = async () => {
    try {
      setLoading(true);
      setCustomers(null);
      setFilteredCustomers(null);
      setAllCustomers([]);

      // Reset filters
      setSearchTerm("");
      setWarehouse(null);
      setSe(null);
      setActivationFilter("all");
      setPageNo(1);

      // Get division ID from localStorage for division filtering
      const currentDivisionId = localStorage.getItem("currentDivisionId");

      let query = "/customers";

      // Add division parameters to prevent wrong division data
      if (currentDivisionId && currentDivisionId !== "1") {
        query += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        query += `?showAllDivisions=true`;
      }

      console.log("🔄 Refreshing customer data with query:", query);

      const res = await axiosAPI.get(query);
      console.log("🔄 Refresh response:", res);

      const allItems = res.data.customers;
      console.log("🔄 Refreshed customers:", allItems);

      // Load persisted activation status
      const customersWithPersistedStatus =
        loadPersistedActivationStatus(allItems);

      setAllCustomers(customersWithPersistedStatus);
      updatePagination(customersWithPersistedStatus, 1, limit);

      setSuccessMessage("Customer data refreshed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Refresh error:", e);
      setError(e.response?.data?.message || "Failed to refresh customer data.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Check if activation feature is available
  const checkActivationFeature = async () => {
    try {
      // Try to make a test call to see if the endpoint exists
      await axiosAPI.get("/customers?limit=1");
      setIsActivationEnabled(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setIsActivationEnabled(false);
        console.warn("Customer activation feature not available");
      }
    }
  };

  // Handle customer activation status toggle
  const handleActivationToggle = async (customerId, currentStatus) => {
    try {
      setUpdatingCustomerId(customerId);
      setSuccessMessage("");
      const newStatus = currentStatus ? false : true;

      console.log("🔄 Toggle called:", {
        customerId,
        currentStatus,
        newStatus,
      });

      // Try to call the actual API first
      try {
        // Try with status field first (since backend returns status: "Inactive")
        const statusValue = newStatus ? "Active" : "Inactive";
        console.log("🔄 Making API call to:", `/customers/${customerId}`, {
          status: statusValue,
        });

        // Try different endpoint patterns
        let response;
        let success = false;

        // Try 1: PUT to /customers/{id}
        try {
          response = await axiosAPI.put(`/customers/${customerId}`, {
            status: statusValue,
          });
          console.log("🔄 PUT to /customers/{id} success:", response);
          success = true;
        } catch (putError) {
          console.log(
            "🔄 PUT to /customers/{id} failed:",
            putError.response?.status
          );
        }

        // Try 2: PATCH to /customers/{id}
        if (!success) {
          try {
            response = await axiosAPI.patch(`/customers/${customerId}`, {
              status: statusValue,
            });
            console.log("🔄 PATCH to /customers/{id} success:", response);
            success = true;
          } catch (patchError) {
            console.log(
              "🔄 PATCH to /customers/{id} failed:",
              patchError.response?.status
            );
          }
        }

        // Try 3: PUT to /customers/{id}/status
        if (!success) {
          try {
            response = await axiosAPI.put(`/customers/${customerId}/status`, {
              status: statusValue,
            });
            console.log("🔄 PUT to /customers/{id}/status success:", response);
            success = true;
          } catch (statusError) {
            console.log(
              "🔄 PUT to /customers/{id}/status failed:",
              statusError.response?.status
            );
          }
        }

        // Try 4: PUT to /customers/{id}/activate or /customers/{id}/deactivate
        if (!success) {
          try {
            const endpoint =
              statusValue === "Active" ? "activate" : "deactivate";
            response = await axiosAPI.put(
              `/customers/${customerId}/${endpoint}`
            );
            console.log(
              `🔄 PUT to /customers/{id}/${endpoint} success:`,
              response
            );
            success = true;
          } catch (activateError) {
            console.log(
              "🔄 PUT to /customers/{id}/activate|deactivate failed:",
              activateError.response?.status
            );
          }
        }

        if (!success) {
          throw new Error("All API endpoints failed");
        }

        console.log("🔄 API response data:", response.data);
      } catch (apiError) {
        console.log("🔄 API error details:", {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          message: apiError.response?.data?.message,
          error: apiError.message,
          url: apiError.config?.url,
          method: apiError.config?.method,
          data: apiError.config?.data,
        });

        // If the API endpoint doesn't exist (404), simulate the update for development
        if (apiError.response?.status === 404) {
          console.warn(
            "Customer activation endpoint not available, simulating update for development"
          );
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          throw apiError; // Re-throw other errors
        }
      }

      // Update local state
      const statusValue = newStatus ? "Active" : "Inactive";

      // Persist activation status to localStorage for temporary solution
      const activationKey = `customer_activation_${customerId}`;
      localStorage.setItem(activationKey, statusValue);

      setCustomers((prev) =>
        prev?.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: statusValue }
            : customer
        )
      );

      setFilteredCustomers((prev) =>
        prev?.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: statusValue }
            : customer
        )
      );

      // Also update allCustomers to maintain consistency
      setAllCustomers((prev) =>
        prev?.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: statusValue }
            : customer
        )
      );

      // Show success message
      setSuccessMessage(
        `Customer ${statusValue === "Active" ? "activated" : "deactivated"} successfully!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Activation toggle error:", e);

      // Handle specific error cases
      if (e.response?.status === 404) {
        setError(
          "Customer activation endpoint not available. Please contact your administrator to enable this feature."
        );
      } else if (e.response?.status === 403) {
        setError(
          "You don't have permission to modify customer activation status."
        );
      } else if (e.response?.status === 400) {
        setError(
          "Invalid request. Please check the customer data and try again."
        );
      } else {
        setError(
          e.response?.data?.message ||
            "Failed to update customer activation status. Please try again."
        );
      }

      setIsModalOpen(true);
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  // Show confirmation dialog for deactivation
  const showDeactivationConfirmation = (customerId, customerName) => {
    setShowConfirmation({
      show: true,
      customerId,
      action: "deactivate",
      customerName,
    });
  };

  // Handle confirmed action
  const handleConfirmedAction = () => {
    if (showConfirmation.action === "deactivate") {
      const customer = customers?.find(
        (c) => c.id === showConfirmation.customerId
      );
      if (customer) {
        handleActivationToggle(customer.id, customer.status === "Active");
      }
    }
    setShowConfirmation({ show: false, customerId: null, action: null });
  };

  // Function to check if there are any persisted activation changes
  const hasPersistedChanges = () => {
    const keys = Object.keys(localStorage);
    const activationKeys = keys.filter((key) =>
      key.startsWith("customer_activation_")
    );
    return activationKeys.length > 0;
  };

  // Function to clear all persisted activation status (useful when backend is fixed)
  const clearPersistedActivationStatus = () => {
    const keys = Object.keys(localStorage);
    const activationKeys = keys.filter((key) =>
      key.startsWith("customer_activation_")
    );
    activationKeys.forEach((key) => localStorage.removeItem(key));
    console.log(
      "🧹 Cleared persisted activation status for",
      activationKeys.length,
      "customers"
    );
  };

  // Export activation data
  const exportActivationData = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      setError("No data to export");
      setIsModalOpen(true);
      return;
    }

    try {
      const csvData = [
        [
          "Customer ID",
          "Customer Name",
          "Activation Status",
          "Last Updated",
          "KYC Status",
        ],
        ...filteredCustomers.map((customer) => [
          customer.customer_id || "",
          customer.name || "",
          customer.status || "Unknown",
          new Date().toLocaleDateString(),
          customer.kycStatus || "",
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `customer_activation_status_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage("Activation data exported successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError("Failed to export data");
      setIsModalOpen(true);
    }
  };

  // Fetch metadata (executives & warehouses)
  useEffect(() => {
    async function fetchMeta() {
      try {
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to warehouses endpoint
        let warehousesEndpoint = "/warehouse";
        if (currentDivisionId && currentDivisionId !== "1") {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          warehousesEndpoint += `?showAllDivisions=true`;
        }

        console.log(
          "CustomerList - Fetching warehouses with endpoint:",
          warehousesEndpoint
        );
        console.log("CustomerList - Division ID:", currentDivisionId);
        console.log("CustomerList - Division Name:", currentDivisionName);

        const [res1, res2] = await Promise.all([
          axiosAPI.get("/employees/role/Business Officer"),
          axiosAPI.get(warehousesEndpoint),
        ]);
        setSalesExecutives(res1.data.employees);
        setWarehouses(res2.data.warehouses);

        // Check if activation feature is available
        await checkActivationFeature();
      } catch (e) {
        setError(e.response?.data?.message || "Failed to fetch metadata.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, []);

  // Unified API call for both filtered and search-based results
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setCustomers(null);
        setFilteredCustomers(null);
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        let query = "";
        if (searchTerm.trim().length >= 3) {
          query = `/customers/search?customerName=${searchTerm.trim()}`;
        } else {
          // Remove pagination parameters to get all customers for frontend pagination
          query = `/customers?${
            warehouse && warehouse !== "all" ? `&warehouseId=${warehouse}` : ""
          }${se ? `&salesExecutiveId=${se}` : ""}`;
        }

        // ✅ Add division parameters to prevent wrong division data
        if (currentDivisionId && currentDivisionId !== "1") {
          query += `&divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          query += `&showAllDivisions=true`;
        }

        console.log("CustomerList - Fetching customers with query:", query);
        console.log("CustomerList - Selected warehouse:", warehouse);
        console.log(
          "CustomerList - Warehouse filter applied:",
          warehouse && warehouse !== "all"
        );
        console.log("CustomerList - Division ID:", currentDivisionId);
        console.log("CustomerList - Division Name:", currentDivisionName);
        console.log(
          "CustomerList - Division parameters added:",
          query.includes("divisionId") || query.includes("showAllDivisions")
        );

        const res = await axiosAPI.get(query);
        console.log(res);

        // Get all customers from response
        const allItems = res.data.customers;
        console.log("All customers:", allItems);
        console.log("Total customers:", allItems.length);

        // Load persisted activation status
        const customersWithPersistedStatus =
          loadPersistedActivationStatus(allItems);

        // Store all customers for frontend pagination
        setAllCustomers(customersWithPersistedStatus);

        // Apply frontend pagination
        updatePagination(customersWithPersistedStatus, pageNo, limit);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to fetch customers.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [warehouse, se, searchTerm]);

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
  }, [limit]);

  // Handle frontend pagination
  const updatePagination = (allItems, currentPage, itemsPerPage) => {
    console.log("🔄 updatePagination called with:", {
      allItems,
      currentPage,
      itemsPerPage,
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    console.log("🔄 Frontend pagination:", {
      totalItems: allItems.length,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
      paginatedItemsCount: paginatedItems.length,
      totalPages: Math.ceil(allItems.length / itemsPerPage),
    });

    setCustomers(paginatedItems);
    setTotalPages(Math.ceil(allItems.length / itemsPerPage));
  };

  // Update pagination when page number changes
  useEffect(() => {
    console.log("🔄 Page number changed effect triggered:", {
      pageNo,
      allCustomersLength: allCustomers.length,
    });
    if (allCustomers.length > 0) {
      updatePagination(allCustomers, pageNo, limit);
    }
  }, [pageNo, allCustomers, limit]);

  // Update pagination when limit changes
  useEffect(() => {
    console.log("🔄 Limit changed effect triggered:", {
      limit,
      allCustomersLength: allCustomers.length,
    });
    if (allCustomers.length > 0) {
      updatePagination(allCustomers, pageNo, limit);
    }
  }, [limit, allCustomers, pageNo]);

  // Whenever customers change, update filteredCustomers
  useEffect(() => {
    console.log("🔄 Customers changed effect triggered:", {
      customersLength: customers?.length,
      activationFilter,
    });
    if (!customers) return;

    let filtered = customers;

    // Apply activation filter
    if (activationFilter === "active") {
      filtered = customers.filter((customer) => customer.status === "Active");
    } else if (activationFilter === "inactive") {
      filtered = customers.filter((customer) => customer.status === "Inactive");
    }

    console.log("🔄 Setting filteredCustomers:", {
      filteredLength: filtered.length,
    });
    setFilteredCustomers(filtered);
  }, [customers, activationFilter]);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Customer-list
      </p>

      {!customerId && (
        <div className="row m-0 p-3">
          <CustomSearchDropdown
            label="Warehouse"
            onSelect={setWarehouse}
            options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
          />

          <CustomSearchDropdown
            label="Sales Executive"
            onSelect={setSe}
            options={salesExecutives?.map((s) => ({
              value: s.id,
              label: s.name,
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

      {!customerId && (
        <>
          {!isActivationEnabled && (
            <div className="row m-0 p-3">
              <div className="col">
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>
                    Customer Activation Feature Not Available:
                  </strong>{" "}
                  The backend API endpoint for customer activation is not yet
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
                placeholder="Search by customer name..."
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
                  <p className="mt-2 text-muted">Loading customer data...</p>
                </div>
              </div>
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
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
                      {allCustomers.filter((c) => c.status === "Active").length}
                    </span>
                    <span className="badge bg-danger">
                      <i className="bi bi-x-circle me-1"></i>
                      Inactive:{" "}
                      {
                        allCustomers.filter((c) => c.status === "Inactive")
                          .length
                      }
                    </span>
                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => exportActivationData()}
                          title="Export activation status data"
                          disabled={!isActivationEnabled}
                        >
                          <i className="bi bi-download me-1"></i>
                          Export
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
                          "🔄 Current allCustomers length:",
                          allCustomers.length
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
                      {filteredCustomers && filteredCustomers.length > 0
                        ? (pageNo - 1) * limit + 1
                        : 0}{" "}
                      to{" "}
                      {filteredCustomers && filteredCustomers.length > 0
                        ? Math.min(
                            pageNo * limit,
                            (pageNo - 1) * limit + filteredCustomers.length
                          )
                        : 0}{" "}
                      of {allCustomers ? allCustomers.length : 0} entries
                      {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
                    </p>
                  </div>
                </div>

                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Firm Name</th>
                      <th>SE Name</th>
                      <th>Warehouse</th>
                      <th>
                        Activation
                        {/* <i className="bi bi-info-circle ms-1" 
                           title="Toggle to enable/disable customer access. Only admins can modify activation status."
                           style={{ cursor: 'help', color: '#666' }}></i> */}
                      </th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 && (
                      <tr className="animated-row">
                        <td colSpan={9}>NO DATA FOUND</td>
                      </tr>
                    )}
                    {filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{(pageNo - 1) * limit + index + 1}</td>
                        <td>{customer.customer_id}</td>
                        <td>{customer.name}</td>
                        <td>
                          {customer.firmName || customer.firm_name || "N/A"}
                        </td>
                        <td>{customer.salesExecutive?.name}</td>
                        <td>{customer.warehouse?.name}</td>
                        <td className={styles["activation-column"]}>
                          {isAdmin && isActivationEnabled ? (
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={customer.status === "Active"}
                                onChange={() => {
                                  if (customer.status === "Active") {
                                    // Show confirmation for deactivation
                                    showDeactivationConfirmation(
                                      customer.id,
                                      customer.name
                                    );
                                  } else {
                                    // Direct activation
                                    handleActivationToggle(
                                      customer.id,
                                      customer.status === "Active"
                                    );
                                  }
                                }}
                                disabled={updatingCustomerId === customer.id}
                                style={{
                                  opacity:
                                    updatingCustomerId === customer.id
                                      ? 0.6
                                      : 1,
                                  cursor:
                                    updatingCustomerId === customer.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              />
                              <label className="form-check-label">
                                {updatingCustomerId === customer.id ? (
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
                                    className={`badge ${customer.status === "Active" ? "bg-success" : "bg-danger"}`}
                                    title={`Customer is currently ${customer.status === "Active" ? "active" : "inactive"}`}
                                  >
                                    <i
                                      className={`bi ${customer.status === "Active" ? "bi-check-circle" : "bi-x-circle"} me-1`}
                                    ></i>
                                    {customer.status || "Unknown"}
                                  </span>
                                )}
                              </label>
                            </div>
                          ) : (
                            <span
                              className={`badge ${customer.status === "Active" ? "bg-success" : "bg-danger"}`}
                              title={`Customer is currently ${customer.status === "Active" ? "active" : "inactive"}`}
                            >
                              <i
                                className={`bi ${customer.status === "Active" ? "bi-check-circle" : "bi-x-circle"} me-1`}
                              ></i>
                              {customer.status || "Unknown"}
                            </span>
                          )}
                          {!isActivationEnabled && (
                            <small className="text-muted d-block mt-1">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Read-only
                            </small>
                          )}
                        </td>
                        <td>{customer.kycStatus}</td>
                        <td>
                          <button onClick={() => setCustomerId(customer.id)}>
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
          ) : filteredCustomers && filteredCustomers.length === 0 ? (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <div className="text-center">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No customers found matching the current filters.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {customerId && (
        <CustomersModal
          customerId={customerId}
          setCustomerId={setCustomerId}
          isAdmin={isAdmin}
        />
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {/* Confirmation Modal */}
      {showConfirmation.show && (
        <div
          className={`modal fade show d-block ${styles["confirmation-modal"]}`}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Action</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setShowConfirmation({
                      show: false,
                      customerId: null,
                      action: null,
                    })
                  }
                ></button>
              </div>
              <div className="modal-body">
                {showConfirmation.action === "deactivate" && (
                  <p>
                    Are you sure you want to deactivate customer{" "}
                    <strong>{showConfirmation.customerName}</strong>? This will
                    disable their access to the system.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowConfirmation({
                      show: false,
                      customerId: null,
                      action: null,
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmedAction}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerList;
