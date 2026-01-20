import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaTag, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import storeService from "../../../services/storeService";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export default function StoreDiscounts() {
  const [storeId, setStoreId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [discountRules, setDiscountRules] = useState([]);
  const [summary, setSummary] = useState({
    activeRules: 0,
    totalDiscounts: 0,
    customersBenefited: 0,
    expiringSoon: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    ruleName: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchase: 0,
    applicableTo: "all",
    productIds: [],
    validFrom: "",
    validUntil: "",
    notes: "",
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showError = useCallback((message) => {
    setError(message);
    setIsErrorModalOpen(true);
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  }, []);

  useEffect(() => {
    if (storeId) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      let id = user?.storeId || user?.store?.id;
      
      if (!id) {
        const selectedStore = localStorage.getItem("selectedStore");
        if (selectedStore) {
          const store = JSON.parse(selectedStore);
          id = store.id;
        }
      }
      
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }
      
      if (id) {
        setStoreId(id);
      } else {
        showError("Store information missing. Please re-login to continue.");
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      showError("Unable to determine store information. Please re-login.");
    }
  }, [showError, storeId]);

  const fetchDiscountRules = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) params.status = statusFilter;
      
      const res = await storeService.getStoreDiscountRules(storeId, params);
      if (res.success) {
        setDiscountRules(res.data || []);
        setPagination(prev => ({
          ...prev,
          total: res.pagination?.total || 0,
          totalPages: res.pagination?.totalPages || 1,
        }));
      } else {
        showError(res.message || "Failed to fetch discount rules");
      }
    } catch (err) {
      console.error("Failed to fetch discount rules", err);
      showError(err.response?.data?.message || err.message || "Failed to fetch discount rules");
    } finally {
      setLoading(false);
    }
  }, [storeId, pagination.page, pagination.limit, statusFilter, showError]);

  const fetchSummary = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await storeService.getStoreDiscountSummary(storeId);
      if (res.success) {
        setSummary({
          activeRules: res.data?.activeRules || 0,
          totalDiscounts: res.data?.totalDiscounts || 0,
          customersBenefited: res.data?.customersBenefited || 0,
          expiringSoon: res.data?.expiringSoon || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch discount summary", err);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchDiscountRules();
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, pagination.page, pagination.limit, statusFilter]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!storeId) {
      showError("Store information missing.");
      return;
    }

    if (!formData.ruleName || !formData.discountValue || !formData.validFrom || !formData.validUntil) {
      showError("Please fill in all required fields.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        ruleName: formData.ruleName,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase || 0),
        applicableTo: formData.applicableTo,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        notes: formData.notes || "",
      };
      
      if (formData.applicableTo === "selected" && formData.productIds.length > 0) {
        payload.productIds = formData.productIds;
      }

      const res = editingRule
        ? await storeService.updateStoreDiscountRule(storeId, editingRule.id, payload)
        : await storeService.createStoreDiscountRule(storeId, payload);
      
      if (res.success) {
        showSuccess(res.message || (editingRule ? "Discount rule updated successfully." : "Discount rule created successfully."));
        setShowForm(false);
        setEditingRule(null);
        setFormData({
          ruleName: "",
          discountType: "percentage",
          discountValue: 0,
          minPurchase: 0,
          applicableTo: "all",
          productIds: [],
          validFrom: "",
          validUntil: "",
          notes: "",
        });
        fetchDiscountRules();
        fetchSummary();
      } else {
        showError(res.message || "Failed to save discount rule");
      }
    } catch (err) {
      console.error("Failed to save discount rule", err);
      showError(err.response?.data?.message || err.message || "Failed to save discount rule");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRule = async (rule) => {
    try {
      const res = await storeService.getStoreDiscountRuleById(storeId, rule.id);
      if (res.success) {
        const ruleData = res.data;
        setFormData({
          ruleName: ruleData.ruleName || "",
          discountType: ruleData.discountType || "percentage",
          discountValue: ruleData.discountValue || 0,
          minPurchase: ruleData.minPurchase || 0,
          applicableTo: ruleData.applicableTo || "all",
          productIds: ruleData.productIds || [],
          validFrom: ruleData.validFrom ? ruleData.validFrom.split("T")[0] : "",
          validUntil: ruleData.validUntil ? ruleData.validUntil.split("T")[0] : "",
          notes: ruleData.notes || "",
        });
        setEditingRule(rule);
        setShowForm(true);
      } else {
        showError(res.message || "Failed to load discount rule");
      }
    } catch (err) {
      console.error("Failed to load discount rule", err);
      showError(err.response?.data?.message || err.message || "Failed to load discount rule");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this discount rule?")) return;
    
    setActionLoading(true);
    try {
      const res = await storeService.deleteStoreDiscountRule(storeId, ruleId);
      if (res.success) {
        showSuccess(res.message || "Discount rule deleted successfully.");
        fetchDiscountRules();
        fetchSummary();
      } else {
        showError(res.message || "Failed to delete discount rule");
      }
    } catch (err) {
      console.error("Failed to delete discount rule", err);
      showError(err.response?.data?.message || err.message || "Failed to delete discount rule");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "active": { class: "bg-success", icon: <FaCheckCircle /> },
      "expiring": { class: "bg-warning", icon: <FaTimesCircle /> },
      "inactive": { class: "bg-secondary", icon: <FaTimesCircle /> }
    };
    return statusMap[status] || { class: "bg-secondary", icon: <FaTimesCircle /> };
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
        }}>Discount Management</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#666',
          margin: 0
        }}>Create and manage discount rules for your store</p>
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
              gap: '10px'
            })
          }}
        >
          <button 
            className="homebtn"
            onClick={() => setShowForm(!showForm)}
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
            {showForm ? 'Cancel' : 'Create Discount Rule'}
          </button>
        </div>
      </div>

      {!storeId && (
        <div className={styles.orderStatusCard} style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontFamily: "Poppins" }}>Store information missing. Please re-login to continue.</p>
        </div>
      )}

      {storeId && (
        <>
          {/* Statistics Cards */}
          <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: '24px' }}>
            <ReusableCard title="Active Rules" value={summary.activeRules.toString()} color="green.500" />
            <ReusableCard title="Total Discounts" value={`₹${summary.totalDiscounts.toLocaleString()}`} color="blue.500" />
            <ReusableCard title="Customers Benefited" value={summary.customersBenefited.toString()} color="purple.500" />
            <ReusableCard title="Expiring Soon" value={summary.expiringSoon.toString()} color="yellow.500" />
          </Flex>

      {/* Create Rule Form */}
      {showForm && (
        <div className={styles.orderStatusCard} style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: 0, marginBottom: '20px', fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            {editingRule ? 'Edit Discount Rule' : 'Create Discount Rule'}
          </h4>
          <form onSubmit={handleCreateRule}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #000',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  color: '#000'
                }}
                placeholder="e.g., Seasonal Discount"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Discount Value *
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                  placeholder={formData.discountType === "percentage" ? "5" : "100"}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Minimum Purchase (₹)
                </label>
                <input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Applicable To
                </label>
                <select
                  value={formData.applicableTo}
                  onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                >
                  <option value="all">All Products</option>
                  <option value="selected">Selected Products</option>
                </select>
              </div>
            </div>
            {formData.applicableTo === "selected" && (
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Product IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.productIds.join(", ")}
                  onChange={(e) => {
                    const ids = e.target.value.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    setFormData({ ...formData, productIds: ids });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                  placeholder="e.g., 1, 2, 3"
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Valid From *
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                  Valid Until *
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #000',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  minHeight: '80px',
                  backgroundColor: '#fff',
                  color: '#000'
                }}
                placeholder="Optional notes"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="homebtn"
                type="submit"
                disabled={actionLoading}
                style={{ 
                  fontFamily: 'Poppins',
                  padding: '12px 24px',
                  borderRadius: '8px'
                }}
              >
                {actionLoading ? 'Saving...' : (editingRule ? 'Update Discount Rule' : 'Create Discount Rule')}
              </button>
              <button
                className="homebtn"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                  setFormData({
                    ruleName: "",
                    discountType: "percentage",
                    discountValue: 0,
                    minPurchase: 0,
                    applicableTo: "all",
                    productIds: [],
                    validFrom: "",
                    validUntil: "",
                    notes: "",
                  });
                }}
                style={{ 
                  fontFamily: 'Poppins',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          </form>
        </div>
      )}
        </>
      )}

      {storeId && (
        <>
          {/* Discount Rules Table */}
          <div className={styles.orderStatusCard} style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
                Discount Rules
              </h4>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #000',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#000'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
              </div>
            </div>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '24px', fontFamily: 'Poppins' }}>Loading discount rules...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-bordered borderedtable table-sm" style={{ fontFamily: 'Poppins' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Rule ID</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Name</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Discount</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Min Purchase</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Applicable To</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Valid Period</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                      <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountRules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center" style={{ padding: '20px', fontFamily: 'Poppins' }}>
                          No discount rules found.
                        </td>
                      </tr>
                    ) : (
                      discountRules.map((rule, i) => {
                        const statusInfo = getStatusBadge(rule.status || "active");
                        const validFrom = rule.validFrom ? new Date(rule.validFrom).toLocaleDateString() : "-";
                        const validUntil = rule.validUntil ? new Date(rule.validUntil).toLocaleDateString() : "-";
                        return (
                          <tr key={rule.id || i} style={{ background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{rule.ruleCode || rule.id || "-"}</td>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>{rule.ruleName || "-"}</td>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                              {rule.discountType === "percentage" ? `${Number(rule.discountValue || 0).toFixed(2)}%` : `₹${Number(rule.discountValue || 0).toFixed(2)}`}
                            </td>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>₹{Number(rule.minPurchase || 0).toFixed(2)}</td>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                              {rule.applicableTo === "all" ? "All Products" : rule.applicableTo === "selected" ? "Selected Products" : rule.applicableTo}
                            </td>
                            <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                              {validFrom} - {validUntil}
                            </td>
                            <td>
                              <span className={`badge ${statusInfo.class}`} style={{ fontFamily: 'Poppins', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {statusInfo.icon}
                                {(rule.status || "active").charAt(0).toUpperCase() + (rule.status || "active").slice(1)}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                                  onClick={() => handleEditRule(rule)}
                                  disabled={actionLoading}
                                >
                                  <FaEdit style={{ fontSize: '12px' }} />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  style={{ fontFamily: 'Poppins', fontSize: '11px', padding: '4px 8px' }}
                                  onClick={() => handleDeleteRule(rule.id)}
                                  disabled={actionLoading}
                                >
                                  <FaTrash style={{ fontSize: '12px' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ margin: 0, fontFamily: 'Poppins', color: '#6b7280' }}>
                  Showing page {pagination.page} of {pagination.totalPages}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="homebtn"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1 || loading}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Previous
                  </button>
                  <button
                    className="homebtn"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Modal */}
      <Modal show={isErrorModalOpen} onHide={() => setIsErrorModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>{error}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsErrorModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={isSuccessModalOpen} onHide={() => setIsSuccessModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Success</Modal.Title>
        </Modal.Header>
        <Modal.Body>{successMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setIsSuccessModalOpen(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
