import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./ReportsPage.module.css";

const ReportsPage = () => {
  /** ================== SALES ORDERS ================== **/
  const pieDataOrders = [
    { name: "Confirmed", value: 120 },
    { name: "Dispatched", value: 80 },
    { name: "Delivered", value: 150 },
  ];
  const COLORS_ORDERS = ["#4CAF50", "#FF9800", "#2196F3"];
  const orderDetails = {
    confirmed: { value: 120, qty: 250, altQtyTonnes: 20 },
    dispatched: { value: 80, qty: 150, altQtyTonnes: 12 },
    delivered: { value: 150, qty: 300, altQtyTonnes: 25 },
  };

  /** ================== PAYMENTS ================== **/
  const pieDataPayments = [
    { name: "Submitted", value: 500000 },
    { name: "Received", value: 350000 },
    { name: "UPI", value: 200000 },
    { name: "Bank Transfer", value: 150000 },
  ];
  const COLORS_PAYMENTS = ["#9C27B0", "#3F51B5", "#4CAF50", "#FF9800"];
  const paymentDetails = {
    submitted: { value: 500000 },
    received: { value: 350000 },
    upi: { value: 200000 },
    bank: { value: 150000 },
  };

  /** ================== WAREHOUSES ================== **/
  const pieDataWarehouses = [
    { name: "Inward", value: 400 },
    { name: "Outward", value: 300 },
    { name: "Damaged", value: 20 },
  ];
  const COLORS_WAREHOUSES = ["#607D8B", "#00BCD4", "#F44336"];
  const warehouseDetails = {
    stockSummary: { totalStock: 10000, totalAltQty: 850 },
    inwardOutward: { inward: 400, outward: 300 },
    damagedStock: { poId: "PO1234", warehouse: "WH-01", returnCount: 20 },
    currentInventory: { quantity: 9200, altQuantity: 780 },
  };

  /** ================== EMPLOYEES & TEAMS ================== **/
  const pieDataEmployees = [
    { name: "Division", value: 60 },
    { name: "Zone", value: 45 },
    { name: "Sub-zone", value: 30 },
    { name: "Team", value: 15 },
  ];
  const COLORS_EMPLOYEES = ["#3F51B5", "#009688", "#FF5722", "#795548"];
  const employeesDetails = {
    topDivision: "North Division",
    topZone: "Zone A",
    topSubZone: "Sub Zone 1",
    topTeam: "Team Alpha",
    topEmployee: "John Doe",
  };

  /** ================== DISCOUNTS & CREDIT NOTES ================== **/
  const pieDataCredit = [
    { name: "Credit Notes Generated", value: 50 },
    { name: "Bill to Bill Total", value: 30 },
    { name: "Monthly Total", value: 20 },
  ];
  const COLORS_CREDIT = ["#673AB7", "#8BC34A", "#FFC107"];
  const creditDetails = {
    creditGenerated: 50,
    billToBill: 30,
    monthlyTotal: 20,
    creditAmount: 50000,
  };

  /** ================== PURCHASE ORDERS ================== **/
  const pieDataPurchase = [
    { name: "Orders Raised", value: 200 },
    { name: "Pending StockIn", value: 50 },
  ];
  const COLORS_PURCHASE = ["#4CAF50", "#E91E63"];
  const purchaseDetails = {
    totalOrders: 200,
    totalValue: 1500000,
    totalQty: 3500,
    altQty: 280,
    pendingStockIn: 50,
  };

  return (
    <div className={styles.maincontainer}>
      <h1 className={styles.mainHead}>Daily Cumulative Reports</h1>

      {/* ============= SALES ORDERS ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Sales Orders</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataOrders} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataOrders.map((entry, index) => (
                  <Cell key={index} fill={COLORS_ORDERS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>Total Confirmed Sales Orders</h3>
            <p>Value: ₹{orderDetails.confirmed.value}</p>
            <p>Quantity: {orderDetails.confirmed.qty}</p>
            <p>Alt Qty (Tonnes): {orderDetails.confirmed.altQtyTonnes}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Dispatched Sales Orders</h3>
            <p>Value: ₹{orderDetails.dispatched.value}</p>
            <p>Quantity: {orderDetails.dispatched.qty}</p>
            <p>Alt Qty (Tonnes): {orderDetails.dispatched.altQtyTonnes}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Delivered Sales Orders</h3>
            <p>Value: ₹{orderDetails.delivered.value}</p>
            <p>Quantity: {orderDetails.delivered.qty}</p>
            <p>Alt Qty (Tonnes): {orderDetails.delivered.altQtyTonnes}</p>
          </div>
        </div>
      </div>

      {/* ============= PAYMENTS ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Payments</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataPayments} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataPayments.map((entry, index) => (
                  <Cell key={index} fill={COLORS_PAYMENTS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}><h3>Total Payment Submitted</h3><p>₹{paymentDetails.submitted.value}</p></div>
          <div className={styles.card}><h3>Total Payment Received</h3><p>₹{paymentDetails.received.value}</p></div>
          <div className={styles.card}><h3>Payments Received by Modes</h3><p>UPI: ₹{paymentDetails.upi.value}</p><p>Bank Transfer: ₹{paymentDetails.bank.value}</p></div>
        </div>
      </div>

      {/* ============= WAREHOUSES ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Warehouses</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataWarehouses} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataWarehouses.map((entry, index) => (
                  <Cell key={index} fill={COLORS_WAREHOUSES[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>Stock Summary</h3>
            <p>Total Stock: {warehouseDetails.stockSummary.totalStock}</p>
            <p>Alt Qty: {warehouseDetails.stockSummary.totalAltQty}</p>
          </div>
          <div className={styles.card}>
            <h3>Product Inward & Outward</h3>
            <p>Inward: {warehouseDetails.inwardOutward.inward}</p>
            <p>Outward: {warehouseDetails.inwardOutward.outward}</p>
          </div>
          <div className={styles.card}>
            <h3>Damaged Stock</h3>
            <p>PO ID: {warehouseDetails.damagedStock.poId}</p>
            <p>Warehouse: {warehouseDetails.damagedStock.warehouse}</p>
            <p>Return Count: {warehouseDetails.damagedStock.returnCount}</p>
          </div>
          <div className={styles.card}>
            <h3>Current Inventory</h3>
            <p>Quantity: {warehouseDetails.currentInventory.quantity}</p>
            <p>Alt Quantity: {warehouseDetails.currentInventory.altQuantity}</p>
          </div>
        </div>
      </div>

      {/* ============= EMPLOYEES & TEAMS ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Employees & Teams</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataEmployees} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataEmployees.map((entry, index) => (
                  <Cell key={index} fill={COLORS_EMPLOYEES[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}><h3>Top Performed Division</h3><p>{employeesDetails.topDivision}</p></div>
          <div className={styles.card}><h3>Top Performed Zone</h3><p>{employeesDetails.topZone}</p></div>
          <div className={styles.card}><h3>Top Performed Sub-Zone</h3><p>{employeesDetails.topSubZone}</p></div>
          <div className={styles.card}><h3>Top Performed Team</h3><p>{employeesDetails.topTeam}</p></div>
          <div className={styles.card}><h3>Top Performed Employee</h3><p>{employeesDetails.topEmployee}</p></div>
        </div>
      </div>

      {/* ============= DISCOUNTS & CREDIT NOTES ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Discounts & Credit Notes</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataCredit} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataCredit.map((entry, index) => (
                  <Cell key={index} fill={COLORS_CREDIT[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}><h3>Credit Notes Generated</h3><p>{creditDetails.creditGenerated}</p></div>
          <div className={styles.card}><h3>Bill to Bill & Monthly Total</h3><p>Bill to Bill: {creditDetails.billToBill}</p><p>Monthly Total: {creditDetails.monthlyTotal}</p></div>
          <div className={styles.card}><h3>Credit Note Amount</h3><p>₹{creditDetails.creditAmount}</p></div>
        </div>
      </div>

      {/* ============= PURCHASE ORDERS ============= */}
      <div className={styles.container}>
        <h2 className={styles.heading}>Purchase Orders</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieDataPurchase} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {pieDataPurchase.map((entry, index) => (
                  <Cell key={index} fill={COLORS_PURCHASE[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}><h3>Total Orders Raised</h3><p>{purchaseDetails.totalOrders}</p></div>
          <div className={styles.card}><h3>Total Orders Value</h3><p>₹{purchaseDetails.totalValue}</p></div>
          <div className={styles.card}><h3>Total Orders Quantity</h3><p>Quantity: {purchaseDetails.totalQty}</p><p>Alt Quantity: {purchaseDetails.altQty}</p></div>
          <div className={styles.card}><h3>Pending Orders for StockIn</h3><p>{purchaseDetails.pendingStockIn}</p></div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
