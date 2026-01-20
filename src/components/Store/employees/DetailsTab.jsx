import React from "react";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaCalendarAlt, FaShoppingCart, FaRupeeSign } from "react-icons/fa";

function DetailsTab({ employee }) {
  if (!employee) {
    return null;
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px',
      marginTop: '20px',
      fontFamily: 'Poppins'
    }}>
      <h5 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '20px', color: 'var(--primary-color)' }}>
        Employee Information
      </h5>
      
      <div className="row">
        <div className="col-md-6" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FaUser style={{ color: 'var(--primary-color)' }} />
            <strong>Name:</strong>
          </div>
          <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.name}</p>
        </div>

        <div className="col-md-6" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FaPhone style={{ color: 'var(--primary-color)' }} />
            <strong>Mobile:</strong>
          </div>
          <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.mobile}</p>
        </div>

        {employee.email && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaEnvelope style={{ color: 'var(--primary-color)' }} />
              <strong>Email:</strong>
            </div>
            <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.email}</p>
          </div>
        )}

        {employee.role && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaBriefcase style={{ color: 'var(--primary-color)' }} />
              <strong>Role:</strong>
            </div>
            <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.role}</p>
          </div>
        )}

        {employee.department && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaBriefcase style={{ color: 'var(--primary-color)' }} />
              <strong>Department:</strong>
            </div>
            <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.department}</p>
          </div>
        )}

        {employee.joiningDate && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaCalendarAlt style={{ color: 'var(--primary-color)' }} />
              <strong>Joining Date:</strong>
            </div>
            <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.joiningDate}</p>
          </div>
        )}

        {employee.address && (
          <div className="col-md-12" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaMapMarkerAlt style={{ color: 'var(--primary-color)' }} />
              <strong>Address:</strong>
            </div>
            <p style={{ marginLeft: '28px', margin: 0, color: '#666' }}>{employee.address}</p>
          </div>
        )}

        {employee.city && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <strong>City:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>{employee.city}</p>
          </div>
        )}

        {employee.state && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <strong>State:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>{employee.state}</p>
          </div>
        )}

        {employee.pincode && (
          <div className="col-md-6" style={{ marginBottom: '16px' }}>
            <strong>Pincode:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>{employee.pincode}</p>
          </div>
        )}

        <div className="col-md-6" style={{ marginBottom: '16px' }}>
          <strong>Status:</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            <span className={`badge ${employee.isActive ? 'bg-success' : 'bg-secondary'}`}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <h5 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '20px', color: 'var(--primary-color)' }}>
          Statistics
        </h5>
        <div className="row">
          <div className="col-md-4" style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '8px', 
              padding: '16px',
              textAlign: 'center'
            }}>
              <FaShoppingCart style={{ fontSize: '24px', color: 'var(--primary-color)', marginBottom: '8px' }} />
              <h6 style={{ margin: '8px 0 4px 0', fontFamily: 'Poppins', fontWeight: 600 }}>
                {employee.totalSales || 0}
              </h6>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Sales</p>
            </div>
          </div>

          <div className="col-md-4" style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(5, 150, 105, 0.1)', 
              borderRadius: '8px', 
              padding: '16px',
              textAlign: 'center'
            }}>
              <FaRupeeSign style={{ fontSize: '24px', color: '#059669', marginBottom: '8px' }} />
              <h6 style={{ margin: '8px 0 4px 0', fontFamily: 'Poppins', fontWeight: 600 }}>
                ₹{(employee.totalRevenue || 0).toLocaleString()}
              </h6>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Revenue</p>
            </div>
          </div>

          <div className="col-md-4" style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(217, 119, 6, 0.1)', 
              borderRadius: '8px', 
              padding: '16px',
              textAlign: 'center'
            }}>
              <FaRupeeSign style={{ fontSize: '24px', color: '#d97706', marginBottom: '8px' }} />
              <h6 style={{ margin: '8px 0 4px 0', fontFamily: 'Poppins', fontWeight: 600 }}>
                ₹{(employee.averageOrderValue || 0).toLocaleString()}
              </h6>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Average Order Value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailsTab;















