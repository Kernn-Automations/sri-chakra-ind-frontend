import React, { useEffect, useState } from "react";
import styles from "./Payments.module.css";
import ApprovalsViewModal from "./ApprovalsViewModal";
import { IoSearch } from "react-icons/io5";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";

function PaymentApprovals({ navigate }) {
  const { axiosAPI } = useAuth();

  const [salesOrders, setSalesOrders] = useState([]);
  const [filteredSalesOrders, setFilteredSalesOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [trigger, setTrigger] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const changeTrigger = () => setTrigger((p) => !p);

  /* --------------------------------------------------
   * FETCH PAYMENT APPROVALS (ERP API)
   * -------------------------------------------------- */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setSalesOrders([]);
        setFilteredSalesOrders([]);

        const query = `/payment-requests?approvalStatus=Pending&page=${pageNo}&limit=${limit}`;
        const res = await axiosAPI.get(query);

        const orders = res.data?.data || [];

        // Sort by latest payment date (descending)
        orders.sort((a, b) => {
          const da = new Date(
            a.paymentRequests?.[0]?.transactionDate || 0,
          ).getTime();
          const db = new Date(
            b.paymentRequests?.[0]?.transactionDate || 0,
          ).getTime();
          return db - da;
        });

        setSalesOrders(orders);
        setTotalPages(res.data?.totalPages || 0);
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [trigger, pageNo, limit]);

  /* --------------------------------------------------
   * SEARCH FILTER (CUSTOMER NAME)
   * -------------------------------------------------- */
  useEffect(() => {
    const filtered = salesOrders.filter((order) =>
      order.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.trim().toLowerCase()),
    );
    setFilteredSalesOrders(filtered);
  }, [searchTerm, salesOrders]);

  /* --------------------------------------------------
   * HELPERS
   * -------------------------------------------------- */
  function getDisplayDate(order) {
    const dateStr = order.paymentRequests?.[0]?.transactionDate;
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  /* --------------------------------------------------
   * RENDER
   * -------------------------------------------------- */
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i className="bi bi-chevron-right"></i> Payment Approvals
      </p>

      {/* SEARCH */}
      <div className="row m-0 p-3 pt-4 justify-content-end">
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

      {/* LIMIT */}
      <div className="row m-0 p-3 justify-content-center">
        <div className={`col-lg-10 ${styles.entity}`}>
          <label>Records per page :</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPageNo(1);
            }}
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-10">
          <table className="table table-bordered borderedtable">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Sales Order</th>
                <th>Last Payment Date</th>
                <th>Customer</th>
                <th>Sales Executive</th>
                <th>Warehouse</th>
                <th>Total Paid (₹)</th>
                <th>Payments</th>
              </tr>
            </thead>

            <tbody>
              {filteredSalesOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center">
                    NO DATA FOUND
                  </td>
                </tr>
              )}

              {filteredSalesOrders.map((order, index) => (
                <tr
                  key={order.salesOrderId}
                  className="animated-row"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td>{index + 1}</td>

                  <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>

                  <td>{getDisplayDate(order)}</td>

                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {order.customer?.name}
                    </div>
                    <small className="text-muted">
                      {order.customer?.mobile}
                    </small>
                  </td>

                  <td>{order.salesExecutive?.name || "-"}</td>

                  <td>{order.warehouse?.name || "-"}</td>

                  <td
                    style={{
                      fontWeight: 600,
                      color: "#0f766e",
                    }}
                  >
                    ₹
                    {Number(order.totalPaidAmount || 0).toLocaleString("en-IN")}
                  </td>

                  <td>
                    <ApprovalsViewModal
                      report={order}
                      changeTrigger={changeTrigger}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="row m-0 p-0 pt-3 justify-content-between">
            <div className={`col-2 ${styles.buttonbox}`}>
              {pageNo > 1 && (
                <button onClick={() => setPageNo(pageNo - 1)}>
                  <FaArrowLeftLong /> Previous
                </button>
              )}
            </div>

            <div className={`col-2 ${styles.buttonbox}`}>
              {totalPages > 1 && pageNo < totalPages && (
                <button onClick={() => setPageNo(pageNo + 1)}>
                  Next <FaArrowRightLong />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <ErrorModal
          isOpen={true}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* LOADING */}
      {loading && <Loading />}
    </>
  );
}

export default PaymentApprovals;
