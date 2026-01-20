import React, { useState } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import { fetchWithDivision } from '../../../utils/fetchWithDivision';
import styles from './Returns.module.css';

const ReturnTypes = ({ returnTypes, onRefresh }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [viewingType, setViewingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewFormData, setViewFormData] = useState({
    requiresInspection: false,
    requiresReplacement: false,
    allowsCreditNote: false,
    isActive: true
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    requiresInspection: false,
    requiresReplacement: false,
    allowsCreditNote: false,
    isActive: true
  });

  const predefinedTypes = [
    {
      id: 'damaged',
      name: 'Damaged Goods',
      description: 'Goods damaged during delivery or handling',
      category: 'delivery_damage',
      requiresInspection: true,
      requiresReplacement: true,
      allowsCreditNote: true,
      isActive: true
    },
    {
      id: 'expired',
      name: 'Expired Goods',
      description: 'Goods that have passed their expiration date',
      category: 'expiration',
      requiresInspection: true,
      requiresReplacement: true,
      allowsCreditNote: true,
      isActive: true
    },
    {
      id: 'quality',
      name: 'Quality Issues',
      description: 'Customer dissatisfaction with product quality',
      category: 'quality',
      requiresInspection: false,
      requiresReplacement: true,
      allowsCreditNote: true,
      isActive: true
    },
    {
      id: 'cancellation',
      name: 'Order Cancellation',
      description: 'Cancellation before delivery or after delivery',
      category: 'cancellation',
      requiresInspection: false,
      requiresReplacement: false,
      allowsCreditNote: true,
      isActive: true
    },
    {
      id: 'wrong_item',
      name: 'Wrong Item',
      description: 'Incorrect item delivered to customer',
      category: 'delivery_error',
      requiresInspection: true,
      requiresReplacement: true,
      allowsCreditNote: true,
      isActive: true
    },
    {
      id: 'over_delivery',
      name: 'Over Delivery',
      description: 'More quantity delivered than ordered',
      category: 'delivery_error',
      requiresInspection: true,
      requiresReplacement: false,
      allowsCreditNote: true,
      isActive: true
    }
  ];

  const handleCreateType = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        '/returns/reasons',
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      );
      
      if (response.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          category: '',
          requiresInspection: false,
          requiresReplacement: false,
          allowsCreditNote: false,
          isActive: true
        });
        onRefresh();
        alert('Return type created successfully!');
      } else {
        alert(response.message || 'Failed to create return type');
      }
    } catch (error) {
      console.error('Error creating return type:', error);
      alert('Error creating return type');
    } finally {
      setLoading(false);
    }
  };

  const handleViewType = (type) => {
    setViewingType(type);
    setViewFormData({
      requiresInspection: type.requiresInspection,
      requiresReplacement: type.requiresReplacement,
      allowsCreditNote: type.allowsCreditNote,
      isActive: type.isActive
    });
    setShowViewModal(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description,
      category: type.category,
      requiresInspection: type.requiresInspection,
      requiresReplacement: type.requiresReplacement,
      allowsCreditNote: type.allowsCreditNote,
      isActive: type.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateType = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        `/returns/reasons/${editingType.id}`,
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      );
      
      if (response.success) {
        setShowEditModal(false);
        setEditingType(null);
        setFormData({
          name: '',
          description: '',
          category: '',
          requiresInspection: false,
          requiresReplacement: false,
          allowsCreditNote: false,
          isActive: true
        });
        onRefresh();
      } else {
        alert(response.message || 'Failed to update return type');
      }
    } catch (error) {
      console.error('Error updating return type:', error);
      alert('Error updating return type');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (typeId, isActive) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        `/returns/reasons/${typeId}`,
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: !isActive })
        }
      );
      
      if (response.success) {
        onRefresh();
      } else {
        alert(response.message || 'Failed to update return type');
      }
    } catch (error) {
      console.error('Error updating return type:', error);
      alert('Error updating return type');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleViewSwitchChange = (field) => {
    setViewFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveViewSettings = async () => {
    setLoading(true);
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      // Prepare the complete data object for the API
      const updateData = {
        name: viewingType.name,
        description: viewingType.description,
        category: viewingType.category,
        requiresInspection: viewFormData.requiresInspection,
        requiresReplacement: viewFormData.requiresReplacement,
        allowsCreditNote: viewFormData.allowsCreditNote,
        isActive: viewFormData.isActive
      };
      
      console.log('Updating return type with data:', updateData);
      
      const response = await fetchWithDivision(
        `/returns/reasons/${viewingType.id}`,
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        }
      );
      
      console.log('API Response:', response);
      
      if (response.success) {
        setShowViewModal(false);
        setViewingType(null);
        onRefresh();
        alert('Return type settings updated successfully!');
      } else {
        alert(response.message || 'Failed to update return type settings');
      }
    } catch (error) {
      console.error('Error updating return type settings:', error);
      alert(`Error updating return type settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Show only predefined types in the table
  const allTypes = predefinedTypes;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Return Types Management</h2>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowAddModal(true)}
        >
          + Add Type
        </button>
      </div>

      {/* Removed descriptive alert per request */}

      <table className="table table-bordered borderedtable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Inspection Required</th>
            <th>Replacement Allowed</th>
            <th>Credit Note Allowed</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allTypes.map((type) => (
            <tr key={type.id}>
              <td>
                <strong>{type.name}</strong>
                {predefinedTypes.find(pt => pt.id === type.id) && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                    (Predefined)
                  </span>
                )}
              </td>
              <td>
                <span className={`${styles.typeBadge} ${styles[type.category] || styles.cancellation}`}>
                  {type.category.replace('_', ' ')}
                </span>
              </td>
              <td>
                {type.requiresInspection ? 'Yes' : 'No'}
              </td>
              <td>
                {type.requiresReplacement ? 'Yes' : 'No'}
              </td>
              <td>
                {type.allowsCreditNote ? 'Yes' : 'No'}
              </td>
              <td>
                <span className={`${styles.statusBadge} ${type.isActive ? styles.approved : styles.rejected}`}>
                  {type.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={() => handleViewType(type)}
                  >
                    View
                  </button>
                  {!predefinedTypes.find(pt => pt.id === type.id) && (
                    <>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => handleEditType(type)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.btn} ${type.isActive ? styles.btnWarning : styles.btnSuccess}`}
                        onClick={() => handleToggleActive(type.id, type.isActive)}
                      >
                        {type.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* Edit Type Modal */}
      {showEditModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Return Type</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateType}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.formTextarea}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="delivery_damage">Delivery Damage</option>
                  <option value="expiration">Expiration</option>
                  <option value="quality">Quality Issues</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="delivery_error">Delivery Error</option>
                  <option value="customer_request">Customer Request</option>
                </select>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <input
                      type="checkbox"
                      name="requiresInspection"
                      checked={formData.requiresInspection}
                      onChange={handleInputChange}
                    />
                    Requires Inspection
                  </label>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <input
                      type="checkbox"
                      name="requiresReplacement"
                      checked={formData.requiresReplacement}
                      onChange={handleInputChange}
                    />
                    Allows Replacement
                  </label>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    name="allowsCreditNote"
                    checked={formData.allowsCreditNote}
                    onChange={handleInputChange}
                  />
                  Allows Credit Note
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
              
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Type Modal */}
      {showViewModal && viewingType && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Return Type Details</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.viewContent}>
              <div className={styles.viewSection}>
                <h4 className={styles.viewSectionTitle}>Basic Information</h4>
                <div className={styles.viewTable}>
                  <table className={styles.detailsTable}>
                    <tbody>
                      <tr>
                        <td className={styles.detailLabel}>Name:</td>
                        <td className={styles.detailValue}>
                          <strong>{viewingType.name}</strong>
                          {predefinedTypes.find(pt => pt.id === viewingType.id) && (
                            <span className={styles.predefinedBadge}> (Predefined)</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className={styles.detailLabel}>Description:</td>
                        <td className={styles.detailValue}>{viewingType.description}</td>
                      </tr>
                      <tr>
                        <td className={styles.detailLabel}>Category:</td>
                        <td className={styles.detailValue}>
                          <span className={`${styles.typeBadge} ${styles[viewingType.category] || styles.cancellation}`}>
                            {viewingType.category.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.viewSection}>
                <h4 className={styles.viewSectionTitle}>Settings</h4>
                <div className={styles.switchContainer}>
                  <div className={styles.switchItem}>
                    <label className={styles.switchLabel}>
                      <span className={styles.switchText}>Inspection Required</span>
                      <div 
                        className={`${styles.switch} ${viewFormData.requiresInspection ? styles.switchOn : styles.switchOff}`}
                        onClick={() => handleViewSwitchChange('requiresInspection')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.switchThumb}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className={styles.switchItem}>
                    <label className={styles.switchLabel}>
                      <span className={styles.switchText}>Replacement Allowed</span>
                      <div 
                        className={`${styles.switch} ${viewFormData.requiresReplacement ? styles.switchOn : styles.switchOff}`}
                        onClick={() => handleViewSwitchChange('requiresReplacement')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.switchThumb}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className={styles.switchItem}>
                    <label className={styles.switchLabel}>
                      <span className={styles.switchText}>Credit Note Allowed</span>
                      <div 
                        className={`${styles.switch} ${viewFormData.allowsCreditNote ? styles.switchOn : styles.switchOff}`}
                        onClick={() => handleViewSwitchChange('allowsCreditNote')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.switchThumb}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className={styles.switchItem}>
                    <label className={styles.switchLabel}>
                      <span className={styles.switchText}>Status</span>
                      <div 
                        className={`${styles.switch} ${viewFormData.isActive ? styles.switchOn : styles.switchOff}`}
                        onClick={() => handleViewSwitchChange('isActive')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.switchThumb}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowViewModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveViewSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Return Type</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateType}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.formTextarea}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="delivery_damage">Delivery Damage</option>
                  <option value="expiration">Expiration</option>
                  <option value="quality">Quality Issues</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="delivery_error">Delivery Error</option>
                  <option value="customer_request">Customer Request</option>
                </select>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <input
                      type="checkbox"
                      name="requiresInspection"
                      checked={formData.requiresInspection}
                      onChange={handleInputChange}
                    />
                    Requires Inspection
                  </label>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <input
                      type="checkbox"
                      name="requiresReplacement"
                      checked={formData.requiresReplacement}
                      onChange={handleInputChange}
                    />
                    Allows Replacement
                  </label>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    name="allowsCreditNote"
                    checked={formData.allowsCreditNote}
                    onChange={handleInputChange}
                  />
                  Allows Credit Note
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
              
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnTypes;
