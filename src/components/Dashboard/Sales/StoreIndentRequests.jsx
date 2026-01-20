import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import storeService from '../../../services/storeService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';

const StoreIndentRequests = ({ navigate, canApprove }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stores, setStores] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Selected indent for view/approval
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  // Fetch stores for filter dropdown
  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch store indents
  useEffect(() => {
    fetchIndents();
  }, [page, limit, statusFilter, storeFilter, dateFrom, dateTo, selectedDivision, showAllDivisions]);

  const fetchStores = async () => {
    try {
      const response = await axiosAPI.get('/stores', { params: { limit: 1000 } });
      const responseData = response.data || response;
      const storesList = responseData.stores || responseData.data || responseData || [];
      setStores(Array.isArray(storesList) ? storesList : []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setStores([]);
    }
  };

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for the API call
      // Using GET /store-indents?storeId=1&status=pending format
      const params = {
        page,
        limit,
      };
      
      // Add storeId filter if a specific store is selected
      if (storeFilter !== 'all') {
        params.storeId = storeFilter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (dateFrom) {
        params.fromDate = dateFrom;
      }
      if (dateTo) {
        params.toDate = dateTo;
      }

      console.log('Fetching store indents with params:', params);
      
      // Use axiosAPI to call the endpoint: GET /store-indents?storeId=1&status=pending
      // Note: axiosAPI.get expects params as the second argument directly, not nested
      const response = await axiosAPI.get('/store-indents', params);
      
      console.log('Store indents response:', response);

      // Handle response structure
      const responseData = response.data || response;
      
      if (responseData.success !== undefined) {
        if (responseData.success) {
          const data = responseData.data || responseData;
          setIndents(data.indents || data || []);
          setTotalPages(data.totalPages || 0);
          setTotal(data.total || data.indents?.length || 0);
        } else {
          throw new Error(responseData.message || 'Failed to fetch indents');
        }
      } else if (responseData.indents) {
        setIndents(responseData.indents || []);
        setTotalPages(responseData.totalPages || 0);
        setTotal(responseData.total || responseData.indents?.length || 0);
      } else if (Array.isArray(responseData)) {
        setIndents(responseData);
        setTotal(responseData.length);
        setTotalPages(1);
      } else {
        // Handle different response structures
        const indentsArray = responseData.data?.indents || responseData.indents || [];
        setIndents(indentsArray);
        setTotalPages(responseData.totalPages || responseData.data?.totalPages || 1);
        setTotal(responseData.total || responseData.data?.total || indentsArray.length);
      }
    } catch (err) {
      console.error('Error fetching store indents:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch store indent requests';
      setError(errorMessage);
      setIsErrorModalOpen(true);
      setIndents([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewIndent = (indent) => {
    setSelectedIndent(indent);
    setShowViewModal(true);
  };

  const handleApprove = async (indent, remarks = '') => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can approve indents');
      return;
    }

    const confirmMessage = 'Are you sure you want to approve this store indent request?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosAPI.put(`/store-indents/indents/${indent.id}/approve-reject`, {
        action: 'approve',
        notes: remarks
      });
      
      const responseData = response.data || response;
      if (responseData.success || responseData.message) {
        showSuccessNotification(responseData.message || 'Store indent approved successfully');
        setShowViewModal(false);
        setSelectedIndent(null);
        fetchIndents(); // Refresh list
      } else {
        throw new Error(responseData.message || 'Failed to approve indent');
      }
    } catch (err) {
      console.error('Error approving indent:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to approve store indent';
      showErrorNotification(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (indent, remarks = '') => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can reject indents');
      return;
    }

    const confirmMessage = 'Are you sure you want to reject this store indent request?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosAPI.put(`/store-indents/indents/${indent.id}/approve-reject`, {
        action: 'reject',
        notes: remarks
      });
      
      const responseData = response.data || response;
      if (responseData.success || responseData.message) {
        showSuccessNotification(responseData.message || 'Store indent rejected successfully');
        setShowViewModal(false);
        setSelectedIndent(null);
        fetchIndents(); // Refresh list
      } else {
        throw new Error(responseData.message || 'Failed to reject indent');
      }
    } catch (err) {
      console.error('Error rejecting indent:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reject store indent';
      showErrorNotification(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessStockIn = async (indent) => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can process stock in');
      return;
    }

    if (!indent.store?.id && !indent.storeId) {
      showErrorNotification('Store information is missing');
      return;
    }

    const confirmMessage = 'Are you sure you want to process stock in for this approved indent?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare stock-in payload
      const stockInPayload = {
        storeId: indent.store?.id || indent.storeId,
        indentId: indent.id,
        items: (indent.items || []).map(item => ({
          productId: item.productId || item.product?.id,
          quantity: item.quantity,
          unit: item.unit || 'units'
        }))
      };

      const response = await axiosAPI.post('/stores/stock-in', stockInPayload);
      
      const responseData = response.data || response;
      if (responseData.success || responseData.message) {
        showSuccessNotification(responseData.message || 'Stock in processed successfully');
        setShowViewModal(false);
        setSelectedIndent(null);
        fetchIndents(); // Refresh list
      } else {
        throw new Error(responseData.message || 'Failed to process stock in');
      }
    } catch (err) {
      console.error('Error processing stock in:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process stock in';
      showErrorNotification(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'badge bg-warning text-dark',
      'awaiting_approval': 'badge bg-warning text-dark',
      'approved': 'badge bg-success',
      'rejected': 'badge bg-danger',
      'processing': 'badge bg-info',
      'completed': 'badge bg-success'
    };
    
    return statusMap[status?.toLowerCase()] || 'badge bg-secondary';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Pending';
    const statusStr = status.toLowerCase();
    if (statusStr === 'awaiting_approval') return 'Awaiting Approval';
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const filteredIndents = indents.filter(indent => {
    const matchesSearch = 
      indent.id?.toString().includes(searchTerm.toLowerCase()) ||
      indent.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indent.indentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indent.store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indent.store?.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  if (loading && indents.length === 0) {
    return <Loading />;
  }

  return (
    <div>
      {/* Filters */}
      <div className="row m-0 p-3">
        <div className={`col-3 formcontent`}>
          <label htmlFor="">Search :</label>
          <input
            type="text"
            placeholder="Search by ID, Code, Store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">Store :</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="all">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name || store.storeName}
              </option>
            ))}
          </select>
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">Status :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">From :</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
      </div>
      <div className="row m-0 p-3">
        <div className={`col-3 formcontent`}>
          <label htmlFor="">To :</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
      <div className="row m-0 p-3 pb-5 justify-content-center">
        <div className="col-4">
          <button className="submitbtn" onClick={fetchIndents} disabled={loading}>
            Submit
          </button>
        </div>
      </div>

      {/* Indents Table */}
      {filteredIndents.length === 0 && !loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#6c757d' }}></i>
            <h4 className="mt-3">No Store Indent Requests Found</h4>
            <p className="text-muted">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
                ? 'No indents match your current filters. Try adjusting your search criteria.'
                : 'There are no store indent requests yet. Store indents created in stores will appear here for approval.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="row m-0 p-3 justify-content-around">
            <div className="col-lg-10">
              <table className={`table table-bordered borderedtable`}>
                  <thead>
                    <tr>
                      <th>Indent ID</th>
                      <th>Indent Code</th>
                      <th>Store</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Total Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIndents.map((indent) => (
                      <tr key={indent.id}>
                        <td>
                          <strong>#{indent.id}</strong>
                        </td>
                        <td>
                          <strong>{indent.code || indent.indentNumber || `IND-${indent.id}`}</strong>
                        </td>
                        <td>
                          {indent.store?.name || indent.store?.storeName || 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${
                            indent.priority === 'urgent' ? 'bg-danger' :
                            indent.priority === 'high' ? 'bg-warning' :
                            indent.priority === 'normal' ? 'bg-info' :
                            'bg-secondary'
                          }`}>
                            {indent.priority?.charAt(0).toUpperCase() + indent.priority?.slice(1) || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadge(indent.status)}>
                            {getStatusLabel(indent.status)}
                          </span>
                        </td>
                        <td>
                          {indent.createdAt 
                            ? new Date(indent.createdAt).toLocaleDateString('en-GB')
                            : 'N/A'}
                          <br />
                          <small className="text-muted">
                            {indent.createdAt 
                              ? new Date(indent.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </small>
                        </td>
                        <td>
                          {indent.items?.length || indent.totalItems || 0} item{(indent.items?.length || indent.totalItems || 0) !== 1 ? 's' : ''}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewIndent(indent)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {(indent.status === 'pending' || indent.status === 'awaiting_approval') && canApprove && (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleApprove(indent)}
                                  title="Approve Indent"
                                >
                                  <i className="bi bi-check-circle"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(indent)}
                                  title="Reject Indent"
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} indents
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* View Indent Modal */}
      {showViewModal && selectedIndent && (
        <div
          className="modal fade show"
          style={{ display: 'block', position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 150000 }}
          tabIndex="-1"
          role="dialog"
          onClick={() => {
            setShowViewModal(false);
            setSelectedIndent(null);
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Store Indent Details - {selectedIndent.code || selectedIndent.indentNumber || `IND-${selectedIndent.id}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedIndent(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Indent ID:</strong> #{selectedIndent.id}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>{' '}
                    <span className={getStatusBadge(selectedIndent.status)}>
                      {getStatusLabel(selectedIndent.status)}
                    </span>
                  </div>
                  <div className="col-md-6 mt-2">
                    <strong>Store:</strong> {selectedIndent.store?.name || selectedIndent.store?.storeName || 'N/A'}
                  </div>
                  <div className="col-md-6 mt-2">
                    <strong>Priority:</strong>{' '}
                    <span className={`badge ${
                      selectedIndent.priority === 'urgent' ? 'bg-danger' :
                      selectedIndent.priority === 'high' ? 'bg-warning' :
                      selectedIndent.priority === 'normal' ? 'bg-info' :
                      'bg-secondary'
                    }`}>
                      {selectedIndent.priority?.charAt(0).toUpperCase() + selectedIndent.priority?.slice(1) || 'Normal'}
                    </span>
                  </div>
                  <div className="col-md-6 mt-2">
                    <strong>Request Date:</strong>{' '}
                    {selectedIndent.createdAt 
                      ? new Date(selectedIndent.createdAt).toLocaleString('en-GB')
                      : 'N/A'}
                  </div>
                  {selectedIndent.notes && (
                    <div className="col-12 mt-2">
                      <strong>Notes:</strong> {selectedIndent.notes}
                    </div>
                  )}
                </div>

                <h6 className="mt-3 mb-2">Items</h6>
                <div className="table-responsive">
                  <table className="table table-bordered borderedtable">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>No of Bags</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedIndent.items || []).map((item, index) => {
                        const quantity = item.quantity || item.requestedQuantity || item.qty || 0;
                        return (
                          <tr key={index}>
                            <td>{item.product?.name || item.productName || 'Unknown'}</td>
                            <td>{quantity}</td>
                            <td>{item.unit || 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                {(selectedIndent.status === 'pending' || selectedIndent.status === 'awaiting_approval') && canApprove && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleApprove(selectedIndent)}
                      disabled={submitting}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleReject(selectedIndent)}
                      disabled={submitting}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedIndent(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={closeErrorModal}
        />
      )}
    </div>
  );
};

export default StoreIndentRequests;


