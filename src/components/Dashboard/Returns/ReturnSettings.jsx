import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import { fetchWithDivision } from '../../../utils/fetchWithDivision';
import styles from './Returns.module.css';

const ReturnSettings = () => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Approval Settings
    approvalRoles: ['Admin'],
    autoApprovalEnabled: false,
    autoApprovalAmount: 1000,
    autoApprovalTypes: [],
    
    // Notification Settings
    notifyCustomerOnApproval: true,
    notifyCustomerOnRejection: true,
    notifyWarehouseOnApproval: true,
    notifyManagerOnHighValue: true,
    highValueThreshold: 5000,
    
    // Processing Settings
    defaultInspectionRequired: false,
    defaultReplacementAllowed: true,
    defaultCreditNoteAllowed: true,
    returnPeriodDays: 30,
    processingTimeLimit: 7,
    
    // Credit Note Settings
    creditNotePrefix: 'CN',
    creditNoteValidityDays: 90,
    autoGenerateCreditNote: false,
    
    // Workflow Settings
    requireManagerApproval: false,
    requireWarehouseConfirmation: true,
    allowPartialReturns: true,
    allowMultipleReturnsPerOrder: false,
    
    // Integration Settings
    integrateWithInventory: true,
    integrateWithAccounting: true,
    autoUpdateStock: true,
    
    // Email Templates
    approvalEmailTemplate: '',
    rejectionEmailTemplate: '',
    completionEmailTemplate: ''
  });

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    loadSettings();
    loadEmployees();
  }, []);

  const loadSettings = async () => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        "/return-settings",
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all"
      );
      
      if (response.success && response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Error loading return settings:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        "/employees",
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all"
      );
      
      if (response.success) {
        setEmployees(response.data || []);
        
        // Extract unique roles
        const uniqueRoles = [...new Set((response.data || []).map(emp => emp.role).filter(Boolean))];
        setRoles(uniqueRoles);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value, checked) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked 
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value)
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await fetchWithDivision(
        "/return-settings",
        localStorage.getItem("accessToken"),
        divisionId,
        showAllDivisions || divisionId === "all",
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings)
        }
      );
      
      if (response.success) {
        alert('Settings saved successfully');
      } else {
        alert(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        approvalRoles: ['Admin'],
        autoApprovalEnabled: false,
        autoApprovalAmount: 1000,
        autoApprovalTypes: [],
        notifyCustomerOnApproval: true,
        notifyCustomerOnRejection: true,
        notifyWarehouseOnApproval: true,
        notifyManagerOnHighValue: true,
        highValueThreshold: 5000,
        defaultInspectionRequired: false,
        defaultReplacementAllowed: true,
        defaultCreditNoteAllowed: true,
        returnPeriodDays: 30,
        processingTimeLimit: 7,
        creditNotePrefix: 'CN',
        creditNoteValidityDays: 90,
        autoGenerateCreditNote: false,
        requireManagerApproval: false,
        requireWarehouseConfirmation: true,
        allowPartialReturns: true,
        allowMultipleReturnsPerOrder: false,
        integrateWithInventory: true,
        integrateWithAccounting: true,
        autoUpdateStock: true,
        approvalEmailTemplate: '',
        rejectionEmailTemplate: '',
        completionEmailTemplate: ''
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Return Settings</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleResetSettings}
          >
            Reset to Default
          </button>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Approval Settings */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Approval Settings
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label className={styles.formLabel}>Roles that can approve returns</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '8px' }}>
                {roles.map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.approvalRoles.includes(role)}
                      onChange={(e) => handleArrayChange('approvalRoles', role, e.target.checked)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="autoApprovalEnabled"
                  checked={settings.autoApprovalEnabled}
                  onChange={handleInputChange}
                />
                Enable Auto-Approval
              </label>
            </div>
            
            {settings.autoApprovalEnabled && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Auto-approval amount threshold (₹)</label>
                <input
                  type="number"
                  name="autoApprovalAmount"
                  value={settings.autoApprovalAmount}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  min="0"
                />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="requireManagerApproval"
                  checked={settings.requireManagerApproval}
                  onChange={handleInputChange}
                />
                Require Manager Approval for High-Value Returns
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Notification Settings
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="notifyCustomerOnApproval"
                  checked={settings.notifyCustomerOnApproval}
                  onChange={handleInputChange}
                />
                Notify Customer on Approval
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="notifyCustomerOnRejection"
                  checked={settings.notifyCustomerOnRejection}
                  onChange={handleInputChange}
                />
                Notify Customer on Rejection
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="notifyWarehouseOnApproval"
                  checked={settings.notifyWarehouseOnApproval}
                  onChange={handleInputChange}
                />
                Notify Warehouse on Approval
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="notifyManagerOnHighValue"
                  checked={settings.notifyManagerOnHighValue}
                  onChange={handleInputChange}
                />
                Notify Manager on High-Value Returns
              </label>
            </div>
            
            {settings.notifyManagerOnHighValue && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>High-value threshold (₹)</label>
                <input
                  type="number"
                  name="highValueThreshold"
                  value={settings.highValueThreshold}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  min="0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Processing Settings */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Processing Settings
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Return Period (days)</label>
              <input
                type="number"
                name="returnPeriodDays"
                value={settings.returnPeriodDays}
                onChange={handleInputChange}
                className={styles.formInput}
                min="1"
                max="365"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Processing Time Limit (days)</label>
              <input
                type="number"
                name="processingTimeLimit"
                value={settings.processingTimeLimit}
                onChange={handleInputChange}
                className={styles.formInput}
                min="1"
                max="30"
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="defaultInspectionRequired"
                  checked={settings.defaultInspectionRequired}
                  onChange={handleInputChange}
                />
                Default: Inspection Required
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="defaultReplacementAllowed"
                  checked={settings.defaultReplacementAllowed}
                  onChange={handleInputChange}
                />
                Default: Replacement Allowed
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="defaultCreditNoteAllowed"
                  checked={settings.defaultCreditNoteAllowed}
                  onChange={handleInputChange}
                />
                Default: Credit Note Allowed
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="requireWarehouseConfirmation"
                  checked={settings.requireWarehouseConfirmation}
                  onChange={handleInputChange}
                />
                Require Warehouse Confirmation
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="allowPartialReturns"
                  checked={settings.allowPartialReturns}
                  onChange={handleInputChange}
                />
                Allow Partial Returns
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="allowMultipleReturnsPerOrder"
                  checked={settings.allowMultipleReturnsPerOrder}
                  onChange={handleInputChange}
                />
                Allow Multiple Returns per Order
              </label>
            </div>
          </div>
        </div>

        {/* Credit Note Settings */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Credit Note Settings
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Credit Note Prefix</label>
              <input
                type="text"
                name="creditNotePrefix"
                value={settings.creditNotePrefix}
                onChange={handleInputChange}
                className={styles.formInput}
                maxLength="10"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Credit Note Validity (days)</label>
              <input
                type="number"
                name="creditNoteValidityDays"
                value={settings.creditNoteValidityDays}
                onChange={handleInputChange}
                className={styles.formInput}
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <input
                type="checkbox"
                name="autoGenerateCreditNote"
                checked={settings.autoGenerateCreditNote}
                onChange={handleInputChange}
              />
              Auto-generate Credit Notes on Approval
            </label>
          </div>
        </div>

        {/* Integration Settings */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Integration Settings
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="integrateWithInventory"
                  checked={settings.integrateWithInventory}
                  onChange={handleInputChange}
                />
                Integrate with Inventory System
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="integrateWithAccounting"
                  checked={settings.integrateWithAccounting}
                  onChange={handleInputChange}
                />
                Integrate with Accounting System
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  name="autoUpdateStock"
                  checked={settings.autoUpdateStock}
                  onChange={handleInputChange}
                />
                Auto-update Stock on Return Completion
              </label>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
            Email Templates
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Approval Email Template</label>
              <textarea
                name="approvalEmailTemplate"
                value={settings.approvalEmailTemplate}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="4"
                placeholder="Email template for return approval notifications..."
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rejection Email Template</label>
              <textarea
                name="rejectionEmailTemplate"
                value={settings.rejectionEmailTemplate}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="4"
                placeholder="Email template for return rejection notifications..."
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Completion Email Template</label>
              <textarea
                name="completionEmailTemplate"
                value={settings.completionEmailTemplate}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="4"
                placeholder="Email template for return completion notifications..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnSettings;
