import React, { useState, useEffect } from "react";
import styles from "./Targets.module.css";
import { FaTimes, FaUsers, FaUser, FaCalendarAlt, FaMoneyBillWave, FaChartLine } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import targetService from "@/services/targetService";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from "@/components/ui/dialog";

function TargetDetailsModal({ isOpen, target, onClose }) {
  const [detailedTarget, setDetailedTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Fetch detailed target information
  useEffect(() => {
    if (isOpen && target?.id) {
      fetchTargetDetails();
    }
  }, [isOpen, target?.id]);

  /**
   * Fetch detailed target information
   */
  const fetchTargetDetails = async () => {
    try {
      setLoading(true);
      const response = await targetService.getTargetById(target.id);
      setDetailedTarget(response.target);
    } catch (error) {
      console.error("Error fetching target details:", error);
      setError("Failed to fetch target details");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
   * Calculate days remaining
   */
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 'N/A';
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `${diffDays} days remaining`;
    }
  };

  if (loading) {
    return (
      <DialogRoot open={isOpen} onOpenChange={onClose} placement="center" size="xl">
        <DialogContent className="mdl">
          <DialogBody>
            <div className="text-center p-5">
              <Loading />
            </div>
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    );
  }

  if (!detailedTarget) {
    return null;
  }

  return (
    <>
      <DialogRoot open={isOpen} onOpenChange={onClose} placement="center" size="xl">
        <DialogContent className="mdl">
          <DialogBody>
            <div className="container-fluid">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h3 className="mdl-title mb-2">{detailedTarget.name}</h3>
                      <div className="d-flex gap-2 align-items-center">
                        <span className="badge bg-light text-dark">
                          {detailedTarget.targetCode}
                        </span>
                        <span className={`badge ${getStatusBadgeClass(detailedTarget.status)}`}>
                          {detailedTarget.status}
                        </span>
                        <span className="badge bg-info">
                          {detailedTarget.targetType === 'sales' ? 'Sales Target' : 'Customer Target'}
                        </span>
                        <span className={`badge ${detailedTarget.assignmentType === 'team' ? 'bg-primary' : 'bg-secondary'}`}>
                          {detailedTarget.assignmentType === 'team' ? 'Team Assignment' : 'Employee Assignment'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <FaMoneyBillWave className="text-success mb-2" size={24} />
                      <h5 className="card-title mb-1">Budget</h5>
                      <p className="card-text">
                        {formatCurrency(detailedTarget.budgetNumber, detailedTarget.budgetUnit)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <FaCalendarAlt className="text-primary mb-2" size={24} />
                      <h5 className="card-title mb-1">Duration</h5>
                      <p className="card-text">
                        {detailedTarget.timeFrameValue} {detailedTarget.timeFrame}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <FaUsers className="text-info mb-2" size={24} />
                      <h5 className="card-title mb-1">Assignments</h5>
                      <p className="card-text">
                        {detailedTarget.assignments?.length || 0} {detailedTarget.assignmentType}s
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <FaChartLine className="text-warning mb-2" size={24} />
                      <h5 className="card-title mb-1">Time Left</h5>
                      <p className="card-text">
                        {getDaysRemaining(detailedTarget.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Information */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Target Information</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Start Date:</strong></td>
                            <td>{formatDate(detailedTarget.startDate)}</td>
                          </tr>
                          <tr>
                            <td><strong>End Date:</strong></td>
                            <td>{formatDate(detailedTarget.endDate)}</td>
                          </tr>
                          <tr>
                            <td><strong>Division:</strong></td>
                            <td>{detailedTarget.division?.name || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td><strong>Created By:</strong></td>
                            <td>
                              {detailedTarget.createdByEmployee?.name || 'N/A'}
                              {detailedTarget.createdByEmployee?.employeeId && (
                                <small className="text-muted d-block">
                                  ({detailedTarget.createdByEmployee.employeeId})
                                </small>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Description</h6>
                    </div>
                    <div className="card-body">
                      <p className="card-text">
                        {detailedTarget.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        {detailedTarget.assignmentType === 'team' ? 'Team Assignments' : 'Employee Assignments'}
                      </h6>
                    </div>
                    <div className="card-body">
                      {detailedTarget.assignments && detailedTarget.assignments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>S.No</th>
                                <th>{detailedTarget.assignmentType === 'team' ? 'Team Name' : 'Employee Name'}</th>
                                <th>Individual Budget</th>
                                <th>Status</th>
                                <th>Assigned Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedTarget.assignments.map((assignment, index) => (
                                <tr key={assignment.id}>
                                  <td>{index + 1}</td>
                                  <td>
                                    {detailedTarget.assignmentType === 'team' ? (
                                      <>
                                        <FaUsers className="me-2 text-primary" />
                                        {assignment.team?.name || 'N/A'}
                                      </>
                                    ) : (
                                      <>
                                        <FaUser className="me-2 text-secondary" />
                                        {assignment.employee?.name || 'N/A'}
                                        {assignment.employee?.employeeId && (
                                          <small className="text-muted d-block">
                                            ({assignment.employee.employeeId})
                                          </small>
                                        )}
                                      </>
                                    )}
                                  </td>
                                  <td>
                                    {formatCurrency(
                                      assignment.individualBudgetNumber,
                                      detailedTarget.budgetUnit
                                    )}
                                  </td>
                                  <td>
                                    <span className={`badge ${getStatusBadgeClass(assignment.status)}`}>
                                      {assignment.status}
                                    </span>
                                  </td>
                                  <td>
                                    {assignment.assignedDate 
                                      ? formatDate(assignment.assignedDate)
                                      : 'N/A'
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No assignments found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row">
                <div className="col-12 text-center">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>

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
    </>
  );
}

export default TargetDetailsModal;



