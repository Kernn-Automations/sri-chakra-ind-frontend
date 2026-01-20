import React, { useState, useRef } from 'react';
import styles from './Returns.module.css';

const ImageUploadComponent = ({ onImagesChange, maxImages = 3, maxSizeKB = 100 }) => {
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Compress image to stay under size limit
  const compressImage = (file, maxSizeKB) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;
        const maxDimension = 800; // Max width/height for compression
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to stay under size limit
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
              resolve(blob);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }, file.type, quality);
        };
        
        tryCompress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Convert file to base64
  const convertToBase64 = async (file) => {
    try {
      // First compress the image
      const compressedBlob = await compressImage(file, maxSizeKB);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result;
          resolve({
            data: base64,
            type: file.type,
            filename: file.name,
            size: compressedBlob.size
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  // Validate image
  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      alert(`Only JPEG, PNG, and WebP images are allowed`);
      return false;
    }
    
    // Don't check file size here since we'll compress automatically
    // Just warn if file is extremely large
    if (file.size > 10 * 1024 * 1024) { // 10MB warning
      if (!confirm(`This image is very large (${Math.round(file.size/1024/1024)}MB). It will be compressed to under ${maxSizeKB}KB. Continue?`)) {
        return false;
      }
    }
    
    return true;
  };

  // Handle file selection
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateImage);
    
    if (validFiles.length !== fileArray.length) {
      alert('Some files were rejected due to validation errors');
    }
    
    if (images.length + validFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    if (validFiles.length === 0) return;
    
    try {
      // Show processing message
      const processingMsg = document.createElement('div');
      processingMsg.className = 'alert alert-info position-fixed';
      processingMsg.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
      processingMsg.innerHTML = '<i class="bi bi-hourglass-split"></i> Compressing images...';
      document.body.appendChild(processingMsg);
      
      const base64Images = await Promise.all(
        validFiles.map(async (file, index) => {
          console.log(`Compressing image ${index + 1}/${validFiles.length}: ${file.name}`);
          return await convertToBase64(file);
        })
      );
      
      // Remove processing message
      processingMsg.remove();
      
      const newImages = [...images, ...base64Images];
      setImages(newImages);
      onImagesChange(newImages);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success position-fixed';
      successMsg.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
      successMsg.innerHTML = `<i class="bi bi-check-circle"></i> ${base64Images.length} image(s) compressed and ready`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Error processing images: ' + error.message);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.imageUploadContainer}>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        
        <div className={styles.dropZoneContent}>
          <i className="bi bi-cloud-upload" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
          <p>Drag & drop images here or click to select</p>
          <p className="text-muted">
            Max {maxImages} images, {maxSizeKB}KB each
          </p>
        </div>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          <h6>Selected Images ({images.length}/{maxImages})</h6>
          <div className={styles.imageGrid}>
            {images.map((image, index) => (
              <div key={index} className={styles.imagePreviewItem}>
                <img
                  src={image.data}
                  alt={`Preview ${index + 1}`}
                  className={styles.previewImage}
                />
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => removeImage(index)}
                >
                  <i className="bi bi-x"></i>
                </button>
                <div className={styles.imageInfo}>
                  <small>{image.filename}</small>
                  <small>{Math.round(image.size / 1024)}KB</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadComponent;
