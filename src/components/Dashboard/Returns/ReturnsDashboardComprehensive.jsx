import React, { useState, useEffect } from 'react';

import { useAuth } from '../../../Auth';

import { useDivision } from '../../context/DivisionContext';

import returnsService from '../../../services/returnsService';

import ImageGallery from './ImageGallery';

import styles from './Returns.module.css';



const ReturnsDashboardComprehensive = () => {

  const { axiosAPI } = useAuth();

  const { selectedDivision, showAllDivisions } = useDivision();

  

  const [returns, setReturns] = useState([]);

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({

    status: '',

    returnCase: '',

    refundStatus: '',

    page: 1,

    limit: 10,

    search: ''

  });

  const [pagination, setPagination] = useState({});

  const [selectedReturn, setSelectedReturn] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);



  useEffect(() => {

    loadReturns();

  }, [selectedDivision, showAllDivisions, filters]);



  const loadReturns = async () => {

    try {

      setLoading(true);

      const divisionId = selectedDivision?.id || null;

      

      const response = await returnsService.getReturnRequests(filters, divisionId, showAllDivisions);

      

      if (response.success) {

        setReturns(response.data.returnRequests || []);

        setPagination(response.data.pagination || {});

      } else {

        console.error('Failed to fetch returns:', response.message);

        setReturns([]);

        setPagination({});

      }

    } catch (error) {

      console.error('Error loading returns:', error);

      setReturns([]);

      setPagination({});

    } finally {

      setLoading(false);

    }

  };



  const handleFilterChange = (key, value) => {

    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  };



  const handleSearchChange = (value) => {

    setFilters(prev => ({ ...prev, search: value, page: 1 }));

  };



  const handlePageChange = (page) => {

    setFilters(prev => ({ ...prev, page }));

  };



  const handleViewDetails = async (returnItem) => {

    try {

      const divisionId = selectedDivision?.id || null;

      

      const response = await returnsService.getReturnRequestWithImages(

        returnItem.id,

        divisionId,

        showAllDivisions

      );

      

      if (response.success) {

        setSelectedReturn(response.data);

        setShowDetailsModal(true);

      } else {

        alert('Failed to load return details');

      }

    } catch (error) {

      console.error('Error loading return details:', error);

      alert('Error loading return details');

    }

  };



  const handleApprove = async (returnId) => {

    try {

      const divisionId = selectedDivision?.id || null;

      

      const response = await returnsService.approveRejectReturn(

        returnId,

        {

          approvalStatus: 'approved',

          approvalRemarks: 'Approved by admin'

        },

        divisionId,

        showAllDivisions

      );

      

      if (response.success) {

        alert('Return approved successfully');

        loadReturns();

      } else {

        alert(response.message || 'Failed to approve return');

      }

    } catch (error) {

      console.error('Error approving return:', error);

      alert('Error approving return');

    }

  };



  const handleReject = async (returnId) => {

    const remarks = prompt('Please enter rejection remarks:');

    if (!remarks) return;

    

    try {

      const divisionId = selectedDivision?.id || null;

      

      const response = await returnsService.approveRejectReturn(

        returnId,

        {

          approvalStatus: 'rejected',

          approvalRemarks: remarks

        },

        divisionId,

        showAllDivisions

      );

      

      if (response.success) {

        alert('Return rejected successfully');

        loadReturns();

      } else {

        alert(response.message || 'Failed to reject return');

      }

    } catch (error) {

      console.error('Error rejecting return:', error);

      alert('Error rejecting return');

    }

  };



  const getStatusBadge = (status) => {

    const statusClasses = {

      pending: styles.pending,

      approved: styles.approved,

      rejected: styles.rejected,

      processing: styles.processing,

      completed: styles.completed

    };

    

    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;

  };



  const getRefundStatusBadge = (status) => {

    const statusClasses = {

      pending: styles.pending,

      processing: styles.processing,

      completed: styles.approved,

      failed: styles.rejected

    };

    

    return `${styles.statusBadge} ${statusClasses[status] || styles.pending}`;

  };



  const formatCurrency = (amount) => {

    return new Intl.NumberFormat('en-IN', {

      style: 'currency',

      currency: 'INR'

    }).format(amount);

  };



  const formatDate = (dateString) => {

    return new Date(dateString).toLocaleDateString('en-IN', {

      year: 'numeric',

      month: 'short',

      day: 'numeric',

      hour: '2-digit',

      minute: '2-digit'

    });

  };



  return (

    <div className={styles.returnsDashboard}>

      {/* Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <h2>Returns Dashboard</h2>

        <div className="d-flex gap-2">

          <button 

            className="btn btn-primary"

            onClick={() => setShowCreateModal(true)}

          >

            <i className="bi bi-plus-circle me-1"></i>

            Create Return Request

          </button>

          <button 

            className="btn btn-outline-secondary"

            onClick={loadReturns}

          >

            <i className="bi bi-arrow-clockwise me-1"></i>

            Refresh

          </button>

        </div>

      </div>



      {/* Filters */}

      <div className="card mb-4">

        <div className="card-body">

          <div className="row g-3">

            <div className="col-md-3">

              <label className="form-label">Search</label>

              <input

                type="text"

                className="form-control"

                placeholder="Search by return number, order number, or customer..."

                value={filters.search}

                onChange={(e) => handleSearchChange(e.target.value)}

              />

            </div>

            <div className="col-md-2">

              <label className="form-label">Status</label>

              <select

                className="form-select"

                value={filters.status}

                onChange={(e) => handleFilterChange('status', e.target.value)}

              >

                <option value="">All Status</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>

                <option value="processing">Processing</option>

                <option value="completed">Completed</option>

              </select>

            </div>

            <div className="col-md-2">

              <label className="form-label">Return Case</label>

              <select

                className="form-select"

                value={filters.returnCase}

                onChange={(e) => handleFilterChange('returnCase', e.target.value)}

              >

                <option value="">All Cases</option>

                <option value="pre_dispatch">Pre-Dispatch</option>

                <option value="post_delivery">Post-Delivery</option>

              </select>

            </div>

            <div className="col-md-2">

              <label className="form-label">Refund Status</label>

              <select

                className="form-select"

                value={filters.refundStatus}

                onChange={(e) => handleFilterChange('refundStatus', e.target.value)}

              >

                <option value="">All Refunds</option>

                <option value="pending">Pending</option>

                <option value="processing">Processing</option>

                <option value="completed">Completed</option>

                <option value="failed">Failed</option>

              </select>

            </div>

            <div className="col-md-2">

              <label className="form-label">Per Page</label>

              <select

                className="form-select"

                value={filters.limit}

                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}

              >

                <option value={10}>10</option>

                <option value={25}>25</option>

                <option value={50}>50</option>

                <option value={100}>100</option>

              </select>

            </div>

          </div>

        </div>

      </div>



      {/* Returns List */}

      {loading ? (

        <div className="text-center py-5">

          <div className="spinner-border" role="status">

            <span className="visually-hidden">Loading...</span>

          </div>

          <p className="mt-2">Loading returns...</p>

        </div>

      ) : returns.length === 0 ? (

        <div className="text-center py-5">

          <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>

          <h4 className="text-muted mt-3">No returns found</h4>

          <p className="text-muted">Try adjusting your filters or create a new return request.</p>

        </div>

      ) : (

        <div className="row g-3">

          {returns.map((returnItem) => (

            <div key={returnItem.id} className="col-md-6 col-lg-4">

              <div className="card h-100">

                <div className="card-header d-flex justify-content-between align-items-center">

                  <h6 className="mb-0">{returnItem.returnNumber}</h6>

                  <span className={getStatusBadge(returnItem.status)}>

                    {returnItem.status}

                  </span>

                </div>

                <div className="card-body">

                  <div className="mb-2">

                    <strong>Order:</strong> {returnItem.salesOrder?.orderNumber || 'N/A'}

                  </div>

                  <div className="mb-2">

                    <strong>Customer:</strong> {returnItem.salesOrder?.customer?.customerName || 'N/A'}

                  </div>

                  <div className="mb-2">

                    <strong>Amount:</strong> {formatCurrency(returnItem.totalReturnAmount || 0)}

                  </div>

                  <div className="mb-2">

                    <strong>Created:</strong> {formatDate(returnItem.createdAt)}

                  </div>

                  

                  {returnItem.returnRefunds && returnItem.returnRefunds.length > 0 && (

                    <div className="mb-2">

                      <strong>Refund Status:</strong>

                      <span className={`ms-1 ${getRefundStatusBadge(returnItem.returnRefunds[0].refundStatus)}`}>

                        {returnItem.returnRefunds[0].refundStatus}

                      </span>

                    </div>

                  )}

                  

                  <div className="mb-2">

                    <strong>Items:</strong> {returnItem.returnItems?.length || 0} items

                  </div>

                </div>

                <div className="card-footer">

                  <div className="d-flex gap-2">

                    <button

                      className="btn btn-sm btn-outline-primary"

                      onClick={() => handleViewDetails(returnItem)}

                    >

                      <i className="bi bi-eye me-1"></i>

                      View

                    </button>

                    

                    {returnItem.status === 'pending' && (

                      <>

                        <button

                          className="btn btn-sm btn-success"

                          onClick={() => handleApprove(returnItem.id)}

                        >

                          <i className="bi bi-check me-1"></i>

                          Approve

                        </button>

                        <button

                          className="btn btn-sm btn-danger"

                          onClick={() => handleReject(returnItem.id)}

                        >

                          <i className="bi bi-x me-1"></i>

                          Reject

                        </button>

                      </>

                    )}

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}



      {/* Pagination */}

      {pagination.totalPages > 1 && (

        <nav className="mt-4">

          <ul className="pagination justify-content-center">

            <li className={`page-item ${!pagination.hasPrev ? 'disabled' : ''}`}>

              <button

                className="page-link"

                onClick={() => handlePageChange(filters.page - 1)}

                disabled={!pagination.hasPrev}

              >

                Previous

              </button>

            </li>

            

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (

              <li key={page} className={`page-item ${page === filters.page ? 'active' : ''}`}>

                <button

                  className="page-link"

                  onClick={() => handlePageChange(page)}

                >

                  {page}

                </button>

              </li>

            ))}

            

            <li className={`page-item ${!pagination.hasNext ? 'disabled' : ''}`}>

              <button

                className="page-link"

                onClick={() => handlePageChange(filters.page + 1)}

                disabled={!pagination.hasNext}

              >

                Next

              </button>

            </li>

          </ul>

        </nav>

      )}



      {/* Return Details Modal */}

      {showDetailsModal && selectedReturn && (

        <ReturnDetailsModal

          returnRequest={selectedReturn}

          onClose={() => {

            setShowDetailsModal(false);

            setSelectedReturn(null);

          }}

        />

      )}



      {/* Create Return Modal */}

      {showCreateModal && (

        <CreateReturnRequestComprehensive

          onClose={() => setShowCreateModal(false)}

          onSuccess={(result) => {

            if (result.success) {

              loadReturns();

            }

            setShowCreateModal(false);

          }}

        />

      )}

    </div>

  );

};



