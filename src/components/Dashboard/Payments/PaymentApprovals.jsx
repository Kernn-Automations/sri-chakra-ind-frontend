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
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const closeModal = () => setIsModalOpen(false);
  const changeTrigger = () => setTrigger(!trigger);

  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setSalesOrders([]);
        setFilteredSalesOrders([]);

        const query = `/payment-requests?status=Pending&page=${pageNo}&limit=${limit}`;

        const res = await axiosAPI.get(query);
        console.log(res.data);
        const orders = res.data.salesOrders || [];
        // Sort by date descending (using transactionDate from paymentRequests)
        orders.sort((a, b) => {
          const getVal = (o) => {
            const d = o.paymentRequests?.[0]?.transactionDate || o.createdAt;
            const date = new Date(d);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          };
          return getVal(b) - getVal(a);
        });
        setSalesOrders(orders);
        setTotalPages(res.data.totalPages);
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger, pageNo, limit]);

  // Filter by customer name
  useEffect(() => {
    const filtered = salesOrders.filter((order) =>
      order.customer?.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
    setFilteredSalesOrders(filtered);
  }, [searchTerm, salesOrders]);

  let index = 1;

  function calculateTotalAmount(paymentRequests) {
    return paymentRequests.reduce((sum, pr) => sum + (pr.netAmount || 0), 0).toFixed(2);
  }

  function getDisplayDate(order) {
    const dateStr = order.paymentRequests?.[0]?.transactionDate || order.createdAt;
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString("en-IN");
  }

  function openModal(salesOrder) {
    setSelectedSalesOrder(salesOrder);
    setIsModalOpen(true);
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/payments")}>Payments</span>{" "}
        <i className="bi bi-chevron-right"></i> Payment-approvals
      </p>

      {salesOrders && filteredSalesOrders && (
        <>
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
            <div className="row m-0 p-3 justify-content-center">
              <div className={`col-lg-10 ${styles.entity}`}>
                <label htmlFor="">Entity :</label>
                <select
                  name=""
                  id=""
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                >
                  {[10, 20, 30, 40, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-10">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Customer Name</th>
                    <th>SE Name</th>
                    <th>Warehouse</th>
                    <th>Total Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesOrders.length === 0 && (
                    <tr>
                      <td colSpan={8}>NO DATA FOUND</td>
                    </tr>
                  )}
                  {filteredSalesOrders.map((order) => (
                    <tr
                      key={order.salesOrderId}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>{order.orderNumber}</td>
                      <td>{getDisplayDate(order)}</td>
                      <td>{order.customer?.name}</td>
                      <td>{order.salesExecutive?.name}</td>
                      <td>{order.warehouse?.name}</td>
                      <td>{calculateTotalAmount(order.paymentRequests)}</td>
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
              <div className="row m-0 p-0 pt-3 justify-content-between">
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {pageNo > 1 && (
                  <button onClick={() => setPageNo(pageNo - 1)}>
                    <span><FaArrowLeftLong /></span> Previous
                  </button>
                )}
              </div>
              <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                {totalPages > 1 && pageNo < totalPages && (
                  <button onClick={() => setPageNo(pageNo + 1)}>
                    Next <span><FaArrowRightLong /></span>
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
        </>
      )}

      {selectedSalesOrder && (
        <ApprovalsViewModal
          salesOrder={selectedSalesOrder}
          changeTrigger={changeTrigger}
          onClose={closeModal}
          isOpen={isModalOpen}
        />
      )}

      {isModalOpen && error && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default PaymentApprovals;
