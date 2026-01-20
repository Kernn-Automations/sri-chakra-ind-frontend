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

function WarehouseWiseReport({ navigate }) {
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
  const [warehouses, setWarehouses] = useState();
  const [warehouse, setWarehouse] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        const res = await axiosAPI.get("/warehouses");
        console.log(res);
        setWarehouses(res.data.warehouses);
      } catch (e) {
        console.log(e);
      }
    }

    fetch();
  }, []);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setReports(null);
        const query = `/warehouse/warehouse-wise-stock-summary?fromDate=${from}&toDate=${to}${warehouse ? `&warehouseId=${warehouse}` : ""}`;
        console.log(query);
        const res = await axiosAPI.get(query);
        setReports(res.data.data);
        console.log(res);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [from, to, warehouse]);

  const [tableData, setTableData] = useState();

  const onExport = (type) => {
    const arr = [];
    let x = 1;

    const columns = [
      "S.No",
      "Warehouse Name",
      // "Product Name",
      //   "Product Type",
      //   "Package Weight",
      //   "Package Weight Unit",
      "Inward",
      "Alt Inward",
      "Stock In",
      "Alt Stock In",
      "Outward",
      "Alt Outward",
      "Stock Out",
      "Alt Stock Out",
      "Closing Balance",
      "Alt Closing Balance",
    ];

    if (reports && reports.length > 0) {
      reports.map((report) =>
        arr.push({
          "S.No": x++,
          "Warehouse Name": report.warehouseName,
          // "Product Name": report.productName,
          //   "Product Type": report.productType,
          //   "Package Weight": report.packageWeight,
          //   "Package Weight Unit": report.packageWeightUnit,
          Inward: report.inward + "Bags",
          "Alt Inward": report.inwardAlt + "Tonnes",
          "Stock In": report.stockIn + "Bags",
          "Alt Stock In": report.stockInAlt + "Tonnes",
          Outward: report.outward + "Bags",
          "Alt Outward": report.outwardAlt + "Tonnes",
          "Stock Out": report.stockOut + "Bags",
          "Alt Stock Out": report.stockOutAlt + "Tonnes",
          "Closing Balance": report.closingBalance + "Bags",
          "Alt Closing Balance": report.closingBalanceAlt + "Tonnes",
        })
      );
      setTableData(arr);

      if (type === "PDF")
        handleExportPDF(columns, tableData, "Warehouse-Wise-Report");
      else if (type === "XLS")
        handleExportExcel(columns, tableData, "Warehouse-Wise-Report");
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
        <span onClick={() => navigate("/reports/stock-reports")}>
          Stock-Reports
        </span>{" "}
        <i class="bi bi-chevron-right"></i> Warehouse-Wise-Report
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
          label="Warehouse"
          onSelect={setWarehouse}
          options={warehouses?.map((w) => ({ value: w.id, label: w.name }))}
        />
      </div>

      {reports && (
        <>
          <div className="row m-0 p-3 pb-0 justify-content-around">
            <div className="col-lg-7">
              <button className={styles.xls} onClick={() => onExport("XLS")}>
                <p>Export to </p>
                <img src={xls} alt="" />
              </button>
              <button className={styles.xls} onClick={() => onExport("PDF")}>
                <p>Export to </p>
                <img src={pdf} alt="" />
              </button>
            </div>
            <div className={`col-lg-2 ${styles.entity}`}>
              <label htmlFor="">Entity :</label>
              <select
                name=""
                id=""
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
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
                    <th>Warehouse Name</th>
                    {/* <th>Product Name</th> */}
                    {/* <th>Product Type</th>
                    <th>Package Weight</th>
                    <th>Package Weight Unit</th> */}
                    <th>Inward</th>
                    <th>Alt Inward</th>
                    <th>Stock In</th>
                    <th>Alt Stock In</th>
                    <th>Outward</th>
                    <th>Alt Outward</th>
                    <th>Stock Out</th>
                    <th>Alt Stock Out</th>
                    <th>Closing Balance</th>
                    <th>Alt Closing Balance</th>
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
                      <td>{report.warehouseName}</td>
                      {/* <td>{report.productName}</td> */}
                      {/* <td>{report.productType}</td>
                      <td>{report.packageWeight}</td>
                      <td>{report.packageWeightUnit}</td> */}
                      <td>{report.inward} Bags</td>
                      <td>{report.inwardAlt} Tonnes</td>
                      <td>{report.stockIn} Bags</td>
                      <td>{report.stockInAlt} Tonnes</td>
                      <td>{report.outward} Bags</td>
                      <td>{report.outwardAlt} Tonnes</td>
                      <td>{report.stockOut} Bags</td>
                      <td>{report.stockOutAlt} Tonnes</td>
                      <td>{report.closingBalance} Bags</td>
                      <td>{report.closingBalanceAlt} Tonnes</td>
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

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default WarehouseWiseReport;
