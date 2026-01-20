import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import styles from "./Targets.module.css";
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

function EditTargetModal({ isOpen, target, onClose, onSuccess }) {
  const { axiosAPI } = useAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    budgetNumber: '',
    budgetUnit: 'rupees',
    timeFrameValue: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form with target data
  useEffect(() => {
    if (isOpen && target) {
      setFormData({
        name: target.name || '',
        budgetNumber: target.budgetNumber || '',
        budgetUnit: target.budgetUnit || 'rupees',
        timeFrameValue: target.timeFrameValue || '',
        startDate: target.startDate ? target.startDate.split('T')[0] : '',
        endDate: target.endDate ? target.endDate.split('T')[0] : '',
        description: target.description || ''
      });
    }
  }, [isOpen, target]);

  /**
   * Handle form field changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.budgetNumber || formData.budgetNumber <= 0) newErrors.budgetNumber = true;
    if (!formData.timeFrameValue || formData.timeFrameValue <= 0) newErrors.timeFrameValue = true;
    if (!formData.startDate) newErrors.startDate = true;
    if (!formData.endDate) newErrors.endDate = true;

    // Validate date range
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fill in all required fields correctly");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const updateData = {
        name: formData.name.trim(),
        budgetNumber: parseFloat(formData.budgetNumber),
        budgetUnit: formData.budgetUnit,
        timeFrameValue: parseInt(formData.timeFrameValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim()
      };

      await targetService.updateTarget(target.id, updateData);
      onSuccess();
    } catch (error) {
      console.error("Error updating target:", error);
      setError(error.message || "Failed to update target");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Budget unit options
   */
  const budgetUnits = [
    { value: 'rupees', label: 'Rupees (₹)' },
    { value: 'tons', label: 'Tons' },
    { value: 'bags', label: 'Bags' },
    { value: 'count', label: 'Count' }
  ];

  return (
    <>
      <DialogRoot open={isOpen} onOpenChange={onClose} placement="center" size="lg">
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className="px-3 pb-3 mdl-title">Edit Target</h3>
            
            <div className="container-fluid">
              {/* Target Information */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="alert alert-info">
                    <strong>Note:</strong> Target type and assignment type cannot be modified after creation.
                    Only basic information can be updated.
                  </div>
                </div>
              </div>

              {/* Read-only Target Info */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Target Type</label>
                    <input
                      type="text"
                      value={target?.targetType === 'sales' ? 'Sales Target' : 'Customer Target'}
                      disabled
                      className="bg-light"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Assignment Type</label>
                    <input
                      type="text"
                      value={target?.assignmentType === 'team' ? 'Team Assignment' : 'Employee Assignment'}
                      disabled
                      className="bg-light"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="row">
                <div className="col-12">
                  <div className="inputcolumn-mdl">
                    <label>Target Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter target name"
                      className={errors.name ? styles.errorField : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Budget Information */}
              <div className="row">
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Budget Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budgetNumber}
                      onChange={(e) => handleInputChange('budgetNumber', e.target.value)}
                      placeholder="Enter budget amount"
                      className={errors.budgetNumber ? styles.errorField : ''}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Budget Unit *</label>
                    <select
                      value={formData.budgetUnit}
                      onChange={(e) => handleInputChange('budgetUnit', e.target.value)}
                    >
                      {budgetUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Time Frame */}
              <div className="row">
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Time Frame Value *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.timeFrameValue}
                      onChange={(e) => handleInputChange('timeFrameValue', e.target.value)}
                      placeholder="Enter duration"
                      className={errors.timeFrameValue ? styles.errorField : ''}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Time Frame Unit</label>
                    <input
                      type="text"
                      value="Months"
                      disabled
                      className="bg-light"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="row">
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={errors.startDate ? styles.errorField : ''}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="inputcolumn-mdl">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={errors.endDate ? styles.errorField : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="row">
                <div className="col-12">
                  <div className="inputcolumn-mdl">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter target description (optional)"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-warning">
                    <strong>Assignment Information:</strong>
                    <br />
                    This target is assigned to {target?.assignments?.length || 0} {target?.assignmentType}(s).
                    To modify assignments, please delete and recreate the target.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!loading && (
                <div className="row pt-3 mt-3">
                  <div className="col-12 text-center">
                    <button
                      type="button"
                      className="submitbtn me-3"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      Update Target
                    </button>
                    <button
                      type="button"
                      className="cancelbtn"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="row pt-3 mt-3">
                  <div className="col-12 text-center">
                    <Loading />
                  </div>
                </div>
              )}
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

export default EditTargetModal;



