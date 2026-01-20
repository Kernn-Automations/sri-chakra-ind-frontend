import React, { useRef } from "react";
import { RiAddLargeLine } from "react-icons/ri";
import styles from "./Customer.module.css"; // Adjust the path if needed

const ImageUploadBox = ({ file, setFile, label }) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const preview = URL.createObjectURL(selectedFile);
      setFile({ file: selectedFile, preview });
    }
  };

  const handleRemove = () => {
    setFile(null);
    fileInputRef.current.value = null;
  };

  return (
    <>
      <div className={`col-3 ${styles.upload}`}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/png, image/gif, image/jpeg"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={styles.uploadbutton}
          onClick={handleUploadClick}
        >
          {file?.preview ? (
            <img
              src={file.preview}
              alt={`${label} preview`}
              className={styles.previewImage}
            />
          ) : (
            <p>
              <RiAddLargeLine />
              <br />
            </p>
          )}
        </button>
        {file && (
          <button className={styles.deletebtn} onClick={handleRemove}>
            <i className="bi bi-trash3"></i>
          </button>
        )}
      </div>
      <p className={styles.imglabel}>{label}</p>
    </>
  );
};

export default ImageUploadBox;
