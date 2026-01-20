import React from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css'; // Import the default styles
import styles from "./Payments.module.css"; // Reuse your existing styles for backdrop

const ImageZoomModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    // We'll create a custom backdrop here to ensure it's visible BEHIND this modal,
    // and above the dialog backdrop.
    <div className={styles.imageZoomBackdrop} onClick={onClose}>
      <div className={styles.imageZoomContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.imageZoomCloseButton} onClick={onClose}>
          ×
        </button>
        <Zoom>
          <img
            src={imageUrl}
            alt="Payment Proof"
            className={styles.zoomableImage}
          />
        </Zoom>
      </div>
    </div>
  );
};

export default ImageZoomModal;