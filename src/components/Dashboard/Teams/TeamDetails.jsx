import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import teamsService from "@/services/teamsService";
import apiService from "@/services/apiService";
import { useAuth } from "@/Auth";

function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local editable states
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [products, setProducts] = useState([]); // [{ productId, isEnabled, sellingPrice }]
  const [saving, setSaving] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isBillToBillOpen, setIsBillToBillOpen] = useState(false);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  
  // Team status state for manual save
  const [teamStatus, setTeamStatus] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  
  // Team-specific discount states
  const [teamBillToBillDiscounts, setTeamBillToBillDiscounts] = useState([]);
  const [teamMonthlyDiscounts, setTeamMonthlyDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      setWarehousesLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      
      let endpoint = "/warehouses";
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === '1') {
        endpoint += `?showAllDivisions=true`;
      }
      
      const response = await apiService.get(endpoint);
      const data = await response.json();
      setWarehouses(data.warehouses || []);
    } catch (e) {
      console.error("Failed to fetch warehouses:", e);
      setError("Failed to load warehouses");
      setIsModalOpen(true);
    } finally {
      setWarehousesLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Try to get team using teamsService first
        let data;
        try {
          data = await teamsService.getTeam(teamId);
        } catch (serviceError) {
          // If teamsService fails, try using axiosAPI directly
          console.log("teamsService failed, trying axiosAPI directly:", serviceError);
          try {
            const res = await axiosAPI.get(`/teams/${teamId}`);
            data = res.data;
          } catch (axiosError) {
            // If that also fails, try query parameter approach
            try {
              const res = await axiosAPI.get(`/teams?teamId=${teamId}`);
              const teamsList = res.data?.teams || res.data?.data?.teams || res.data?.data || res.data || [];
              if (Array.isArray(teamsList) && teamsList.length > 0) {
                const foundTeam = teamsList.find(t => 
                  t.id === parseInt(teamId) || 
                  t.teamId === parseInt(teamId) ||
                  String(t.id) === String(teamId) ||
                  String(t.teamId) === String(teamId)
                );
                if (foundTeam) {
                  data = { team: foundTeam, data: { team: foundTeam } };
                } else {
                  throw new Error(`Team with ID ${teamId} not found in teams list`);
                }
              } else {
                throw axiosError;
              }
            } catch (queryError) {
              // If all attempts fail, throw the original error
              throw serviceError;
            }
          }
        }
        
        const teamData = data?.data?.team || data?.team || data?.data || data;
        setTeam(teamData);

        // Initialize editable states
        setWarehouseId(teamData?.warehouse?.id || "");
        setTeamStatus(!!teamData?.isActive);

        // Build product list from divisionProducts + teamProductPricing
        const pricingByProductId = {};
        (teamData?.teamProductPricing || []).forEach((p) => {
          pricingByProductId[p.productId] = {
            isEnabled: p.isEnabled !== false,
            sellingPrice: p.sellingPrice ?? null,
          };
        });

        const mergedProducts = (teamData?.divisionProducts || []).map((prod) => {
          const pricing = pricingByProductId[prod.id] || {};
          return {
            productId: prod.id,
            name: prod.name,
            isEnabled: pricing.isEnabled !== false,
            sellingPrice:
              pricing.sellingPrice != null
                ? Number(pricing.sellingPrice)
                : prod.basePrice != null
                ? Number(prod.basePrice)
                : null,
          };
        });
        setProducts(mergedProducts);
      } catch (e) {
        console.error(e);
        const errorMessage = e?.message || "Failed to load team details";
        setError(errorMessage.includes("HTML") || errorMessage.includes("not found") 
          ? `Team not found. The team with ID ${teamId} may not exist or the endpoint is not available.`
          : errorMessage);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchWarehouses();
  }, [teamId]);

  // Fetch team discounts when team is loaded
  useEffect(() => {
    if (team?.id) {
      fetchTeamDiscounts();
    }
  }, [team?.id]);

  const enabledCount = useMemo(() => products.filter((p) => p.isEnabled).length, [products]);

  // Helper function to get warehouse name by ID
  const getWarehouseName = (id) => {
    const warehouse = warehouses.find(w => w.id === Number(id));
    return warehouse ? warehouse.name : `Warehouse ID: ${id}`;
  };

  // Fetch team-specific discounts
  const fetchTeamDiscounts = async () => {
    if (!team?.id) return;
    try {
      setDiscountsLoading(true);
      // Fetch team-specific bill-to-bill discounts
      const billToBillRes = await axiosAPI.get(`/teams/${team.id}/discounts/bill-to-bill`);
      const billToBillData = billToBillRes?.data || {};
      setTeamBillToBillDiscounts(billToBillData.discounts || billToBillData.data || billToBillData || []);

      // Fetch team-specific monthly discounts
      const monthlyRes = await axiosAPI.get(`/teams/${team.id}/discounts/monthly`);
      const monthlyData = monthlyRes?.data || {};
      setTeamMonthlyDiscounts(monthlyData.discounts || monthlyData.data || monthlyData || []);
    } catch (e) {
      console.error("Failed to fetch team discounts:", e);
      // Initialize with empty arrays if API fails
      setTeamBillToBillDiscounts([]);
      setTeamMonthlyDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  };

  // Add bill-to-bill discount
  const addBillToBillDiscount = async (productType, minQuantity, discountPerUnit) => {
    try {
      await axiosAPI.post(`/teams/${team.id}/discounts/bill-to-bill`, {
        productType,
        minQuantity,
        discountPerUnit,
      });
      await fetchTeamDiscounts(); // Refresh the list
    } catch (e) {
      console.error("Failed to add bill-to-bill discount:", e);
      throw e;
    }
  };

  // Add monthly discount
  const addMonthlyDiscount = async (productType, minTurnover, discountPerUnit) => {
    try {
      await axiosAPI.post(`/teams/${team.id}/discounts/monthly`, {
        productType,
        minTurnover,
        discountPerUnit,
      });
      await fetchTeamDiscounts(); // Refresh the list
    } catch (e) {
      console.error("Failed to add monthly discount:", e);
      throw e;
    }
  };

  // Delete bill-to-bill discount
  const deleteBillToBillDiscount = async (discountId) => {
    try {
      await axiosAPI.delete(`/teams/${team.id}/discounts/bill-to-bill/${discountId}`);
      await fetchTeamDiscounts(); // Refresh the list
    } catch (e) {
      console.error("Failed to delete bill-to-bill discount:", e);
      throw e;
    }
  };

  // Delete monthly discount
  const deleteMonthlyDiscount = async (discountId) => {
    try {
      await axiosAPI.delete(`/teams/${team.id}/discounts/monthly/${discountId}`);
      await fetchTeamDiscounts(); // Refresh the list
    } catch (e) {
      console.error("Failed to delete monthly discount:", e);
      throw e;
    }
  };

  const handleAssignWarehouse = async () => {
    if (!warehouseId) return;
    try {
      setSaving(true);
      await teamsService.assignWarehouse(team.id, Number(warehouseId));
      const selectedWarehouse = warehouses.find(w => w.id === Number(warehouseId));
      setTeam((prev) => ({
        ...prev,
        warehouse: { 
          id: Number(warehouseId),
          name: selectedWarehouse?.name || `Warehouse ID: ${warehouseId}`
        },
      }));
    } catch (e) {
      console.error(e);
      setError("Failed to assign warehouse");
      setIsModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProducts = async () => {
    try {
      setSaving(true);
      const payload = products.map((p) => ({
        productId: p.productId,
        isEnabled: !!p.isEnabled,
        sellingPrice: p.isEnabled ? Number(p.sellingPrice ?? 0) : null,
      }));
      await teamsService.manageProducts(team.id, payload);
    } catch (e) {
      console.error(e);
      setError("Failed to update products");
      setIsModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeamStatus = async () => {
    try {
      setStatusSaving(true);
      await teamsService.updateStatus(team.id, teamStatus);
      setTeam((prev) => ({ ...prev, isActive: teamStatus }));
      
      // Set a flag in localStorage to indicate data has been updated
      localStorage.setItem('teamsDataUpdated', Date.now().toString());
    } catch (e) {
      console.error(e);
      setError("Failed to update team status");
      setIsModalOpen(true);
    } finally {
      setStatusSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="p-4">
        <Loading />
        <p className="text-center mt-3">Loading team...</p>
      </div>
    );
  }

  if (!team) return null;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/teams")}>Teams</span>{" "}
        <i className="bi bi-chevron-right"></i> {team?.name || team?.teamName || team?.teamId}
      </p>

      {/* Team header */}
      <div className="container mt-3">
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Team Info</strong>
                <button 
                  className="btn btn-sm" 
                  style={{ backgroundColor: '#003176', borderColor: '#003176', color: '#fff' }} 
                  disabled={statusSaving || teamStatus === team.isActive} 
                  onClick={handleSaveTeamStatus}
                >
                  {statusSaving ? 'Saving...' : 'Save Status'}
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-2"><strong>ID:</strong> {team.teamId || team.id}</div>
                  <div className="col-md-4 mb-2"><strong>Name:</strong> {team.name || team.teamName}</div>
                  <div className="col-md-4 mb-2 d-flex align-items-center gap-2">
                    <strong>Status:</strong>
                    <div className="form-check form-switch ms-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!teamStatus}
                        onChange={() => setTeamStatus(!teamStatus)}
                      />
                    </div>
                    <span className={teamStatus ? 'text-success' : 'text-danger'}>
                      {teamStatus ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="col-md-6 mb-2"><strong>Team Head:</strong> {team.teamHead?.name || '-'}</div>
                  <div className="col-md-6 mb-2 d-flex align-items-center gap-2">
                    <div><strong>Members:</strong> {team.teamMembers?.length || 0}</div>
                    {Array.isArray(team.teamMembers) && team.teamMembers.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setIsMembersOpen(true)}
                      >
                        View members
                      </button>
                    )}
                  </div>
                  <div className="col-md-12 mb-2"><strong>Assigned Warehouse:</strong> {team.warehouse?.id ? getWarehouseName(team.warehouse.id) : 'Not assigned'}</div>
                </div>
              </div>
            </div>

            {/* Products & Pricing */}
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Products & Pricing</strong>
                <button className="btn btn-sm" style={{ backgroundColor: '#003176', borderColor: '#003176', color: '#fff' }} disabled={saving} onClick={handleSaveProducts}>
                  {saving ? 'Saving...' : 'Save Products'}
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered borderedtable">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-center">Enabled</th>
                        <th className="text-center">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.productId}>
                          <td>{p.name}</td>
                          <td style={{ width: 120 }}>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!p.isEnabled}
                                onChange={() =>
                                  setProducts((prev) => prev.map((it) => it.productId === p.productId ? { ...it, isEnabled: !it.isEnabled } : it))
                                }
                              />
                            </div>
                          </td>
                          <td style={{ width: 180 }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={p.sellingPrice ?? ''}
                              min="0"
                              step="0.01"
                              disabled={!p.isEnabled}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProducts((prev) => prev.map((it) => it.productId === p.productId ? { ...it, sellingPrice: val } : it));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-muted">Enabled: {enabledCount} / {products.length}</div>
              </div>
            </div>
          </div>

          {/* Warehouse + Discounting */}
          <div className="col-md-4">
            <div className="card mb-3">
              <div className="card-header">
                <strong>Assign Warehouse</strong>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <label className="form-label">Warehouse Name</label>
                  <select
                    className="form-control"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    disabled={warehousesLoading}
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {warehousesLoading && (
                    <small className="text-muted">Loading warehouses...</small>
                  )}
                </div>
                <button className="btn w-100" style={{ backgroundColor: '#003176', borderColor: '#003176', color: '#fff' }} disabled={saving || !warehouseId || warehousesLoading} onClick={handleAssignWarehouse}>
                  {saving ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header">
                <strong>Team Discounts</strong>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-2">
                  <button className="btn" style={{ backgroundColor: '#003176', borderColor: '#003176', color: '#fff' }} onClick={() => setIsBillToBillOpen(true)}>
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Bill-to-Bill Discount
                  </button>
                  <button className="btn" style={{ backgroundColor: '#003176', borderColor: '#003176', color: '#fff' }} onClick={() => setIsMonthlyOpen(true)}>
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Monthly Discount
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={() => setIsModalOpen(false)} />
      )}

      {isMembersOpen && (
        <div
          className="modal fade show"
          style={{ display: 'block', position: 'fixed', inset: 0 }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setIsMembersOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsMembersOpen(false); }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Team Members</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsMembersOpen(false)}></button>
              </div>
              <div className="modal-body">
                {Array.isArray(team.teamMembers) && team.teamMembers.length > 0 ? (
                  <ul className="list-group">
                    {team.teamMembers.map((member, idx) => {
                      const name = member?.name || member?.employee?.name || member?.user?.name || member?.fullName || member?.mobile || member?.id || '-';
                      return (
                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-muted">No members found.</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMembersOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBillToBillOpen && (
        <TeamBillToBillModal 
          isOpen={isBillToBillOpen}
          onClose={() => setIsBillToBillOpen(false)}
          teamId={team?.id}
          discounts={teamBillToBillDiscounts}
          loading={discountsLoading}
          onAdd={addBillToBillDiscount}
          onDelete={deleteBillToBillDiscount}
          enabledProducts={products.filter(p => p.isEnabled)}
        />
      )}

      {isMonthlyOpen && (
        <TeamMonthlyDiscountModal 
          isOpen={isMonthlyOpen}
          onClose={() => setIsMonthlyOpen(false)}
          teamId={team?.id}
          discounts={teamMonthlyDiscounts}
          loading={discountsLoading}
          onAdd={addMonthlyDiscount}
          onDelete={deleteMonthlyDiscount}
          enabledProducts={products.filter(p => p.isEnabled)}
        />
      )}
    </>
  );
}

// Team Bill-to-Bill Discount Modal Component
function TeamBillToBillModal({ isOpen, onClose, teamId, discounts, loading, onAdd, onDelete, enabledProducts }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ productType: '', minQuantity: '', discountPerUnit: '' });
  const [saving, setSaving] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleAdd = async () => {
    if (!formData.productType || !formData.minQuantity || !formData.discountPerUnit) {
      alert('Please fill all fields');
      return;
    }
    try {
      setSaving(true);
      await onAdd(formData.productType, formData.minQuantity, formData.discountPerUnit);
      setFormData({ productType: '', minQuantity: '', discountPerUnit: '' });
      setShowAddForm(false);
    } catch (e) {
      alert('Failed to add discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await onDelete(discountId);
      } catch (e) {
        alert('Failed to delete discount');
      }
    }
  };

  const handleView = (discount) => {
    setSelectedDiscount(discount);
    setShowViewModal(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ 
        display: 'block', 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      tabIndex="-1"
      role="dialog"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ 
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
        }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            borderRadius: '0.5rem 0.5rem 0 0'
          }}>
            <h5 className="modal-title" style={{ margin: 0, fontWeight: '600' }}>Team Bill-to-Bill Discounts</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={{ margin: 0, fontWeight: '500', color: '#495057' }}>Bill-to-Bill Discounts</h6>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddForm(true)}>
                + Add Bill-to-Bill
              </button>
            </div>

            {showAddForm && (
              <div className="card mb-3">
                <div className="card-body">
                  <h6>Add New Bill-to-Bill Discount</h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Product Type"
                        value={formData.productType}
                        onChange={(e) => setFormData({...formData, productType: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Min. Quantity"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Discount per unit"
                        value={formData.discountPerUnit}
                        onChange={(e) => setFormData({...formData, discountPerUnit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button className="btn btn-sm btn-success me-2" onClick={handleAdd} disabled={saving}>
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center"><Loading /></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product Type</th>
                      <th>Min. Quantity</th>
                      <th>Discount per unit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">No discounts found</td></tr>
                    ) : (
                      discounts.map((discount, index) => (
                        <tr key={discount.id} className="animated-row" style={{ animationDelay: `${index * 0.1}s` }}>
                          <td>{index + 1}</td>
                          <td>{discount.productType}</td>
                          <td>{discount.minQuantity}</td>
                          <td>{discount.discountPerUnit}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleView(discount)}
                            >
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(discount.id)}
                              title={`Delete ${discount.productType} discount`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ 
            borderTop: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 0.5rem 0.5rem',
            padding: '1rem 1.5rem'
          }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
      
      {/* View Modal */}
      {showViewModal && selectedDiscount && (
        <div
          className="modal fade show"
          style={{ 
            display: 'block', 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setShowViewModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowViewModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bill-to-Bill discount</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input type="text" className="form-control" value={new Date().toLocaleDateString('en-GB')} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Product Type</label>
                    <select className="form-control" value={selectedDiscount.productType} disabled>
                      <option value={selectedDiscount.productType}>{selectedDiscount.productType}</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Min. Quantity</label>
                    <input type="text" className="form-control" value={selectedDiscount.minQuantity} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Discount Per Unit</label>
                    <input type="text" className="form-control" value={selectedDiscount.discountPerUnit} readOnly />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-success">Edit</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Team Monthly Discount Modal Component
function TeamMonthlyDiscountModal({ isOpen, onClose, teamId, discounts, loading, onAdd, onDelete, enabledProducts }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ productType: '', minTurnover: '', discountPerUnit: '' });
  const [saving, setSaving] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleAdd = async () => {
    if (!formData.productType || !formData.minTurnover || !formData.discountPerUnit) {
      alert('Please fill all fields');
      return;
    }
    try {
      setSaving(true);
      await onAdd(formData.productType, formData.minTurnover, formData.discountPerUnit);
      setFormData({ productType: '', minTurnover: '', discountPerUnit: '' });
      setShowAddForm(false);
    } catch (e) {
      alert('Failed to add discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await onDelete(discountId);
      } catch (e) {
        alert('Failed to delete discount');
      }
    }
  };

  const handleView = (discount) => {
    setSelectedDiscount(discount);
    setShowViewModal(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ 
        display: 'block', 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      tabIndex="-1"
      role="dialog"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ 
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
        }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            borderRadius: '0.5rem 0.5rem 0 0'
          }}>
            <h5 className="modal-title" style={{ margin: 0, fontWeight: '600' }}>Team Monthly Discounts</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={{ margin: 0, fontWeight: '500', color: '#495057' }}>Monthly Discounts</h6>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddForm(true)}>
                + New Discount
              </button>
            </div>

            {showAddForm && (
              <div className="card mb-3">
                <div className="card-body">
                  <h6>Add New Monthly Discount</h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Product Type"
                        value={formData.productType}
                        onChange={(e) => setFormData({...formData, productType: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Min. Quantity"
                        value={formData.minTurnover}
                        onChange={(e) => setFormData({...formData, minTurnover: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Discount per unit"
                        value={formData.discountPerUnit}
                        onChange={(e) => setFormData({...formData, discountPerUnit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button className="btn btn-sm btn-success me-2" onClick={handleAdd} disabled={saving}>
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center"><Loading /></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product Type</th>
                      <th>Min. Quantity</th>
                      <th>Discount per unit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">No discounts found</td></tr>
                    ) : (
                      discounts.map((discount, index) => (
                        <tr key={discount.id} className="animated-row" style={{ animationDelay: `${index * 0.1}s` }}>
                          <td>{index + 1}</td>
                          <td>{discount.productType}</td>
                          <td>{discount.minTurnover}</td>
                          <td>{discount.discountPerUnit}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleView(discount)}
                            >
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(discount.id)}
                              title={`Delete ${discount.productType} discount`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ 
            borderTop: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 0.5rem 0.5rem',
            padding: '1rem 1.5rem'
          }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
      
      {/* View Modal */}
      {showViewModal && selectedDiscount && (
        <div
          className="modal fade show"
          style={{ 
            display: 'block', 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setShowViewModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowViewModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Monthly discount</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input type="text" className="form-control" value={new Date().toLocaleDateString('en-GB')} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Product Type</label>
                    <select className="form-control" value={selectedDiscount.productType} disabled>
                      <option value={selectedDiscount.productType}>{selectedDiscount.productType}</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Min. Quantity</label>
                    <input type="text" className="form-control" value={selectedDiscount.minTurnover} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Discount Per Unit</label>
                    <input type="text" className="form-control" value={selectedDiscount.discountPerUnit} readOnly />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-success">Edit</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDetails;



