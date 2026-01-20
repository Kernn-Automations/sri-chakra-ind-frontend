import React, { useEffect, useState } from "react";
import styles from "./Customer.module.css";
import { IoSearch } from "react-icons/io5";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import KYCModal from "./KYCModal";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function KYCApproval({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // Store all customers for frontend pagination
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [trigger, setTrigger] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const changeTrigger = () => setTrigger((prev) => !prev);

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch warehouses for filter
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to warehouses endpoint
        let warehousesEndpoint = "/warehouses";
        if (currentDivisionId && currentDivisionId !== "1") {
          warehousesEndpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          warehousesEndpoint += `?showAllDivisions=true`;
        }

        console.log(
          "KYCApproval - Fetching warehouses with endpoint:",
          warehousesEndpoint
        );
        console.log("KYCApproval - Division ID:", currentDivisionId);
        console.log("KYCApproval - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(warehousesEndpoint);
        setWarehouses(res.data.warehouses || []);
      } catch (e) {
        console.error("Failed to fetch warehouses:", e);
      }
    }
    fetchWarehouses();
  }, []);

  // Fetch customers based on search term or default KYC Pending
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        setCustomers([]);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to endpoint
        let query = "";
        if (searchTerm.trim().length >= 3) {
          query = `/customers/search?customerName=${searchTerm.trim()}&kycStatus=Pending`;
        } else {
          // Remove pagination parameters to get all customers for frontend pagination
          query = `/customers?kycStatus=Pending`;
        }

        // ✅ Add warehouse filter if selected
        if (warehouse && warehouse !== "all") {
          query += `&warehouseId=${warehouse}`;
        }

        // ✅ Add division parameters to query
        if (currentDivisionId && currentDivisionId !== "1") {
          query += `&divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          query += `&showAllDivisions=true`;
        }

        // ✅ Add division parameters to search query as well
        if (searchTerm.trim().length >= 3) {
          if (currentDivisionId && currentDivisionId !== "1") {
            query += `&divisionId=${currentDivisionId}`;
          } else if (currentDivisionId === "1") {
            query += `&showAllDivisions=true`;
          }
        }

        console.log("KYCApproval - Fetching customers with query:", query);
        console.log("KYCApproval - Selected warehouse:", warehouse);
        console.log(
          "KYCApproval - Warehouse filter applied:",
          warehouse && warehouse !== "all"
        );
        console.log("KYCApproval - Division ID:", currentDivisionId);
        console.log("KYCApproval - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(query);
        console.log(res);

        // Get all customers from response
        const allItems = res.data.customers;
        console.log("All customers:", allItems);
        console.log("Total customers:", allItems.length);

        // Store all customers for frontend pagination
        setAllCustomers(allItems);

        // Apply frontend pagination
        updatePagination(allItems, pageNo, limit);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to fetch data.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [trigger, searchTerm, warehouse]);

  // Reset page number when limit changes
  useEffect(() => {
    setPageNo(1);
  }, [limit]);

  // Handle frontend pagination
  const updatePagination = (allItems, currentPage, itemsPerPage) => {
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
    if (allCustomers.length > 0) {
      updatePagination(allCustomers, pageNo, limit);
    }
  }, [pageNo, allCustomers, limit]);

  // Update pagination when limit changes
  useEffect(() => {
    if (allCustomers.length > 0) {
      updatePagination(allCustomers, pageNo, limit);
    }
  }, [limit, allCustomers, pageNo]);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> KYC-Approvals
      </p>

      {!customerId && (
        <>
          <div className="row m-0 p-3">
            <CustomSearchDropdown
              label="Warehouse"
              onSelect={setWarehouse}
              options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div className="row m-0 p-3 pt-5 justify-content-end">
            <div className={`col-4 ${styles.search}`}>
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

          <div className="row m-0 p-3 justify-content-center">
            <div className={`col-lg-10 ${styles.entity}`}>
              <label>Entity:</label>
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
                  setPageNo(1); // reset to page 1 on limit change
                }}
              >
                {[10, 20, 30, 40, 50].map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-10">
              {/* Pagination Info */}
              <div className="row m-0 p-0 mb-3 justify-content-between">
                <div className="col-lg-6">
                  <p className="text-muted mb-0">
                    Showing{" "}
                    {customers && customers.length > 0
                      ? (pageNo - 1) * limit + 1
                      : 0}{" "}
                    to{" "}
                    {customers && customers.length > 0
                      ? Math.min(
                          pageNo * limit,
                          (pageNo - 1) * limit + customers.length
                        )
                      : 0}{" "}
                    of {allCustomers ? allCustomers.length : 0} entries
                    {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
                  </p>
                </div>
              </div>

              <table className="table table-bordered borderedtable">
                <thead>
                  <tr className="animated-row">
                    <th>S.No</th>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Firm Name</th>
                    <th>SE ID</th>
                    <th>SE Name</th>
                    <th>Warehouse</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 && (
                    <tr className="animated-row">
                      <td colSpan={8}>NO DATA FOUND</td>
                    </tr>
                  )}
                  {customers.map((customer, index) => (
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
                      <td>{customer.salesExecutive?.id}</td>
                      <td>{customer.salesExecutive?.name}</td>
                      <td>{customer.warehouse?.name}</td>
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
        </>
      )}

      {customerId && (
        <KYCModal
          customerId={customerId}
          setCustomerId={setCustomerId}
          isAdmin={isAdmin}
          changeTrigger={changeTrigger}
        />
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-10 pt-5">
            <Loading />
          </div>
        </div>
      )}
    </>
  );
}

export default KYCApproval;
