import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';

const DamagedGoods = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [damagedGoods, setDamagedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [damageTypeFilter, setDamageTypeFilter] = useState('all');

  useEffect(() => {
    loadDamagedGoods();
  }, [selectedDivision, showAllDivisions]);

  const loadDamagedGoods = async () => {
    try {
      setLoading(true);
      const divisionId = selectedDivision?.id || null;
      
      // Get all return requests and filter for damaged goods
      const returnsResponse = await returnsService.getReturnRequests({}, divisionId, showAllDivisions);
      
      if (returnsResponse.success) {
        const returnRequests = returnsResponse.data.returnRequests || [];
        
        // Filter for damaged goods returns
        const damagedReturns = returnRequests.filter(returnRequest => {
          const hasDamagedItems = returnRequest.returnItems?.some(item => 
            item.itemCondition === 'damaged' || 
            item.destinationType === 'damaged_goods'
          );
          
          const isDamageReason = returnRequest.returnReason?.includes('DAMAGE') || 
                                returnRequest.returnReason?.includes('EXPIR');
          
          return hasDamagedItems || isDamageReason;
        });
        
        setDamagedGoods(damagedReturns);
      }
    } catch (error) {
      console.error('Error loading damaged goods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeItem = async (returnItem, item) => {
    if (!window.confirm('Are you sure you want to mark this item as disposed? This action cannot be undone.')) {
      return;
    }
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      // Update the return item to mark as disposed
      const updateData = {
        status: 'disposed',
        disposedAt: new Date().toISOString(),
        disposedBy: JSON.parse(localStorage.getItem("user")).id
      };
      
      // This would typically be a separate API endpoint for disposing items
      // For now, we'll update the return request status
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        updateData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Item marked as disposed successfully');
        loadDamagedGoods();
      } else {
        alert(response.message || 'Failed to dispose item');
      }
    } catch (error) {
      console.error('Error disposing item:', error);
      alert('Error disposing item');
    }
  };

  const handleRestockItem = async (returnItem, item) => {
    if (!window.confirm('Are you sure you want to restock this item? It will be moved back to warehouse inventory.')) {
      return;
    }
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      // Update the return item to mark as restocked
      const updateData = {
        status: 'restocked',
        restockedAt: new Date().toISOString(),
        restockedBy: JSON.parse(localStorage.getItem("user")).id
      };
      
      const response = await returnsService.approveRejectReturn(
        returnItem.id,
        updateData,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        alert('Item restocked successfully');
        loadDamagedGoods();
      } else {
        alert(response.message || 'Failed to restock item');
      }
    } catch (error) {
      console.error('Error restocking item:', error);
      alert('Error restocking item');
    }
  };

  const getDamageTypeBadge = (reason, condition) => {
    if (reason?.includes('DAMAGE')) {
      return `${styles.typeBadge} ${styles.damaged}`;
    } else if (reason?.includes('EXPIR')) {
      return `${styles.typeBadge} ${styles.expired}`;
    } else if (condition === 'damaged') {
      return `${styles.typeBadge} ${styles.damaged}`;
    } else if (condition === 'expired') {
      return `${styles.typeBadge} ${styles.expired}`;
    }
    return `${styles.typeBadge} ${styles.pending}`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.pending,
      approved: styles.approved,
      processing: styles.processing,
      disposed: styles.rejected,
      restocked: styles.quality
    };
    
    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;
  };

  // Filter damaged goods based on search and filters
  const filteredDamagedGoods = damagedGoods.filter(returnItem => {
    const matchesSearch = 
      returnItem.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.salesOrder?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.salesOrder?.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    
    const matchesDamageType = damageTypeFilter === 'all' || 
      (damageTypeFilter === 'damage' && returnItem.returnReason?.includes('DAMAGE')) ||
      (damageTypeFilter === 'expired' && returnItem.returnReason?.includes('EXPIR')) ||
      (damageTypeFilter === 'condition' && returnItem.returnItems?.some(item => 
        item.itemCondition === 'damaged' || item.itemCondition === 'expired'
      ));
    
    return matchesSearch && matchesStatus && matchesDamageType;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading damaged goods...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Damaged Goods Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={loadDamagedGoods}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label className={styles.formLabel}>Search</label>
            <input
              type="text"
              placeholder="Search by return number, order number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.formInput}
            />
          </div>
          
          <div>
            <label className={styles.formLabel}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="disposed">Disposed</option>
              <option value="restocked">Restocked</option>
            </select>
          </div>
          
          <div>
            <label className={styles.formLabel}>Damage Type</label>
            <select
              value={damageTypeFilter}
              onChange={(e) => setDamageTypeFilter(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">All Types</option>
              <option value="damage">Damage</option>
              <option value="expired">Expired</option>
              <option value="condition">Item Condition</option>
            </select>
          </div>
        </div>
      </div>

      {filteredDamagedGoods.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <p className={styles.emptyStateText}>No damaged goods found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredDamagedGoods.map((returnItem) => (
            <div 
              key={returnItem.id} 
              style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '10px', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e74c3c'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#2c3e50' }}>{returnItem.returnNumber}</h4>
                  <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
                    Order: {returnItem.salesOrder?.orderNumber} | 
                    Customer: {returnItem.salesOrder?.customer?.customerName}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span className={getStatusBadge(returnItem.status)}>
                    {returnItem.status}
                  </span>
                  <span className={getDamageTypeBadge(returnItem.returnReason)}>
                    {returnItem.returnReason?.includes('DAMAGE') ? 'Damage' : 
                     returnItem.returnReason?.includes('EXPIR') ? 'Expired' : 'Damaged'}
                  </span>
                </div>
              </div>
              
              {/* Damaged Items */}
              {returnItem.returnItems && returnItem.returnItems.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#e74c3c' }}>Damaged Items:</h5>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {returnItem.returnItems
                      .filter(item => item.itemCondition === 'damaged' || item.itemCondition === 'expired' || item.destinationType === 'damaged_goods')
                      .map((item, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '10px',
                          backgroundColor: '#fdf2f2',
                          borderRadius: '5px',
                          border: '1px solid #fecaca'
                        }}
                      >
                        <div>
                          <strong>{item.product?.productName || 'Unknown Product'}</strong>
                          <br />
                          <small>
                            Quantity: {item.returnQuantity} {item.unit} | 
                            Condition: {item.itemCondition} | 
                            Destination: {item.destinationType}
                          </small>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {returnItem.status === 'approved' && (
                            <>
                              <button
                                className={`${styles.btn} ${styles.btnWarning}`}
                                onClick={() => handleRestockItem(returnItem, item)}
                                style={{ fontSize: '12px', padding: '5px 10px' }}
                              >
                                Restock
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() => handleDisposeItem(returnItem, item)}
                                style={{ fontSize: '12px', padding: '5px 10px' }}
                              >
                                Dispose
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '14px', color: '#7f8c8d' }}>
                <div>
                  <strong>Return Reason:</strong>
                  <p style={{ margin: '5px 0' }}>{returnItem.returnReason}</p>
                </div>
                <div>
                  <strong>Created:</strong>
                  <p style={{ margin: '5px 0' }}>{new Date(returnItem.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <strong>Notes:</strong>
                  <p style={{ margin: '5px 0' }}>{returnItem.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DamagedGoods;
