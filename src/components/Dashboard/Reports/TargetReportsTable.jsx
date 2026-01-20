import React from 'react';
import targetReportsService from '../../../services/targetReportsService';

function TargetReportsTable({ 
  reportsData, 
  loading, 
  onExportPDF, 
  onExportExcel,
  currentFilters 
}) {
  
  if (loading) {
    return (
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-10">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading target reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-bar-chart-line display-1 text-muted mb-3"></i>
              <h5 className="text-muted">No Report Generated</h5>
              <p className="text-muted">
                Please use the filters above to generate a target report.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const reports = Array.isArray(reportsData) ? reportsData : [];

  return (
    <div className="row m-0 p-3 justify-content-center">
      <div className="col-lg-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0">
                <i className="bi bi-bar-chart-line me-2"></i>
                Target Reports
                {reports.length > 0 && (
                  <span className="badge bg-primary ms-2">{reports.length} records</span>
                )}
              </h6>
            </div>
            
            {/* Export Buttons */}
            {reports.length > 0 && (
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => onExportPDF(currentFilters)}
                  title="Export to PDF"
                >
                  <i className="bi bi-file-pdf me-1"></i>
                  PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => onExportExcel(currentFilters)}
                  title="Export to Excel"
                >
                  <i className="bi bi-file-excel me-1"></i>
                  Excel
                </button>
              </div>
            )}
          </div>
          
          <div className="card-body p-0">
            {reports.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No Data Found</h5>
                <p className="text-muted">
                  No target reports match the selected criteria.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Target Details</th>
                      <th scope="col">Type</th>
                      <th scope="col">Assigned To</th>
                      <th scope="col">Target Value</th>
                      <th scope="col">Achieved</th>
                      <th scope="col">Progress</th>
                      <th scope="col">Status</th>
                      <th scope="col">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={report.id || index} className="animated-row">
                        <td className="text-center">{index + 1}</td>
                        
                        {/* Target Details */}
                        <td>
                          <div>
                            <div className="fw-medium">
                              {report.targetName || report.name || 'N/A'}
                            </div>
                            {report.description && (
                              <small className="text-muted">
                                {report.description}
                              </small>
                            )}
                            {report.targetCode && (
                              <div>
                                <small className="badge bg-light text-dark">
                                  {report.targetCode}
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Type */}
                        <td>
                          <span className="badge bg-info">
                            {report.targetType || report.type || 'N/A'}
                          </span>
                        </td>
                        
                        {/* Assigned To */}
                        <td>
                          <div>
                            {report.assignedTo || report.assigneeName || 'N/A'}
                            {report.roleName && (
                              <div>
                                <small className="text-muted">
                                  ({report.roleName})
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Target Value */}
                        <td>
                          <div className="fw-medium">
                            {report.targetValue ? 
                              targetReportsService.formatCurrency(report.targetValue) : 
                              (report.budgetNumber || 'N/A')
                            }
                          </div>
                          {report.budgetUnit && (
                            <small className="text-muted">
                              {report.budgetUnit}
                            </small>
                          )}
                        </td>
                        
                        {/* Achieved */}
                        <td>
                          <div className="fw-medium">
                            {report.achievedValue ? 
                              targetReportsService.formatCurrency(report.achievedValue) : 
                              (report.currentProgress || '0')
                            }
                          </div>
                        </td>
                        
                        {/* Progress */}
                        <td>
                          <div>
                            {(() => {
                              const target = report.targetValue || report.budgetNumber || 0;
                              const achieved = report.achievedValue || report.currentProgress || 0;
                              const progress = targetReportsService.calculateProgress(achieved, target);
                              
                              return (
                                <>
                                  <div className="progress mb-1" style={{ height: '6px' }}>
                                    <div
                                      className={`progress-bar ${
                                        progress >= 100 ? 'bg-success' :
                                        progress >= 75 ? 'bg-info' :
                                        progress >= 50 ? 'bg-warning' : 'bg-danger'
                                      }`}
                                      role="progressbar"
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">
                                    {progress.toFixed(1)}%
                                  </small>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td>
                          <span className={targetReportsService.getStatusBadgeClass(report.status)}>
                            {report.status || 'N/A'}
                          </span>
                        </td>
                        
                        {/* Period */}
                        <td>
                          <div>
                            {report.startDate && (
                              <div>
                                <small className="text-muted">Start:</small>
                                <br />
                                {targetReportsService.formatDate(report.startDate)}
                              </div>
                            )}
                            {report.endDate && (
                              <div>
                                <small className="text-muted">End:</small>
                                <br />
                                {targetReportsService.formatDate(report.endDate)}
                              </div>
                            )}
                            {!report.startDate && !report.endDate && 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Footer with summary */}
          {reports.length > 0 && (
            <div className="card-footer bg-light">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="fw-medium">Total Targets</div>
                  <div className="text-primary fs-5">{reports.length}</div>
                </div>
                <div className="col-md-3">
                  <div className="fw-medium">Active</div>
                  <div className="text-success fs-5">
                    {reports.filter(r => r.status?.toLowerCase() === 'active').length}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="fw-medium">Completed</div>
                  <div className="text-info fs-5">
                    {reports.filter(r => r.status?.toLowerCase() === 'completed').length}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="fw-medium">Average Progress</div>
                  <div className="text-warning fs-5">
                    {(() => {
                      const progresses = reports.map(r => {
                        const target = r.targetValue || r.budgetNumber || 0;
                        const achieved = r.achievedValue || r.currentProgress || 0;
                        return targetReportsService.calculateProgress(achieved, target);
                      }).filter(p => p > 0);
                      
                      if (progresses.length === 0) return '0%';
                      
                      const avgProgress = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
                      return `${avgProgress.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TargetReportsTable;
