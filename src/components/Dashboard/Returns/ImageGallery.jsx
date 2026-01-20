import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';

const ImageGallery = ({ returnItemId, returnRequestId, onImageUpdate }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (returnItemId) {
      loadImages();
    }
  }, [returnItemId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.getReturnItemImages(
        returnItemId,
        divisionId,
        showAllDivisions
      );
      
      if (response.success && response.data?.images) {
        setImages(response.data.images);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    // Validate images
    const validation = returnsService.validateImages(files);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    setNewImages(files);
    setShowUploadModal(true);
  };

  const handleUploadConfirm = async () => {
    if (newImages.length === 0) return;
    
    try {
      setUploading(true);
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.uploadReturnItemImages(
        returnItemId,
        newImages,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        // Reload images
        await loadImages();
        setShowUploadModal(false);
        setNewImages([]);
        
        if (onImageUpdate) {
          onImageUpdate();
        }
      } else {
        alert(response.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.deleteReturnItemImage(
        imageId,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        // Reload images
        await loadImages();
        
        if (onImageUpdate) {
          onImageUpdate();
        }
      } else {
        alert(response.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 small text-muted">Loading images...</p>
      </div>
    );
  }

  return (
    <div className={styles.imageGallery}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Images ({images.length})</h6>
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="form-control form-control-sm"
            style={{ width: 'auto', display: 'inline-block' }}
          />
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-4 border rounded">
          <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2">No images uploaded</p>
        </div>
      ) : (
        <div className="row g-2">
          {images.map((image, index) => (
            <div key={image.id || index} className="col-md-3">
              <div className="card">
                <div 
                  className="card-img-top" 
                  style={{ 
                    height: '120px', 
                    backgroundImage: `url(${image.imageUrl || image.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => openImageModal(image)}
                />
                <div className="card-body p-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Upload Images</h5>
              <button 
                className={styles.closeButton}
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Upload {newImages.length} image(s)?</p>
              <div className="row g-2">
                {newImages.map((image, index) => (
                  <div key={index} className="col-md-4">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Preview ${index + 1}`}
                      className="img-fluid rounded"
                      style={{ height: '100px', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUploadConfirm}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h5>Image Preview</h5>
              <button 
                className={styles.closeButton}
                onClick={closeImageModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody} style={{ textAlign: 'center' }}>
              <img 
                src={selectedImage.imageUrl || selectedImage.url}
                alt="Preview"
                className="img-fluid"
                style={{ maxHeight: '70vh' }}
              />
              <div className="mt-3">
                <p className="text-muted">
                  Uploaded: {new Date(selectedImage.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
