import {
    DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import styles from "./InventoryTab.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

const DamagedGoodsModal = ({ item, warehouse, onSuccess }) => {
  // ✅ State for file
  const [imageFile, setImageFile] = useState(null);
  const [damagedQuantity, setDamagedQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successful, setSuccessful] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { axiosAPI } = useAuth();

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // ✅ File change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('✅ File selected:', file.name, file.size, file.type);
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validation
    if (!imageFile) {
      alert('Please select an image file');
      return;
    }
    if (!reason || reason.trim() === '') {
      alert('Please enter a reason');
      return;
    }
    if (!damagedQuantity || damagedQuantity <= 0) {
      alert('Please enter a valid damaged quantity');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      
      // ✅ Add fields with correct names
      formData.append('productId', item.productId);
      formData.append('damagedQuantity', damagedQuantity);
      formData.append('reason', reason);
      formData.append('imageFile', imageFile); // ✅ Field name MUST be 'imageFile'

      // ✅ Debug: Log FormData contents
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log('Field:', key, 'Value:', value);
      }

      const response = await axiosAPI.formData(
        `/warehouses/${warehouse.id}/damage-reporting`,
        formData
      );

      console.log('✅ Success:', response.data);
      setSuccessful("Damage report submitted successfully!");
      
      // Reset form
      setDamagedQuantity("");
      setReason("");
      setImageFile(null);
      
      setTimeout(() => {
        setSuccessful("");
        // Close modal after success
        const closeButton = document.querySelector('[data-radix-dialog-close]');
        if (closeButton) closeButton.click();
        // Notify parent to refresh inventory
        if (typeof onSuccess === 'function') {
          try {
            onSuccess();
          } catch (e) {
            console.error('Error calling onSuccess callback:', e);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to report damaged goods');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className={styles.reportsbtn}>Report Damaged Goods</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Report Damaged Goods</h3>
            
            {/* Product Info */}
            <div className="row justify-content-center mb-3">
              <div className="col-8">
                <div className="product-info-card">
                  <img
                    src={item.images && item.images.length > 0 ? item.images[0] : "/placeholder.png"}
                    alt={item.name}
                    className="product-image-small"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div className="product-details">
                    <h5>{item.name}</h5>
                    <p>Available: {item.quantity} {item.productType === "packed" ? "packets" : item.unit}</p>
                    {item.productType === "packed" && (
                      <p>Pack: {item.packageWeight} {item.packageWeightUnit}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row justify-content-center">
                <div className={`col-6 inputcolumn-mdl`}>
                  <label>Damaged Quantity: <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="number"
                    value={damagedQuantity}
                    onChange={(e) => setDamagedQuantity(e.target.value)}
                    placeholder={`Enter quantity (max: ${item.quantity})`}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className={`col-6 inputcolumn-mdl`}>
                  <label>Reason: <span style={{color: 'red'}}>*</span></label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for damage..."
                    rows="3"
                    required
                  />
                </div>
              </div>

              {/* ✅ File Input */}
              <div className="row justify-content-center">
                <div className={`col-12 inputcolumn-mdl`}>
                  <label>Image File (Required): <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    style={{ display: 'block', marginTop: '5px' }}
                  />
                  {imageFile && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      ✅ Selected: {imageFile.name} ({imageFile.size} bytes)
                    </p>
                  )}
                </div>
              </div>

              <div className="row justify-content-center p-3">
                {!loading && !successful && (
                  <div className="col-5">
                    <button type="submit" className="submitbtn">
                      Submit Report
                    </button>
                    <DialogActionTrigger asChild>
                      <button type="button" className="cancelbtn">Cancel</button>
                    </DialogActionTrigger>
                  </div>
                )}
                {!loading && successful && (
                  <div className="col-5">
                    <div className="success-message">
                      {successful}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {loading && <Loading />}
            {isModalOpen && (
              <ErrorModal
                isOpen={isModalOpen}
                message={error}
                onClose={closeModal}
              />
            )}
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>

      <style jsx>{`
        .product-info-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .product-details h5 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .product-details p {
          margin: 0 0 2px 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .success-message {
          padding: 12px 16px;
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default DamagedGoodsModal;
