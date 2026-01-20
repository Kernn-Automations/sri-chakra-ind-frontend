import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import returnsService from '../../../services/returnsService';
import styles from './Returns.module.css';

const ReturnImageManagement = ({ returnItemId, onImagesUpdated }) => {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (returnItemId) {
      loadImages();
    }
  }, [returnItemId, selectedDivision, showAllDivisions]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const divisionId = selectedDivision?.id || null;
      
      console.log('Loading images for return item:', returnItemId);
      const response = await returnsService.getReturnItemImages(
        returnItemId,
        divisionId,
        showAllDivisions
      );
      
      console.log('Images response:', response);
      
      if (response && response.success) {
        // Handle different possible response structures
        const images = response.data?.images || response.images || response.data || [];
        console.log('Setting images:', images);
        setImages(Array.isArray(images) ? images : []);
      } else if (response && response.success === undefined) {
        // Handle case where response doesn't have success property but might still be valid
        const images = response.data?.images || response.images || response.data || [];
        console.log('Response without success property, setting images:', images);
        setImages(Array.isArray(images) ? images : []);
      } else {
        const errorMessage = response?.message || response?.error || 'Unknown error loading images';
        console.error('Error loading images:', errorMessage);
        console.error('Full response:', response);
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate images
    const validation = returnsService.validateImages(files);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      setUploading(true);
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.uploadReturnItemImages(
        returnItemId,
        selectedFiles,
        divisionId,
        showAllDivisions
      );
      
      if (response.success) {
        // Clear selected files and previews
        setSelectedFiles([]);
        setPreviewUrls([]);
        
        // Reload images
        await loadImages();
        
        // Notify parent component
        if (onImagesUpdated) {
          onImagesUpdated();
        }
        
        alert('Images uploaded successfully');
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
        
        // Notify parent component
        if (onImagesUpdated) {
          onImagesUpdated();
        }
        
        alert('Image deleted successfully');
      } else {
        alert(response.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const handleViewImage = async (imageId) => {
    try {
      const divisionId = selectedDivision?.id || null;
      
      const response = await returnsService.getImage(
        imageId,
        divisionId,
        showAllDivisions
      );
      
      if (response.success && response.data?.imageUrl) {
        window.open(response.data.imageUrl, '_blank');
      } else {
        alert('Unable to load image');
      }
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Error loading image');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading images...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Debug Info */}
      <div className="mb-3 p-2 bg-light rounded">
        <small className="text-muted">
          Debug Info: Return Item ID: {returnItemId}, Images: {images.length}, Loading: {loading.toString()}
        </small>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary ms-2"
          onClick={loadImages}
        >
          Reload Images
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Return Item Images</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label 
            htmlFor="image-upload" 
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ cursor: 'pointer', margin: 0 }}
          >
            Select Images
          </label>
          {selectedFiles.length > 0 && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
            </button>
          )}
        </div>
      </div>

      {/* Preview selected files */}
      {previewUrls.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Selected Images Preview:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {previewUrls.map((url, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #3498db'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {selectedFiles[index]?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display uploaded images */}
      {images.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📷</div>
          <p className={styles.emptyStateText}>No images uploaded for this return item</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {images.map((image) => (
            <div 
              key={image.id} 
              style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '10px', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #ecf0f1'
              }}
            >
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img
                  src={image.imageUrl}
                  alt={image.imageType || 'Return item image'}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewImage(image.id)}
                />
                <button
                  className={styles.closeButton}
                  onClick={() => handleDeleteImage(image.id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                  {image.imageType?.replace('_', ' ').toUpperCase() || 'IMAGE'}
                </p>
                <p style={{ margin: '2px 0' }}>
                  Uploaded: {new Date(image.createdAt).toLocaleDateString()}
                </p>
                {image.returnItemId && (
                  <p style={{ margin: '2px 0' }}>
                    Return Item ID: {image.returnItemId}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnImageManagement;