// Return Details Modal Component

const ReturnDetailsModal = ({ returnRequest, onClose }) => {

  const [activeTab, setActiveTab] = useState('details');



  return (

    <div className={styles.modal}>

      <div className={styles.modalContent} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>

        <div className={styles.modalHeader}>

          <h4>Return Request Details - {returnRequest.returnNumber}</h4>

          <button className={styles.closeButton} onClick={onClose}>

            ×

          </button>

        </div>

        

        <div className={styles.modalBody}>

          <ul className="nav nav-tabs mb-3">

            <li className="nav-item">

              <button

                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}

                onClick={() => setActiveTab('details')}

              >

                Details

              </button>

            </li>

            <li className="nav-item">

              <button

                className={`nav-link ${activeTab === 'items' ? 'active' : ''}`}

                onClick={() => setActiveTab('items')}

              >

                Items ({returnRequest.returnItems?.length || 0})

              </button>

            </li>

            <li className="nav-item">

              <button

                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}

                onClick={() => setActiveTab('refunds')}

              >

                Refunds ({returnRequest.returnRefunds?.length || 0})

              </button>

            </li>

          </ul>



          {activeTab === 'details' && (

            <div className="row">

              <div className="col-md-6">

                <h6>Return Information</h6>

                <table className="table table-sm">

                  <tbody>

                    <tr>

                      <td><strong>Return Number:</strong></td>

                      <td>{returnRequest.returnNumber}</td>

                    </tr>

                    <tr>

                      <td><strong>Status:</strong></td>

                      <td>

                        <span className={`badge ${returnRequest.status === 'approved' ? 'bg-success' : 

                          returnRequest.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>

                          {returnRequest.status}

                        </span>

                      </td>

                    </tr>

                    <tr>

                      <td><strong>Return Case:</strong></td>

                      <td>{returnRequest.returnCase}</td>

                    </tr>

                    <tr>

                      <td><strong>Return Reason:</strong></td>

                      <td>{returnRequest.returnReason}</td>

                    </tr>

                    <tr>

                      <td><strong>Created:</strong></td>

                      <td>{new Date(returnRequest.createdAt).toLocaleString()}</td>

                    </tr>

                  </tbody>

                </table>

              </div>

              <div className="col-md-6">

                <h6>Sales Order Information</h6>

                <table className="table table-sm">

                  <tbody>

                    <tr>

                      <td><strong>Order Number:</strong></td>

                      <td>{returnRequest.salesOrder?.orderNumber}</td>

                    </tr>

                    <tr>

                      <td><strong>Customer:</strong></td>

                      <td>{returnRequest.salesOrder?.customer?.customerName}</td>

                    </tr>

                    <tr>

                      <td><strong>Total Amount:</strong></td>

                      <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(returnRequest.totalReturnAmount || 0)}</td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {activeTab === 'items' && (

            <div>

              <h6>Return Items</h6>

              {returnRequest.returnItems?.map((item, index) => (

                <div key={item.id || index} className="card mb-3">

                  <div className="card-body">

                    <div className="row">

                      <div className="col-md-8">

                        <h6>{item.product?.name}</h6>

                        <p className="text-muted mb-1">SKU: {item.product?.SKU}</p>

                        <p className="mb-1">

                          <strong>Return Quantity:</strong> {item.returnQuantity} {item.unit}

                        </p>

                        <p className="mb-1">

                          <strong>Condition:</strong> {item.itemCondition}

                        </p>

                      </div>

                      <div className="col-md-4">

                        <ImageGallery 

                          returnItemId={item.id}

                          returnRequestId={returnRequest.id}

                        />

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}



          {activeTab === 'refunds' && (

            <div>

              <h6>Refund Information</h6>

              {returnRequest.returnRefunds?.map((refund, index) => (

                <div key={refund.id || index} className="card mb-3">

                  <div className="card-body">

                    <div className="row">

                      <div className="col-md-6">

                        <p><strong>Refund Number:</strong> {refund.refundNumber}</p>

                        <p><strong>Amount:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(refund.refundAmount)}</p>

                        <p><strong>Method:</strong> {refund.refundMethod}</p>

                      </div>

                      <div className="col-md-6">

                        <p><strong>Status:</strong> 

                          <span className={`badge ms-1 ${refund.refundStatus === 'completed' ? 'bg-success' : 

                            refund.refundStatus === 'failed' ? 'bg-danger' : 'bg-warning'}`}>

                            {refund.refundStatus}

                          </span>

                        </p>

                        <p><strong>Reference:</strong> {refund.paymentReference || 'N/A'}</p>

                        <p><strong>Created:</strong> {new Date(refund.createdAt).toLocaleString()}</p>

                      </div>

                    </div>

                    {refund.refundNotes && (

                      <div className="mt-2">

                        <strong>Notes:</strong>

                        <p className="text-muted">{refund.refundNotes}</p>

                      </div>

                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        

        <div className={styles.modalFooter}>

          <button className="btn btn-secondary" onClick={onClose}>

            Close

          </button>

        </div>

      </div>

    </div>

  );

};



export default ReturnsDashboardComprehensive;

