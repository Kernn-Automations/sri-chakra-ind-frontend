import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";
import DeliveryViewModal from "./DeliveryViewModal";
import xls from "./../../../images/xls-png.png";
import pdf from "./../../../images/pdf-png.png";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import deliverAni from "../../../images/animations/delivered_primary.gif";
import { useAuth } from "@/Auth";
import LoadingAnimation from "@/components/LoadingAnimation";
import { handleExportExcel, handleExportPDF } from "@/utils/PDFndXLSGenerator";

function Deliveries({ navigate, warehouses, customers }) {
  const [onsubmit, setonsubmit] = useState(false);

  const [tableData, setTableData] = useState([]);
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Order ID",
      "Warehouse Name",
      "Customer ID",
      "Dispatch Date",
      "Delivered Date",
    ];
    if (orders && orders.length > 0) {
      orders.map((order) =>
        arr.push({
          "S.No": x++,
          Date: order.createdAt.slice(0, 10),
          "Order ID": order.orderNumber,
          "Warehouse Name": order.warehouse?.name,
          "Customer ID": order.customer?.customer_id,
          "Dispatch Date":
            order.dispatchDate && order.dispatchDate.slice(0, 10),
          "Delivered Date":
            order.deliveredDate && order.deliveredDate.slice(0, 10),
        })
      );
      setTableData(arr);

      if (type === "PDF") handleExportPDF(columns, tableData, "Deliveries");
      else if (type === "XLS")
        handleExportExcel(columns, tableData, "Deliveries");
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  // backend --------------------------
  const [orders, setOrders] = useState();

  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [warehouse, setWarehouse] = useState();
  const [customer, setCustomer] = useState();
  const [trigger, setTrigger] = useState(false);

  const onSubmit = () => {
    // console.log(from, to, warehouse, customer);
    setTrigger(trigger ? false : true);
  };

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        setOrders(null);
        setLoading(true);
        
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Handle "All Warehouses" option - don't send warehouseId parameter
        let warehouseParam = "";
        if (warehouse && warehouse !== "all") {
          warehouseParam = `&warehouseId=${warehouse}`;
        }
        
        // ✅ Add division parameters to prevent wrong division data
        let divisionParam = "";
        if (currentDivisionId && currentDivisionId !== '1') {
          divisionParam = `&divisionId=${currentDivisionId}`;
        }
        
        console.log('Deliveries - Fetching orders with warehouse filter:', warehouse);
        console.log('Deliveries - Warehouse parameter:', warehouseParam);
        console.log('Deliveries - Division ID:', currentDivisionId);
        console.log('Deliveries - Division Name:', currentDivisionName);
        console.log('Deliveries - Division parameters added:', divisionParam);
        
        const res = await axiosAPI.get(
          `/sales-orders?status=Delivered&fromDate=${from}&toDate=${to}${warehouseParam}${divisionParam}${
            customer ? `&customerId=${customer}` : ""
          }`
        );
        // console.log(res);
        setOrders(res.data.salesOrders);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger]);

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/sales")}>Sales</span>{" "}
        <i class="bi bi-chevron-right"></i> Deliveries
      </p>

      <div className="row m-0 p-3">
        <div className={`col-3 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">WareHouse :</label>
          <select
            name=""
            id=""
            value={warehouse}
            onChange={(e) =>
              setWarehouse(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            <option value="all">All Warehouses</option>
            {warehouses &&
              warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
          </select>
        </div>
        {/* <div className={`col-3 formcontent`}>
          <label htmlFor="">Product :</label>
          <select name="" id="">
            <option value="">--select--</option>
            {products && products.map((product) => <option value={product.id}>{product.name}</option>)}
          </select>
        </div> */}
        <div className={`col-3 formcontent`}>
          <label htmlFor="">Customer :</label>
          <select
            name=""
            id=""
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            {customers &&
              customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="row m-0 p-3 justify-content-center">
        <div className={`col-3 formcontent`}>
          <button className="submitbtn" onClick={onSubmit}>
            Submit
          </button>
          <button className="cancelbtn" onClick={() => navigate("/sales")}>
            Cancel
          </button>
        </div>
      </div>

      {orders && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-8">
            <button className={styles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={styles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
          <div className="col-lg-10">
            <table className={`table table-bordered borderedtable`}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Warehouse Name</th>
                  <th>Customer ID</th>
                  <th>Dispatch Date</th>
                  <th>Delivered Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8}>NO DATA FOUND</td>
                  </tr>
                )}
                {orders.length > 0 &&
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>{order.createdAt.slice(0, 10)}</td>
                      <td>{order.orderNumber}</td>
                      <td>{order.warehouse?.name}</td>
                      <td>{order.customer?.customer_id}</td>
                      <td>
                        {order.dispatchDate && order.dispatchDate.slice(0, 10)}
                      </td>
                      <td>
                        {order.deliveredDate &&
                          order.deliveredDate.slice(0, 10)}
                      </td>
                      <td>
                        <DeliveryViewModal order={order} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <LoadingAnimation gif={deliverAni} />}
    </>
  );
}

export default Deliveries;
