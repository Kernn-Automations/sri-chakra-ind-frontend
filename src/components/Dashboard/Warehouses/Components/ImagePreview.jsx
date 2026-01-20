import React, { useState, useEffect } from 'react';

const ImagePreview = ({ file, onRemove, className = '', style = {} }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  if (!preview) return null;

  return (
    <div className={`image-preview ${className}`} style={style}>
      <img src={preview} alt="Preview" />
      {onRemove && (
        <button type="button" onClick={onRemove} className="remove-btn">
          ×
        </button>
      )}
      
      <style jsx>{`
        .image-preview {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          display: inline-block;
        }
        
        .image-preview img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          cursor: pointer;
        }
        
        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: rgba(220, 38, 38, 0.9);
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .remove-btn:hover {
          background-color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default ImagePreview; 