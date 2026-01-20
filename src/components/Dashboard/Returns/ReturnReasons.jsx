import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';

const ReturnReasons = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [reasons, setReasons] = useState([]);
  const [damagedGoodsReasons, setDamagedGoodsReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReturnCase, setSelectedReturnCase] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadReturnReasons();
    loadDamagedGoodsReasons();
  }, [selectedDivision, showAllDivisions, selectedCategory, selectedReturnCase]);

  const loadReturnReasons = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedReturnCase !== 'all') {
        params.returnCase = selectedReturnCase;
      }
      
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getReturnReasons(params, divisionId, showAllDivisions);
      
      if (response.success) {
        // Extract returnReasons array from response.data
        const data = response.data || {};
        const returnReasons = data.returnReasons || [];
        setReasons(Array.isArray(returnReasons) ? returnReasons : []);
      } else {
        console.error('Error loading return reasons:', response.message);
        setReasons([]);
      }
    } catch (error) {
      console.error('Error loading return reasons:', error);
      setReasons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDamagedGoodsReasons = async () => {
    try {
      const divisionId = selectedDivision?.id || null;
      const response = await returnsService.getDamagedGoodsReasons(divisionId, showAllDivisions);
      
      console.log('loadDamagedGoodsReasons response:', response);
      
      if (response.success) {
        // Extract returnReasons array from response.data
        const data = response.data || {};
        const returnReasons = data.returnReasons || [];
        setDamagedGoodsReasons(Array.isArray(returnReasons) ? returnReasons : []);
      } else {
        console.error('Error loading damaged goods reasons:', response.message);
        setDamagedGoodsReasons([]);
      }
    } catch (error) {
      console.error('Error loading damaged goods reasons:', error);
      setDamagedGoodsReasons([]);
    }
  };

  const getCategoryBadge = (category) => {
    const categoryClasses = {
      damage: styles.damaged,
      quality: styles.quality,
      customer: styles.cancellation,
      logistics: styles.expired,
      other: styles.pending
    };
    
    return `${styles.typeBadge} ${categoryClasses[category] || styles.pending}`;
  };

  const getReturnCaseBadge = (returnCase) => {
    const caseClasses = {
      pre_dispatch: styles.pending,
      post_delivery: styles.approved
    };
    
    return `${styles.statusBadge} ${caseClasses[returnCase] || styles.pending}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading return reasons...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Return Reasons</h2>
      </div>

      {/* Tabs */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Return Reasons
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'damaged' ? styles.active : ''}`}
            onClick={() => setActiveTab('damaged')}
          >
            Damaged Goods Reasons
          </button>
        </div>

        {/* Filters - Only show for regular return reasons */}
        {activeTab === 'all' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label className={styles.formLabel}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.formSelect}
              >
                <option value="all">All Categories</option>
                <option value="quality">Quality</option>
                <option value="damage">Damage</option>
                <option value="customer">Customer</option>
                <option value="logistics">Logistics</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className={styles.formLabel}>Return Case</label>
              <select
                value={selectedReturnCase}
                onChange={(e) => setSelectedReturnCase(e.target.value)}
                className={styles.formSelect}
              >
                <option value="all">All Cases</option>
                <option value="pre_dispatch">Pre-Dispatch</option>
                <option value="post_delivery">Post-Delivery</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Display content based on active tab */}
      {activeTab === 'all' ? (
        // Regular Return Reasons
        (!Array.isArray(reasons) || reasons.length === 0) ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📋</div>
            <p className={styles.emptyStateText}>No return reasons found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {reasons.map((reason) => (
              <div 
                key={reason.id} 
                style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '10px', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#2c3e50' }}>{reason.reasonName || reason.name}</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={getCategoryBadge(reason.category)}>
                      {reason.category}
                    </span>
                    {reason.applicableCases && reason.applicableCases.length > 0 && (
                      <span className={getReturnCaseBadge(reason.applicableCases[0])}>
                        {reason.applicableCases[0]?.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                
                {reason.description && (
                  <p style={{ margin: '10px 0', color: '#7f8c8d', lineHeight: '1.5' }}>
                    {reason.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px', fontSize: '14px', color: '#95a5a6' }}>
                  {reason.requiresImage && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c' }}>
                      📷 Requires Image
                    </span>
                  )}
                  {reason.requiresApproval && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f39c12' }}>
                      ✅ Requires Approval
                    </span>
                  )}
                  {reason.autoDestination && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3498db' }}>
                      📦 Auto-destination: {reason.autoDestination.replace('_', ' ')}
                    </span>
                  )}
                  {reason.isActive !== undefined && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      color: reason.isActive ? '#27ae60' : '#e74c3c'
                    }}>
                      {reason.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Damaged Goods Reasons
        (!Array.isArray(damagedGoodsReasons) || damagedGoodsReasons.length === 0) ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>⚠️</div>
            <p className={styles.emptyStateText}>No damaged goods reasons found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {damagedGoodsReasons.map((reason) => (
              <div 
                key={reason.id} 
                style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '10px', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: '1px solid #e74c3c'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#2c3e50' }}>{reason.reasonName}</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={styles.damaged}>
                      Damaged Goods
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px', fontSize: '14px', color: '#95a5a6' }}>
                  {reason.requiresImage && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c' }}>
                      📷 Requires Image
                    </span>
                  )}
                  {reason.autoDestination && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c' }}>
                      📦 Auto-destination: {reason.autoDestination.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ReturnReasons;


