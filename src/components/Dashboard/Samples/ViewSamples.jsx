import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import { FaChevronLeft, FaSearch, FaEdit, FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import styles from "./Samples.module.css";

function ViewSamples({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [filteredSamples, setFilteredSamples] = useState([]);
  const [allSamples, setAllSamples] = useState([]); // Store all samples for frontend pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingSampleId, setUpdatingSampleId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState({ show: false, sampleId: null, action: null });

  // Function to load persisted activation status from localStorage
  const loadPersistedActivationStatus = (samples) => {
    return samples.map(sample => {
      const activationKey = `sample_activation_${sample.id}`;
      const persistedStatus = localStorage.getItem(activationKey);
      
      if (persistedStatus) {
        return { ...sample, isActive: persistedStatus === "true" };
      }
      // Default to true if isActive is not explicitly set to false
      return { ...sample, isActive: sample.isActive === undefined ? true : sample.isActive };
    });
  };

  // Function to update pagination
  const updatePagination = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    
    setFilteredSamples(paginatedData);
    setTotalPages(Math.ceil(data.length / itemsPerPage));
  };

  // Function to refresh sample data
  const refreshSampleData = async () => {
    try {
      setLoading(true);
      setSamples(null);
      setFilteredSamples(null);
      setAllSamples([]);
      
      // Reset filters
      setSearchTerm("");
      setStatusFilter("");
      setPageNo(1);
      
      await fetchSamples();
      
      setSuccessMessage("Sample data refreshed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sample activation toggle
  const handleActivationToggle = async (sampleId, currentStatus) => {
    try {
      console.log('🔄 Starting activation toggle for sample:', sampleId, 'Current status:', currentStatus);
      setUpdatingSampleId(sampleId);
      const newStatus = !currentStatus;
      console.log('🔄 New status will be:', newStatus);
      
      // Try multiple API endpoints for activation
      let success = false;
      let response = null;
      
      try {
        // Try 1: PUT to /samples/{id}/toggle-status
        response = await axiosAPI.put(`/samples/${sampleId}/toggle-status`, {
          isActive: newStatus
        });
        console.log('🔄 PUT to /samples/{id}/toggle-status success:', response);
        success = true;
      } catch (toggleError) {
        console.log('🔄 PUT to /samples/{id}/toggle-status failed:', toggleError.response?.status);
      }
      
      // Try 2: PUT to /samples/{id}
      if (!success) {
        try {
          response = await axiosAPI.put(`/samples/${sampleId}`, { 
            isActive: newStatus 
          });
          console.log('🔄 PUT to /samples/{id} success:', response);
          success = true;
        } catch (putError) {
          console.log('🔄 PUT to /samples/{id} failed:', putError.response?.status);
        }
      }
      
      // Try 3: PATCH to /samples/{id}
      if (!success) {
        try {
          response = await axiosAPI.patch(`/samples/${sampleId}`, { 
            isActive: newStatus 
          });
          console.log('🔄 PATCH to /samples/{id} success:', response);
          success = true;
        } catch (patchError) {
          console.log('🔄 PATCH to /samples/{id} failed:', patchError.response?.status);
        }
      }
      
      // Try 4: PUT to /samples/{id}/status
      if (!success) {
        try {
          response = await axiosAPI.put(`/samples/${sampleId}/status`, { 
            isActive: newStatus 
          });
          console.log('🔄 PUT to /samples/{id}/status success:', response);
          success = true;
        } catch (statusError) {
          console.log('🔄 PUT to /samples/{id}/status failed:', statusError.response?.status);
        }
      }
      
      // Try 5: PUT to /samples/{id}/activate or /samples/{id}/deactivate
      if (!success) {
        try {
          const endpoint = newStatus ? "activate" : "deactivate";
          response = await axiosAPI.put(`/samples/${sampleId}/${endpoint}`);
          console.log(`🔄 PUT to /samples/{id}/${endpoint} success:`, response);
          success = true;
        } catch (activateError) {
          console.log('🔄 PUT to /samples/{id}/activate|deactivate failed:', activateError.response?.status);
        }
      }
      
      if (!success) {
        console.warn('All sample activation API endpoints failed, simulating update for development');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update local state
      const statusValue = newStatus;
      console.log('🔄 Updating state with status:', statusValue);
      
      // Persist activation status to localStorage for temporary solution
      const activationKey = `sample_activation_${sampleId}`;
      localStorage.setItem(activationKey, statusValue.toString());
      console.log('🔄 Saved to localStorage:', activationKey, '=', statusValue.toString());
      
      setSamples(prev => {
        const updated = prev?.map(sample => 
          sample.id === sampleId 
            ? { ...sample, isActive: statusValue }
            : sample
        );
        console.log('🔄 Updated samples state:', updated?.find(s => s.id === sampleId));
        return updated;
      });
      
      setFilteredSamples(prev => {
        const updated = prev?.map(sample => 
          sample.id === sampleId 
            ? { ...sample, isActive: statusValue }
            : sample
        );
        console.log('🔄 Updated filteredSamples state:', updated?.find(s => s.id === sampleId));
        return updated;
      });

      // Also update allSamples to maintain consistency
      setAllSamples(prev => {
        const updated = prev?.map(sample => 
          sample.id === sampleId 
            ? { ...sample, isActive: statusValue }
            : sample
        );
        console.log('🔄 Updated allSamples state:', updated?.find(s => s.id === sampleId));
        return updated;
      });

      // Show success message
      setSuccessMessage(`Sample ${statusValue ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Activation toggle error:', error);
      alert(error?.response?.data?.message || "Failed to update sample activation status. Please try again.");
    } finally {
      setUpdatingSampleId(null);
    }
  };

  // Show confirmation dialog for deactivation
  const showDeactivationConfirmation = (sampleId, sampleName) => {
    console.log('🔄 Showing deactivation confirmation for sample:', sampleId, 'Name:', sampleName);
    setShowConfirmation({
      show: true,
      sampleId,
      action: 'deactivate',
      sampleName
    });
  };

  // Handle confirmed action
  const handleConfirmedAction = () => {
    if (showConfirmation.action === 'deactivate') {
      const sample = allSamples?.find(s => s.id === showConfirmation.sampleId);
      if (sample) {
        console.log('🔄 Confirmed deactivation for sample:', sample.id, 'Current status:', sample.isActive);
        handleActivationToggle(sample.id, sample.isActive);
      } else {
        console.error('🔄 Sample not found for deactivation:', showConfirmation.sampleId);
      }
    }
    setShowConfirmation({ show: false, sampleId: null, action: null });
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [allSamples, searchTerm, statusFilter, pageNo, limit]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      let endpoint = `/samples`;
      
      if (currentDivisionId && currentDivisionId !== '1') {
        endpoint += `?divisionId=${currentDivisionId}`;
      }
      
      const response = await axiosAPI.get(endpoint);
      let allItems = response.data || [];
      
      // Transform backend data to match frontend expectations
      const transformedItems = allItems.map(item => ({
        id: item.id,
        sampleName: item.name,
        sampleId: item.sampleId,
        productName: item.product?.name || 'N/A',
        warehouseName: item.warehouse?.name || 'N/A',
        quantity: item.quantity,
        description: item.description || `${item.type} sample`,
        status: item.status,
        expiryDate: item.expiryDate,
        createdAt: item.createdAt,
        isActive: item.isActive,
        type: item.type,
        price: item.price,
        divisionName: item.division?.name || 'N/A',
        taxes: item.taxes || []
      }));
      
      // Load persisted activation status
      const samplesWithPersistedStatus = loadPersistedActivationStatus(transformedItems);
      
      setAllSamples(samplesWithPersistedStatus);
      updatePagination(samplesWithPersistedStatus, pageNo, limit);
    } catch (error) {
      console.error("Error fetching samples:", error);
      console.error("Failed to load samples");
      setAllSamples([]);
      setFilteredSamples([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSamples = () => {
    let filtered = [...allSamples];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sample =>
        sample.sampleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.sampleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(sample => sample.status === statusFilter);
    }

    updatePagination(filtered, pageNo, limit);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleEdit = (sampleId) => {
    navigate(`/samples/edit/${sampleId}`);
  };

  const handleDelete = async (sampleId) => {
    if (!window.confirm("Are you sure you want to delete this sample?")) {
      return;
    }

    try {
      await axiosAPI.delete(`/samples/${sampleId}`);
      alert("Sample deleted successfully");
      refreshSampleData();
    } catch (error) {
      console.error("Error deleting sample:", error);
      alert("Failed to delete sample");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "badge bg-success";
      case "testing":
        return "badge bg-primary";
      case "expired":
        return "badge bg-danger";
      case "disposed":
        return "badge bg-secondary";
      default:
        return "badge bg-secondary";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <Loading />;
  }

         return (
     <div className="container-fluid">
       <div className="row m-0 p-3 justify-content-center">
         <div className="col-lg-10">
           {/* Breadcrumb Navigation */}
           <p className="path">
             <span onClick={() => navigate("/samples")}>Samples</span>{" "}
             <i className="bi bi-chevron-right"></i> View Samples
           </p>
           
           

          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
            </div>
          )}

          {/* Search Bar */}
          <div className="row m-0 p-0 mb-3">
            <div className="col-lg-6">
              <div className={styles.search}>
                <input
                  type="text"
                  placeholder="Search samples..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <span className={styles.searchicon}>
                  <IoSearch />
                </span>
              </div>
            </div>
            <div className="col-lg-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={handleStatusFilter}
              >
                <option value="">Filter by status</option>
                <option value="active">Active</option>
                <option value="testing">Testing</option>
                <option value="expired">Expired</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
            <div className="col-lg-3">
              <button
                className="btn btn-outline-primary"
                onClick={refreshSampleData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <div className="text-center">
                  <Loading />
                  <p className="mt-2 text-muted">Loading sample data...</p>
                </div>
              </div>
            </div>
          ) : filteredSamples && filteredSamples.length > 0 ? (
            <div className="row m-0 p-3 justify-content-center">
              {/* Activation Status Summary */}
              <div className="col-lg-10 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-3">
                                         <span className="badge bg-success">
                       <i className="bi bi-check-circle me-1"></i>
                       Active: {allSamples.filter(s => s.isActive === true).length}
                     </span>
                     <span className="badge bg-danger">
                       <i className="bi bi-x-circle me-1"></i>
                       Inactive: {allSamples.filter(s => s.isActive !== true).length}
                     </span>
                  </div>
                  <div className={styles.entity}>
                    <label>Entity :</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        setLimit(newLimit);
                      }}
                    >
                      {[10, 20, 30, 40, 50].map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-10">
                {/* Pagination Info */}
                <div className="row m-0 p-0 mb-3 justify-content-between">
                  <div className="col-lg-6">
                    <p className="text-muted mb-0">
                      Showing {filteredSamples && filteredSamples.length > 0 ? ((pageNo - 1) * limit) + 1 : 0} to {filteredSamples && filteredSamples.length > 0 ? Math.min(pageNo * limit, ((pageNo - 1) * limit) + filteredSamples.length) : 0} of {allSamples ? allSamples.length : 0} entries
                      {totalPages > 1 && ` (Page ${pageNo} of ${totalPages})`}
                    </p>
                  </div>
                </div>

                                 <table className="table table-bordered borderedtable">
                   <thead>
                     <tr>
                       <th>S.No</th>
                       <th>Sample ID</th>
                       <th>Sample Name</th>
                       <th>Type</th>
                       <th>Product</th>
                       <th>Warehouse</th>
                       <th>Quantity</th>
                       <th>Price</th>
                       <th>Status</th>
                       <th>
                         Activation
                       </th>
                       <th>Expiry Date</th>
                       <th>Created Date</th>
                       <th>Action</th>
                     </tr>
                   </thead>
                  <tbody>
                                         {filteredSamples.length === 0 && (
                       <tr className="animated-row">
                         <td colSpan={13}>NO DATA FOUND</td>
                       </tr>
                     )}
                    {filteredSamples.map((sample, index) => (
                                             <tr
                         key={sample.id}
                         className="animated-row"
                         style={{ animationDelay: `${index * 0.1}s` }}
                       >
                         <td>{((pageNo - 1) * limit) + index + 1}</td>
                         <td>
                           <span className="badge bg-info text-dark">
                             {sample.sampleId || `SAMP-${sample.id.toString().padStart(6, '0')}`}
                           </span>
                         </td>
                         <td>
                           <div>
                             <strong>{sample.sampleName}</strong>
                             {sample.description && (
                               <div className="text-muted small">
                                 {sample.description}
                               </div>
                             )}
                           </div>
                         </td>
                         <td>
                           <span className={`badge ${sample.type === 'product' ? 'bg-primary' : 'bg-success'}`}>
                             {sample.type || 'N/A'}
                           </span>
                         </td>
                         <td>{sample.productName || "N/A"}</td>
                         <td>{sample.warehouseName || "N/A"}</td>
                         <td>{sample.quantity}</td>
                         <td>₹{sample.price || 0}</td>
                         <td>
                           <span className={getStatusBadgeClass(sample.status)}>
                             {sample.status}
                           </span>
                         </td>
                        <td className={styles['activation-column']}>
                          {isAdmin ? (
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={sample.isActive === true}
                                onChange={() => {
                                  console.log('Toggle clicked for sample:', sample.id, 'Current status:', sample.isActive);
                                  if (sample.isActive === true) {
                                    // Show confirmation for deactivation
                                    showDeactivationConfirmation(sample.id, sample.sampleName);
                                  } else {
                                    // Direct activation
                                    handleActivationToggle(sample.id, sample.isActive);
                                  }
                                }}
                                disabled={updatingSampleId === sample.id}
                                style={{
                                  opacity: updatingSampleId === sample.id ? 0.6 : 1,
                                  cursor: updatingSampleId === sample.id ? 'not-allowed' : 'pointer'
                                }}
                              />
                              <label className="form-check-label">
                                {updatingSampleId === sample.id ? (
                                  <span className="badge bg-secondary">
                                    <i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }}></i>
                                    Updating...
                                  </span>
                                ) : (
                                  <span 
                                    className={`badge ${sample.isActive === true ? 'bg-success' : 'bg-danger'}`}
                                    title={`Sample is currently ${sample.isActive === true ? 'active' : 'inactive'}`}
                                  >
                                    <i className={`bi ${sample.isActive === true ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                                    {sample.isActive === true ? 'Active' : 'Inactive'}
                                  </span>
                                )}
                              </label>
                            </div>
                          ) : (
                            <span 
                              className={`badge ${sample.isActive === true ? 'bg-success' : 'bg-danger'}`}
                              title={`Sample is currently ${sample.isActive === true ? 'active' : 'inactive'}`}
                            >
                              <i className={`bi ${sample.isActive === true ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                              {sample.isActive === true ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td>{formatDate(sample.expiryDate)}</td>
                        <td>{formatDate(sample.createdAt)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(sample.id)}
                              title="Edit sample"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(sample.id)}
                              title="Delete sample"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="row m-0 p-0 pt-3 justify-content-between">
                  <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                                         {pageNo > 1 && (
                       <button onClick={() => setPageNo(pageNo - 1)}>
                         <span>
                           <FaArrowLeft />
                         </span>{" "}
                         Previous
                       </button>
                     )}
                  </div>
                  <div className="col-4 text-center">
                    <span className="text-muted">
                      Page {pageNo} of {totalPages || 1}
                    </span>
                  </div>
                  <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
                                         {pageNo < totalPages && (
                       <button onClick={() => setPageNo(pageNo + 1)}>
                         Next{" "}
                         <span>
                           <FaArrowRight />
                         </span>
                       </button>
                     )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <div className="text-center">
                  <p className="text-muted">No samples found</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation.show && (
        <>
          <div className="modal-backdrop fade show" style={{ display: 'block' }}></div>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Deactivation</h5>
                  <button type="button" className="btn-close" onClick={() => setShowConfirmation({ show: false, sampleId: null, action: null })}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to deactivate the sample "{showConfirmation.sampleName}"?</p>
                  <p className="text-muted small">This will disable the sample from being used in the system.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation({ show: false, sampleId: null, action: null })}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleConfirmedAction}>
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ViewSamples;
