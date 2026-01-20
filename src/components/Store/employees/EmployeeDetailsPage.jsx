import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import EmployeeTabSection from "./EmployeeTabSection";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      // const res = await axiosAPI.get(`/employees/${id}`);
      // setEmployee(res.data);
      
      // Mock employee data
      const mockEmployee = {
        id: id,
        name: "Rajesh Kumar",
        mobile: "9876543210",
        email: "rajesh@example.com",
        role: "Sales Executive",
        department: "Sales",
        joiningDate: "15-01-2022",
        address: "123 Main Street, Downtown",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isActive: true,
        totalSales: 45,
        totalRevenue: 1250000,
        averageOrderValue: 27778,
        performance: {
          thisMonth: { sales: 12, revenue: 350000, target: 400000, salesTarget: 14 },
          lastMonth: { sales: 15, revenue: 420000, target: 400000, salesTarget: 14 },
          thisYear: { sales: 45, revenue: 1250000, target: 1200000, salesTarget: 50 }
        },
        sales: [
          { id: "SALE001", date: "15-01-2024", customer: "Customer A", amount: 35000, status: "Completed" },
          { id: "SALE002", date: "12-01-2024", customer: "Customer B", amount: 28000, status: "Completed" },
          { id: "SALE003", date: "10-01-2024", customer: "Customer C", amount: 42000, status: "Completed" },
          { id: "SALE004", date: "08-01-2024", customer: "Customer D", amount: 19000, status: "Completed" },
          { id: "SALE005", date: "05-01-2024", customer: "Customer E", amount: 31000, status: "Completed" }
        ]
      };
      setEmployee(mockEmployee);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employee details");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Loading />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4">
        <p>Employee not found</p>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i> Employee Details
      </p>

      <div className="p-4">
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '10px', color: 'var(--primary-color)' }}>
            {employee.name}
          </h4>
          <p style={{ fontFamily: 'Poppins', color: '#666', margin: 0 }}>
            {employee.mobile} {employee.email ? `• ${employee.email}` : ''}
          </p>
          <p style={{ fontFamily: 'Poppins', color: '#666', margin: '4px 0 0 0' }}>
            {employee.role} • {employee.department}
          </p>
        </div>

        <EmployeeTabSection employee={employee} />
      </div>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default EmployeeDetailsPage;

