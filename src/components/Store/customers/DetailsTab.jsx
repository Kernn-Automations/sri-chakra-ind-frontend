import React from "react";

function DetailsTab({ customer }) {
  if (!customer) {
    return null;
  }

  const detailRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#4b5563",
    fontSize: "14px",
    margin: 0,
  };

  const detailLabelStyle = {
    minWidth: "110px",
    color: "#111827",
    fontWeight: 600,
  };

  const renderDetail = (label, value, fullWidth = false) => {
    if (!value) return null;

    return (
      <div className={`col-md-${fullWidth ? "12" : "6"}`} style={{ marginBottom: "16px" }}>
        <p style={detailRowStyle}>
          <span style={detailLabelStyle}>{label}</span>
          <span>{value}</span>
        </p>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        padding: "20px",
        marginTop: "20px",
        fontFamily: "Poppins",
      }}
    >
      <h5
        style={{
          fontFamily: "Poppins",
          fontWeight: 600,
          marginBottom: "20px",
          color: "var(--primary-color)",
        }}
      >
        Customer Information
      </h5>

      <div className="row">
        {renderDetail("Name:", customer.name || customer.farmerName || customer.label || customer.customerName || "N/A")}
        {renderDetail("Farmer Name:", customer.farmerName || customer.name || customer.label || "N/A")}
        {renderDetail("Mobile:", customer.mobile || customer.phone || customer.phoneNo || "N/A")}
        {renderDetail("Email:", customer.email || "N/A")}
        {renderDetail("Village:", customer.villageName || customer.village || customer.area || "N/A")}
        {renderDetail("Area:", customer.area || "N/A")}
        {renderDetail("City:", customer.city || "N/A")}
        {renderDetail("State:", customer.state || "N/A")}
        {renderDetail("Pincode:", customer.pincode || "N/A")}
        {renderDetail("Address:", customer.address || "N/A", true)}
        {renderDetail("Number of Cows:", customer.noOfCows || "N/A")}
        {renderDetail("Number of Buffaloes:", customer.noOfBuffaloes || "N/A")}

        <div className="col-md-6" style={{ marginBottom: "16px" }}>
          <p style={detailRowStyle}>
            <span style={detailLabelStyle}>Status:</span>
            <span>
              <span className={`badge ${customer.isActive ? "bg-success" : "bg-secondary"}`}>
                {customer.isActive ? "Active" : "Inactive"}
              </span>
            </span>
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <h5
          style={{
            fontFamily: "Poppins",
            fontWeight: 600,
            marginBottom: "20px",
            color: "var(--primary-color)",
          }}
        >
          Statistics
        </h5>
        <div className="row">
          <div className="col-md-4" style={{ marginBottom: "16px" }}>
            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <h6
                style={{
                  margin: "0 0 4px 0",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  color: "var(--primary-color)",
                }}
              >
                {customer.totalOrders || customer.saleCount || 0}
              </h6>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Total Orders</p>
            </div>
          </div>

          <div className="col-md-4" style={{ marginBottom: "16px" }}>
            <div
              style={{
                background: "rgba(5, 150, 105, 0.1)",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <h6
                style={{
                  margin: "0 0 4px 0",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  color: "#047857",
                }}
              >
                ₹{(customer.totalSpent || customer.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h6>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Total Purchases</p>
            </div>
          </div>

          <div className="col-md-4" style={{ marginBottom: "16px" }}>
            <div
              style={{
                background: "rgba(217, 119, 6, 0.1)",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <h6
                style={{
                  margin: "0 0 4px 0",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  color: "#b45309",
                  fontSize: "14px"
                }}
              >
                {customer.lastOrder 
                  ? new Date(customer.lastOrder).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : customer.lastPurchaseDate
                    ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : "N/A"}
              </h6>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Last Purchase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailsTab;

