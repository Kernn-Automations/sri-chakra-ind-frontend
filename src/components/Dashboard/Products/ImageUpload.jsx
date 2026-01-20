import React, { useRef } from "react";
import { RiAddLargeLine } from "react-icons/ri";
import styles from "./Products.module.css";

function ImageUpload({ images, setImages }) {
  const fileInputRef = useRef(null);

  // console.log(images)

  const handleImageSelect = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    
    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...images];
      newImages[index] = {
        file,
        preview: reader.result,
      };

      if (newImages.length < 6 && !newImages.includes(null)) {
        newImages.push(null);
      }

      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = (index) => {
    fileInputRef.current.click();
    fileInputRef.current.dataset.index = index;
  };

  const handleFileChange = (e) => {
    const index = parseInt(e.target.dataset.index, 10);
    handleImageSelect(e, index);
  };

  const handleRemove = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    if (!newImages.includes(null) && newImages.length < 6) {
      newImages.push(null);
    }
    setImages(newImages);
  };

  return (
    <div className="row m-0 p-3 justify-content-start">
      {images.map((img, index) => (
        <div key={index} className={`col-3 ${styles.upload}`}>
          <input
            type="file"
            ref={fileInputRef}
            data-index={index}
            style={{ display: "none" }}
            accept="image/png, image/gif, image/jpeg"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className={styles.uploadbutton}
            onClick={() => handleUploadClick(index)}
          >
            {img?.preview ? (
              <img
                src={img.preview}
                alt={`Upload ${index + 1}`}
                className={styles.previewImage}
              />
            ) : (
              <p>
                <RiAddLargeLine />
              </p>
            )}
          </button>
          {img && (
            <button
              className={styles.deletebtn}
              onClick={() => handleRemove(index)}
            >
              <i className="bi bi-trash3"></i>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ImageUpload;
