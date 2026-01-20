import React, { useRef, useState } from "react";
import styles from "./Tickets.module.css";
import axios from "axios";

import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
  DialogActionTrigger,
} from "@/components/ui/dialog";

const FileUploadDialog = ({ files, setFiles }) => {
  const inputRef = useRef(null);
  
  

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 6) {
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };


  return (
    <DialogRoot placement="center" size="md">
      <DialogTrigger asChild>
        <button className={styles.primaryBtn}>Upload Files</button>
      </DialogTrigger>

      <DialogContent className="mdl">
        <DialogBody>
          <h3 className="px-3 pb-3 mdl-title">Upload Files</h3>

          <div className="row m-0 p-3 py-2 justify-content-center">
            <div className="col-6">
              <input
                type="file"
                multiple
                accept="image/*"
                ref={inputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={files.length >= 6}
              />

              <button
                className={`${styles.grayBtn} mb-2`}
                onClick={() => inputRef.current?.click()}
              >
                Click to Select Files
              </button>
            </div>
          </div>

          <ul className={styles.fileList}>
            {files.map((file, index) => (
              <li className={styles.fileItem} key={index}>
                <span>{file.name}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {files.length >= 6 && (
            <p className={styles.errorText}>Maximum 6 files allowed.</p>
          )}

          {files.length === 0 && (
            <p className={styles.firstText}>
              Upload at least one File<span>*</span>.
            </p>
          )}

          <div className="row m-0 p-2 justify-content-center">
            <div className="col-3">
              <DialogActionTrigger asChild>
                <button
                  className="submitbtn"
                  disabled={files.length === 0}
                >
                  Upload
                </button>
              </DialogActionTrigger>
            </div>
          </div>
        </DialogBody>

        <DialogCloseTrigger className="inputcolumn-mdl-close" />
      </DialogContent>
    </DialogRoot>
  );
};

export default FileUploadDialog;
