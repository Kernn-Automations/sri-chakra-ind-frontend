import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import storeService from "../../../services/storeService";

function CreateStoreCustomer() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [customerData, setCustomerData] = useState(null);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    area: "",
    city: "",
    pincode: "",
    address: "",
  });

  // Get current store ID from localStorage
  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        return store.id;
      }
      const currentStoreId = localStorage.getItem("currentStoreId");
      return currentStoreId ? parseInt(currentStoreId) : null;
    } catch (e) {
      console.error("Error parsing store data:", e);
      return null;
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name || form.name.trim() === "") {
      setError("Customer name is required");
      setIsModalOpen(true);
      return false;
    }
    if (!form.mobile || form.mobile.trim() === "") {
      setError("Mobile number is required");
      setIsModalOpen(true);
      return false;
    }
    // Validate mobile number (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(form.mobile.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number");
      setIsModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const storeId = getStoreId();
    if (!storeId) {
      setError("Store not selected. Please select a store first.");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      setCustomerData(null);

      // Prepare request body - include storeId as required by backend
      const requestBody = {
        storeId: storeId,
        name: form.name.trim(),
        mobile: form.mobile.replace(/\D/g, ""), // Remove non-digits
        ...(form.email && form.email.trim() && { email: form.email.trim() }),
        ...(form.area && form.area.trim() && { area: form.area.trim() }),
        ...(form.city && form.city.trim() && { city: form.city.trim() }),
        ...(form.pincode && form.pincode.trim() && { pincode: form.pincode.trim() }),
        ...(form.address && form.address.trim() && { address: form.address.trim() }),
      };

      console.log("Creating/finding customer with data:", requestBody);

      // Use storeService which handles authentication properly
      const response = await storeService.createOrFindCustomer(requestBody);

      console.log("Customer API response:", response);

      if (response) {
        const { success, message, data } = response;
        
        if (success && data) {
          setCustomerData(data);
          setSuccessMessage(message || "Customer processed successfully");
          
          // Show success message and navigate after a delay
          setTimeout(() => {
            navigate("/store/customers/list");
          }, 2000);
        } else {
          setError(message || "Failed to create/find customer");
          setIsModalOpen(true);
        }
      } else {
        setError("Unexpected response format");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Error creating/finding customer:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        "Failed to create/find customer. Please try again.";
      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Create Customer
      </p>

      <div className="p-4">
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <h4
            style={{
              fontFamily: "Poppins",
              fontWeight: 600,
              marginBottom: "24px",
              color: "var(--primary-color)",
            }}
          >
            Create Customer
          </h4>

          {successMessage && customerData && (
            <div
              style={{
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "20px",
                color: "#155724",
                fontFamily: "Poppins",
              }}
            >
              <strong>✓ {successMessage}</strong>
              <div style={{ marginTop: "8px", fontSize: "14px" }}>
                <p style={{ margin: "4px 0" }}>
                  <strong>Customer Code:</strong> {customerData.customerCode}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Name:</strong> {customerData.name}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Mobile:</strong> {customerData.mobile}
                </p>
                {customerData.store && (
                  <p style={{ margin: "4px 0" }}>
                    <strong>Store:</strong> {customerData.store.name}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Customer Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter customer name"
                  required
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Mobile Number <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={form.mobile}
                  onChange={(e) => {
                    // Only allow digits, max 10
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    handleChange("mobile", value);
                  }}
                  placeholder="Enter 10-digit mobile number"
                  required
                  maxLength={10}
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter email (optional)"
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Area
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={form.area}
                  onChange={(e) => handleChange("area", e.target.value)}
                  placeholder="Enter area (optional)"
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  City
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Enter city (optional)"
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-md-6" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Pincode
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={form.pincode}
                  onChange={(e) => {
                    // Only allow digits, max 6
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    handleChange("pincode", value);
                  }}
                  placeholder="Enter pincode (optional)"
                  maxLength={6}
                  style={{ fontFamily: "Poppins" }}
                />
              </div>

              <div className="col-12" style={{ marginBottom: "20px" }}>
                <label style={{ fontFamily: "Poppins", fontWeight: 500, marginBottom: "8px", display: "block" }}>
                  Address
                </label>
                <textarea
                  className="form-control"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter full address (optional)"
                  rows={3}
                  style={{ fontFamily: "Poppins" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                type="submit"
                className="homebtn"
                disabled={loading}
                style={{ fontFamily: "Poppins" }}
              >
                {loading ? "Processing..." : "Create Customer"}
              </button>
              <button
                type="button"
                className="homebtn"
                onClick={() => navigate("/store/customers")}
                disabled={loading}
                style={{
                  fontFamily: "Poppins",
                  background: "#6c757d",
                  borderColor: "#6c757d",
                }}
              >
                Cancel
              </button>
            </div>
          </form>

          {loading && (
            <div style={{ marginTop: "20px" }}>
              <Loading />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default CreateStoreCustomer;

