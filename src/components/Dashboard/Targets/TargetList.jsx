import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import styles from "./Targets.module.css";
import { FaPlus, FaEdit, FaTrash, FaEye, FaFilter } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import CreateTargetModal from "./CreateTargetModal";
import EditTargetModal from "./EditTargetModal";
import TargetDetailsModal from "./TargetDetailsModal";
import targetService from "@/services/targetService";

function TargetList() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const user = JSON.parse(localStorage.getItem("user"));
  const roles = JSON.stringify(user.roles);
  const isAdmin = roles.includes("Admin");

  // State management
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    assignmentType: '',
    targetType: '',
    status: '',
    page: 1,
    limit: 10
  });
  
  // Filter options
  const [assignmentTypes, setAssignmentTypes] = useState([]);
  const [targetTypes, setTargetTypes] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchTargets();
    fetchFilterOptions();
  }, [filters]);

  /**
   * Fetch targets with current filters
   */
  const fetchTargets = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem('currentDivisionId');
      
      const filterParams = {
        ...filters,
        divisionId: currentDivisionId && currentDivisionId !== '1' ? currentDivisionId : undefined
      };

      const response = await targetService.getAllTargets(filterParams);
      
      setTargets(response.data?.targets || []);
      setPagination(response.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (error) {
      console.error("Error fetching targets:", error);
      setError("Failed to fetch targets");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch filter options
   */
  const fetchFilterOptions = async () => {
    try {
      const [assignmentTypesRes, targetTypesRes] = await Promise.all([
        targetService.getAssignmentTypes(),
        targetService.getTargetTypes()
      ]);
      
      setAssignmentTypes(assignmentTypesRes.assignmentTypes || []);
      setTargetTypes(targetTypesRes.targetTypes || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      assignmentType: '',
      targetType: '',
      status: '',
      page: 1,
      limit: 10
    });
  };

  /**
   * Handle target creation success
   */
  const handleTargetCreated = () => {
    setIsCreateModalOpen(false);
    setSuccess("Target created successfully!");
    setIsSuccessModalOpen(true);
    fetchTargets();
  };

  /**
   * Handle target update success
   */
  const handleTargetUpdated = () => {
    setIsEditModalOpen(false);
    setSelectedTarget(null);
    setSuccess("Target updated successfully!");
    setIsSuccessModalOpen(true);
    fetchTargets();
  };

  /**
   * Handle target deletion
   */
  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm("Are you sure you want to delete this target?")) {
      return;
    }

    try {
      setLoading(true);
      await targetService.deleteTarget(targetId);
      setSuccess("Target deleted successfully!");
      setIsSuccessModalOpen(true);
      fetchTargets();
    } catch (error) {
      console.error("Error deleting target:", error);
      setError("Failed to delete target");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open edit modal
   */
  const handleEditTarget = (target) => {
    setSelectedTarget(target);
    setIsEditModalOpen(true);
  };

  /**
   * Open details modal
   */
  const handleViewTarget = (target) => {
    setSelectedTarget(target);
    setIsDetailsModalOpen(true);
  };

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-secondary';
      case 'completed':
        return 'bg-primary';
      default:
        return 'bg-warning';
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount, unit) => {
    if (unit === 'rupees') {
      return `₹${amount?.toLocaleString() || 0}`;
    }
    return `${amount || 0} ${unit || ''}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <div className={styles.targetsContainer}>
        {/* Header */}
        <div className="row m-0 mb-3">
          <div className="col">
            <p className="path">
              <span onClick={() => navigate("/targets")}>Targets</span>{" "}
              <i className="bi bi-chevron-right"></i> All Targets
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="row m-0 mb-4">
          <div className="col-md-8">
            <div className="d-flex gap-3 align-items-center flex-wrap">
              {/* Assignment Type Filter */}
              <div className="form-group">
                <select
                  className="form-select form-select-sm"
                  value={filters.assignmentType}
                  onChange={(e) => handleFilterChange('assignmentType', e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">All Assignment Types</option>
                  {assignmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Type Filter */}
              <div className="form-group">
                <select
                  className="form-select form-select-sm"
                  value={filters.targetType}
                  onChange={(e) => handleFilterChange('targetType', e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">All Target Types</option>
                  {targetTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="form-group">
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{ minWidth: '120px' }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
                disabled={!filters.assignmentType && !filters.targetType && !filters.status}
              >
                <FaFilter /> Clear Filters
              </button>
            </div>
          </div>

          {/* Create Target Button */}
          {isAdmin && (
            <div className="col-md-4 text-end">
              <button
                className="btn btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <FaPlus /> Create Target
              </button>
            </div>
          )}
        </div>

        {/* Targets Table */}
        <div className="row m-0">
          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Target Name</th>
                    <th>Type</th>
                    <th>Assignment</th>
                    <th>Budget</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Assignments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center">
                        {loading ? "Loading..." : "No targets found"}
                      </td>
                    </tr>
                  ) : (
                    targets.map((target, index) => (
                      <tr key={target.id} className="animated-row">
                        <td>{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</td>
                        <td>
                          <strong>{target.name}</strong>
                          <br />
                          <small className="text-muted">{target.targetCode}</small>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {target.targetType === 'sales' ? 'Sales' : 'Customer'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${target.assignmentType === 'team' ? 'bg-primary' : 'bg-secondary'}`}>
                            {target.assignmentType === 'team' ? 'Team' : 'Employee'}
                          </span>
                        </td>
                        <td>{formatCurrency(target.budgetNumber, target.budgetUnit)}</td>
                        <td>
                          {formatDate(target.startDate)} - {formatDate(target.endDate)}
                          <br />
                          <small className="text-muted">
                            {target.timeFrameValue} {target.timeFrame}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(target.status)}`}>
                            {target.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {target.assignments?.length || 0} assignments
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleViewTarget(target)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => handleEditTarget(target)}
                                  title="Edit Target"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteTarget(target.id)}
                                  title="Delete Target"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="row m-0 mt-3">
            <div className="col-12">
              <nav>
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <li key={pageNumber} className={`page-item ${pagination.currentPage === pageNumber ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTargetModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleTargetCreated}
        />
      )}

      {isEditModalOpen && selectedTarget && (
        <EditTargetModal
          isOpen={isEditModalOpen}
          target={selectedTarget}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTarget(null);
          }}
          onSuccess={handleTargetUpdated}
        />
      )}

      {isDetailsModalOpen && selectedTarget && (
        <TargetDetailsModal
          isOpen={isDetailsModalOpen}
          target={selectedTarget}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTarget(null);
          }}
        />
      )}

      {/* Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => {
            setIsErrorModalOpen(false);
            setError(null);
          }}
        />
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          message={success}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setSuccess(null);
          }}
        />
      )}

      {/* Loading */}
      {loading && <Loading />}
    </>
  );
}

export default TargetList;



