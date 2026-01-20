import React, { useEffect, useState } from "react";
import styles from "../Sales/Sales.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import invoiceAni from "../../../images/animations/confirmed.gif";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import axios from "axios";
import Loading from "@/components/Loading";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

function InvoicesPage({ navigate, setInvoiceId }) {
  const { axiosAPI } = useAuth();

  const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [warehouse, setWarehouse] = useState();
  const [customer, setCustomer] = useState();
  const [trigger, setTrigger] = useState(false);
  const [invoices, setInvoices] = useState();
  const [allInvoices, setAllInvoices] = useState([]); // Store all invoices for frontend pagination
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10); // Add entity limit state
  const [totalPages, setTotalPages] = useState(0);

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to prevent wrong division data
        let endpoint = "/customers";
        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `?showAllDivisions=true`;
        }

        console.log(
          "InvoicePage - Fetching customers with endpoint:",
          endpoint
        );
        console.log("InvoicePage - Division ID:", currentDivisionId);
        console.log("InvoicePage - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(endpoint);
        setCustomers(res.data.customers || []);
      } catch (err) {
        setError("Failed to fetch customers");
        setIsModalOpen(true);
      }
    }
    fetchCustomers();
  }, []);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        setInvoices(null);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to prevent wrong division data
        let divisionParam = "";
        if (currentDivisionId && currentDivisionId !== "1") {
          divisionParam = `&divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          divisionParam = `&showAllDivisions=true`;
        }

        console.log("InvoicePage - Fetching invoices with division filter");
        console.log("InvoicePage - Division ID:", currentDivisionId);
        console.log("InvoicePage - Division Name:", currentDivisionName);
        console.log("InvoicePage - Division parameters added:", divisionParam);

        const res = await axiosAPI.get(
          `/invoice?fromDate=${from}&toDate=${to}${
            warehouse ? `&warehouseId=${warehouse}` : ""
          }${customer ? `&customerId=${customer}` : ""}${divisionParam}&page=${pageNo}`
        );
        console.log(res);
        const allItems = res.data.invoices;
        console.log("All invoices:", allItems);
        console.log("Total invoices:", allItems.length);

        // Store all invoices for frontend pagination
        setAllInvoices(allItems);

        // Apply frontend pagination
        updatePagination(allItems, pageNo, limit);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load invoices");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [trigger, pageNo]);

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

    setInvoices(paginatedItems);
    setTotalPages(Math.ceil(allItems.length / itemsPerPage));
  };

  // Update pagination when page number changes
  useEffect(() => {
    if (allInvoices.length > 0) {
      updatePagination(allInvoices, pageNo, limit);
    }
  }, [pageNo, allInvoices, limit]);

  // Update pagination when limit changes
  useEffect(() => {
    if (allInvoices.length > 0) {
      updatePagination(allInvoices, pageNo, limit);
    }
  }, [limit, allInvoices, pageNo]);

  const onSubmit = () => setTrigger(!trigger);

  const onExport = (type) => {
    if (!invoices || invoices.length === 0) {
      setError("Table is Empty");
      setIsModalOpen(true);
      return;
    }

    const columns = [
      "S.No",
      "Date",
      "Invoice Number",
      "Invoice Type",
      "Sales Order Number",
      "Customer Name",
      "Customer Mobile",
      "Total Bags",
      "Amount",
    ];

    const data = invoices.map((inv, i) => ({
      "S.No": (pageNo - 1) * limit + i + 1,
      Date: inv.invoiceDate?.slice(0, 10),
      "Invoice Number": inv.invoiceNumber,
      "Invoice Type":
        inv.type === "bill_of_supply"
          ? "Bill Of Supply"
          : inv.type === "tax_invoice"
            ? "Tax Invoice"
            : inv.type,
      "Sales Order Number": inv.salesOrder?.orderNumber,
      "Customer Name": inv.customer?.name,
      "Customer Mobile": inv.customer?.mobile,
      "Total Bags": inv.totalBags,
      Amount: inv.totalAmount,
    }));

    if (type === "PDF") handleExportPDF(columns, data, "Invoices");
    else handleExportExcel(columns, data, "Invoices");
  };
  const handleDownloadDC = async (inv) => {
    try {
      setDownloadingInvoiceId(inv.id);
      const token = localStorage.getItem("accessToken");
      const VITE_API = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${VITE_API}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", ``);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download Delivery Challan PDF", error);
      alert("Failed to download Delivery Challan");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
    <>
      <div className="row m-0 p-3">
        <div className="col-3 formcontent">
          <label>From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-3 formcontent">
          <label>To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <CustomSearchDropdown
          label="Customers"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className="col-3 formcontent">
          <button className="submitbtn" onClick={onSubmit}>
            Submit
          </button>
          <button
            className="cancelbtn"
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
        </div>
      </div>

      {invoices && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-8">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to</p>
              <img src={xls} alt="xls" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to</p>
              <img src={pdf} alt="pdf" />
            </button>
          </div>
          <div className="col-lg-10">
            {/* Entity Limit */}
            <div className="row m-0 p-0 mb-3 justify-content-end">
              <div className="col-lg-2">
                <label htmlFor="">Entity :</label>
                <select
                  name=""
                  id=""
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Info */}
            <div className="row m-0 p-0 mb-3 justify-content-between">
              <div className="col-lg-6">
                <p className="text-muted mb-0">
                  Showing{" "}
                  {invoices && invoices.length > 0
                    ? (pageNo - 1) * limit + 1
                    : 0}{" "}
                  to{" "}
                  {invoices && invoices.length > 0
                    ? Math.min(
                        pageNo * limit,
                        (pageNo - 1) * limit + invoices.length
                      )
                    : 0}{" "}
                  of {allInvoices ? allInvoices.length : 0} entries
                  {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
                </p>
              </div>
            </div>

            <table className="table table-hover table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Invoice Number</th>
                  <th>Invoice Type</th>
                  <th>Sales Order Number</th>
                  <th>Customer Name</th>
                  <th>Customer Mobile</th>
                  <th>Total Bags</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10}>NO DATA FOUND</td>
                  </tr>
                ) : (
                  invoices.map((inv, i) => (
                    <tr key={inv.id}>
                      <td>{(pageNo - 1) * limit + i + 1}</td>
                      <td>{inv.invoiceDate?.slice(0, 10)}</td>
                      <td>{inv.invoiceNumber}</td>
                      <td>
                        {inv.type === "bill_of_supply"
                          ? "Bill Of Supply"
                          : inv.type === "tax_invoice"
                            ? "Tax Invoice"
                            : inv.type}
                      </td>
                      <td>{inv.salesOrder?.orderNumber}</td>
                      <td>{inv.customer?.name}</td>
                      <td>{inv.customer?.mobile}</td>
                      <td>
                        {inv.totalBags === 1
                          ? `${inv.totalBags} Bag`
                          : `${inv.totalBags} Bags`}{" "}
                      </td>
                      <td>₹{Number(inv.grandTotal || 0).toFixed(2)}</td>

                      {/* ✅ DC PDF View Button */}
                      <td>
                        <button
                          className=""
                          onClick={() => {
                            setInvoiceId(inv.id);
                            navigate("/invoices/details");
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="row m-0 p-0 pt-3 justify-content-between">
              <div className={`col-2 p-0 ${styles.buttonbox}`}>
                {pageNo > 1 && (
                  <button onClick={() => setPageNo(pageNo - 1)}>
                    <FaArrowLeftLong /> Previous
                  </button>
                )}
              </div>
              <div className="col-4 text-center">
                <span className="text-muted">
                  Page {pageNo} of {totalPages || 1}
                </span>
              </div>
              <div className={`col-2 p-0 ${styles.buttonbox}`}>
                {pageNo < totalPages && (
                  <button onClick={() => setPageNo(pageNo + 1)}>
                    Next <FaArrowRightLong />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingAnimation gif={invoiceAni} />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default InvoicesPage;
