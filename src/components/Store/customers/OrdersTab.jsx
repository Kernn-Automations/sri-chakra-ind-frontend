import React from "react";
import styles from "../../Dashboard/Purchases/Purchases.module.css";

function OrdersTab({ customer }) {
  if (!customer || !customer.orders || customer.orders.length === 0) {
    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px',
        fontFamily: 'Poppins',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>No orders found for this customer</p>
      </div>
    );
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
        Orders ({customer.orders.length})
      </h5>
      
      <div style={{ overflowX: 'auto' }}>
        <table className={`table table-bordered borderedtable`}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Order ID</th>
              <th>Date</th>
              <th>Products</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.orders.map((order, index) => (
              <tr
                key={index}
                className="animated-row"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <td>{index + 1}</td>
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>
                  {order.itemsList && order.itemsList.length > 0 ? (
                    <div style={{ fontSize: '13px' }}>
                      {order.itemsList.map((item, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: '#666', marginLeft: '6px' }}>
                             x {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>{order.items} items</span>
                  )}
                </td>
                <td>₹{order.amount.toLocaleString()}</td>
                <td>
                  <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Pending' ? 'bg-warning' : 'bg-info'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersTab;

