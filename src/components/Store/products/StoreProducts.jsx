import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaBox, FaEdit, FaTag, FaSearch } from "react-icons/fa";

export default function StoreProducts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mockProductsData = {
    catalogSize: 128,
    priceUpdates30d: 12,
    outOfStock: 5,
    newProducts: 8,
    topProducts: [
      { name: "Product A", category: "Feed", price: 250, stock: 45, sales: 120 },
      { name: "Product B", category: "Feed", price: 180, stock: 32, sales: 95 },
      { name: "Product C", category: "Supplement", price: 350, stock: 28, sales: 78 },
      { name: "Product D", category: "Feed", price: 220, stock: 15, sales: 65 },
      { name: "Product E", category: "Supplement", price: 420, stock: 20, sales: 55 }
    ]
  };

  return (
    <div style={{ padding: isMobile ? '12px 8px' : '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: isMobile ? '22px' : '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Products & Pricing</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#666',
          margin: 0
        }}>Manage your product catalog and pricing</p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div
          className="col"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            ...(isMobile && {
              flexDirection: 'row',
              gap: '6px',
              paddingLeft: '8px',
              paddingRight: '8px',
              marginLeft: '0',
              width: '100%'
            }),
            ...(!isMobile && {
              gap: '12px'
            })
          }}
        >
          <button 
            className="homebtn"
            onClick={() => navigate('/store/products/manage')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              ...(isMobile ? {
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                flex: '0 0 calc(33.333% - 4px)',
                maxWidth: 'calc(33.333% - 4px)',
                width: 'calc(33.333% - 4px)',
                minHeight: '32px',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                margin: 0
              } : {
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              })
            }}
          >
            Manage Products and Prices
          </button>
          <button 
            className="homebtn"
            onClick={() => navigate('/store/products/bulk-update')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              ...(isMobile ? {
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                flex: '0 0 calc(33.333% - 4px)',
                maxWidth: 'calc(33.333% - 4px)',
                width: 'calc(33.333% - 4px)',
                minHeight: '32px',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                margin: 0
              } : {
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              })
            }}
          >
            Bulk Price Update
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
        <ReusableCard title="Catalog Size" value={mockProductsData.catalogSize.toString()} />
        <ReusableCard title="Price Updates (30d)" value={mockProductsData.priceUpdates30d.toString()} color="purple.500" />
        <ReusableCard title="Out of Stock" value={mockProductsData.outOfStock.toString()} color="red.500" />
        <ReusableCard title="New Products" value={mockProductsData.newProducts.toString()} color="green.500" />
      </Flex>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          position: 'relative',
          maxWidth: '500px'
        }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: '18px'
          }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontFamily: 'Poppins',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      </div>

      {/* Top Products Table */}
      <div className={styles.orderStatusCard}>
        <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
          Top Selling Products
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginBottom: 0, fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Product</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Category</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Price</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Stock</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Sales</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockProductsData.topProducts.map((product, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{product.name}</td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                    <span className="badge bg-secondary" style={{ fontFamily: 'Poppins', fontSize: '11px' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                    ₹{product.price}
                  </td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                    {product.stock}
                    {product.stock < 20 && (
                      <span className="badge bg-warning ms-2" style={{ fontFamily: 'Poppins', fontSize: '9px' }}>Low</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>{product.sales}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                    >
                      <FaEdit style={{ fontSize: '12px', marginRight: '4px' }} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
