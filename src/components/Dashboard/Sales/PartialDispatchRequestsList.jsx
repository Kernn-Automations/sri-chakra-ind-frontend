import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDivision } from '../../context/DivisionContext';
import partialDispatchService from '../../../services/partialDispatchService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';
import CustomSearchDropdown from '@/utils/CustomSearchDropDown';

const PartialDispatchRequestsList = ({ navigate, canApprove }) => {
  const { selectedDivision, showAllDivisions } = useDivision();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  // Fetch requests
  useEffect(() => {
    fetchRequests();
  }, [page, limit, statusFilter, dateFrom, dateTo, selectedDivision, showAllDivisions]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build params object
      const params = {
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined
      };

      const response = await partialDispatchService.getAllRequests(
        params,
        selectedDivision?.id,
        showAllDivisions
      );

      if (response.success) {
        const data = response.data || response;
        setRequests(data.requests || data || []);
        setTotalPages(data.totalPages || 0);
        setTotal(data.total || data.requests?.length || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch partial dispatch requests');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    navigate(`/sales/partial-dispatch-requests/${request.id}`);
  };

  const handleApprove = async (request) => {
    if (!canApprove) {
      showErrorNotification('Only Admin/Super Admin can approve requests');
      return;
    }
    navigate(`/sales/partial-dispatch-requests/${request.id}`);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge bg-warning text-dark',
      approved: 'badge bg-success',
      rejected: 'badge bg-danger'
    };
    
    return statusClasses[status] || 'badge bg-secondary';
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id?.toString().includes(searchTerm.toLowerCase()) ||
      request.salesOrderId?.toString().includes(searchTerm.toLowerCase()) ||
      request.salesOrder?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.salesOrder?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  if (loading && requests.length === 0) {
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
            placeholder="Search by ID, Order Number, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={`col-3 formcontent`}>
          <label htmlFor="">Status :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
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
          <button className="submitbtn" onClick={fetchRequests} disabled={loading}>
            Submit
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 && !loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '48px', color: '#6c757d' }}></i>
            <h4 className="mt-3">No Partial Dispatch Requests Found</h4>
            <p className="text-muted">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
                ? 'No requests match your current filters. Try adjusting your search criteria.'
                : 'There are no partial dispatch requests yet. Create a request from a sales order to get started.'}
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
                      <th>Request ID</th>
                      <th>Sales Order</th>
                      <th>Customer</th>
                      <th>Requested By</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Total Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>#{request.id}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{request.salesOrder?.orderNumber || `SO-${request.salesOrderId}`}</strong>
                            <br />
                            <small className="text-muted">Order ID: {request.salesOrderId}</small>
                          </div>
                        </td>
                        <td>
                          {request.salesOrder?.customer?.name || 
                           request.salesOrder?.customer?.customerName || 
                           'N/A'}
                        </td>
                        <td>
                          {request.requestedByUser?.name || 
                           request.requestedBy || 
                           'N/A'}
                        </td>
                        <td>
                          <span className={getStatusBadge(request.status)}>
                            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {request.createdAt 
                            ? new Date(request.createdAt).toLocaleDateString('en-GB')
                            : 'N/A'}
                          <br />
                          <small className="text-muted">
                            {request.createdAt 
                              ? new Date(request.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </small>
                        </td>
                        <td>
                          {request.items?.length || 0} item{request.items?.length !== 1 ? 's' : ''}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewRequest(request)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {request.status === 'pending' && canApprove && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(request)}
                                title="Approve Request"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
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
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} requests
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

export default PartialDispatchRequestsList;


