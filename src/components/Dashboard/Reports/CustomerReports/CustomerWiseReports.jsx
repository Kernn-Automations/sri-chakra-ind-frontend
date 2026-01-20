import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import styles from "./../Reports.module.css";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";
import CustomSearchDropdown from "../../../../utils/CustomSearchDropDown";
import { handleCustomerWisePDF } from "./CustomerWisePDFGenerator";

function CustomerWiseReports({ navigate }) {
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { axiosAPI } = useAuth();

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);

  const [reports, setReports] = useState();
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [filtertype, setFiltertype] = useState();

  const [customers, setCustomers] = useState();
  const [customer, setCustomer] = useState();
  const [apicust, setApicust] = useState();
  const [totals, setTotals] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        const res1 = await axiosAPI.get("/customers");
        console.log(res1);
        setCustomers(res1.data.customers);

        setCustomer(res1.data.products.length > 0 && res1.data.products[0].id);
      } catch (e) {
        console.log(e);
      }
    }

    fetch();
  }, []);

  useEffect(() => {
    async function fetch() {
      try {
        if (customer) {
          setLoading(true);
          setReports(null);
          const query = `/reports/customers/${customer}/products?fromDate=${from}&toDate=${to}${filtertype ? `&filtertype=${filtertype}` : ""}`;
          console.log(query);
          const res = await axiosAPI.get(query);
          setReports(res.data.products);
          setApicust(res.data.customer);
          setTotals(res.data.totals);
          console.log(res);
        }
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [from, to, customer, filtertype]);

  const [tableData, setTableData] = useState();

  const onExport = (type) => {
    const arr = [];
    let x = 1;

    const columns = ["S.No", "Product", "Bags", "Tonnes"];

    if (reports && reports.length > 0) {
      reports.forEach((report) =>
        arr.push({
          "S.No": x++,
          Product: report.product,
          Bags: report.bags,
          Tonnes: report.tonnes,
        })
      );

      if (type === "PDF")
        handleCustomerWisePDF(
          columns,
          arr,
          "Customer-Wise-Report",
          apicust,
          totals
        );
      else if (type === "XLS")
        handleExportExcel(columns, arr, "Customer-Wise-Report");
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  let index = 1;
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/reports")}>Reports</span>{" "}
        <i class="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/reports/customer-reports")}>
          Customer-Reports
        </span>{" "}
        <i class="bi bi-chevron-right"></i> Customer-Wise-Reports
      </p>

      <div className="row m-0 p-3">
        <div className={`col-4 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            name=""
            id=""
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-4 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            name=""
            id=""
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <CustomSearchDropdown
          label="Customer"
          onSelect={setCustomer}
          options={customers?.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className={`col-4 formcontent`}>
          <label htmlFor="">Filter Type :</label>
          <select
            name=""
            id=""
            onChange={(e) =>
              setFiltertype(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="fortnightly">Fortnightly</option>
          </select>
        </div>
      </div>

      {reports && (
        <>
          <div className="row m-0 p-3 pb-0 justify-content-center">
            <div className={`col-lg-5 ${styles.custDetails}`}>
              <h5>{apicust.name}</h5>
              <p>{apicust.customer_id}</p>
              <p>
                {apicust.mobile},{" "}
                {apicust.firmname ? apicust.firmname + "," : ""}
              </p>
              <p>
                {apicust.city ? apicust.city + "," : ""}{" "}
                {apicust.district ? apicust.district + "," : ""}{" "}
                {apicust.state ? apicust.state + "," : ""}{" "}
                {apicust.pincode ? apicust.pincode + "," : ""}
              </p>
            </div>
            <div className="col-lg-5">
              <button className={styles.xls} onClick={() => onExport("XLS")}>
                <p>Export to </p>
                <img src={xls} alt="" />
              </button>
              <button className={styles.xls} onClick={() => onExport("PDF")}>
                <p>Export to </p>
                <img src={pdf} alt="" />
              </button>
            </div>
          </div>
          <div className="row m-0 p-3 justify-content-around">
            <div className="col-lg-10">
              <table className={`table table-bordered borderedtable`}>
                <thead>
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <th>S.No</th>
                    <th>Product</th>
                    <th>Bags</th>
                    <th>Tonnes</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 && (
                    <tr
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td colSpan={5}>NO DATA FOUND</td>
                    </tr>
                  )}

                  {reports.map((report) => (
                    <tr
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>{report.product}</td>
                      <td>{report.bags}</td>
                      <td>{report.tonnes}</td>
                    </tr>
                  ))}
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td colSpan={2}>Totals</td>
                    <td>{totals.bags}</td>
                    <td>{totals.tonnes}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default CustomerWiseReports;
