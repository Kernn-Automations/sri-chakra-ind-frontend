import React, { useEffect, useState } from "react";
import axios from "axios";
import tokenManager from "./tokenManager";

const PDFPreviewModal = ({
  triggerText = "Preview PDF",
  pdfUrl,
  filename = "document.pdf",
}) => {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPDF = async () => {
    if (!open) return;

    const VITE_API = import.meta.env.VITE_API_URL;
    const token = tokenManager.getAccessToken();
    let objectURL = null;

    const fetchPDFInternal = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if token exists
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        console.log(`[PDFPreviewModal] Fetching PDF from: ${VITE_API}${pdfUrl}`);
        console.log(`[PDFPreviewModal] Token present: ${!!token}`);

        const response = await axios.get(`${VITE_API}${pdfUrl}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        });

        if (!(response.data instanceof Blob)) {
          throw new Error("Expected Blob but got something else");
        }

        objectURL = URL.createObjectURL(response.data);
        setBlobUrl(objectURL);
        console.log(`[PDFPreviewModal] PDF loaded successfully`);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        
        // Handle specific error cases
        if (err.response?.status === 401) {
          const errorMsg = "Authentication failed. Please log in again.";
          console.error("Authentication failed. Token may be expired or invalid.");
          setError(errorMsg);
        } else if (err.response?.status === 404) {
          const errorMsg = "PDF not found at the specified URL.";
          console.error("PDF not found at the specified URL.");
          setError(errorMsg);
        } else if (err.response?.status >= 500) {
          const errorMsg = "Server error occurred while fetching PDF.";
          console.error("Server error occurred while fetching PDF.");
          setError(errorMsg);
        } else {
          const errorMsg = err.message || "Failed to load PDF";
          setError(errorMsg);
        }
        
        setBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFInternal();

    return () => {
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  };

  useEffect(() => {
    if (open) {
      fetchPDF();
    } else {
      // Clear error and blob URL when modal is closed
      setError(null);
      setBlobUrl(null);
    }
  }, [open, pdfUrl]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  return (
    <>
      <button className="submitbtn" onClick={() => setOpen(true)}>
        {triggerText}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: "5vh",
            left: "5vw",
            width: "90vw",
            height: "90vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "transparent",
            }}
          >
            <h5 style={{ margin: 0, color: "white"}}>PDF Preview</h5>
            <div>
              <button className="text-white" onClick={() => setOpen(false)}>
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#f0f0f0" }}>
            {loading ? (
              <p style={{ padding: "1rem", color: "#000" }}>Loading PDF...</p>
            ) : blobUrl ? (
              <iframe
                src={blobUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            ) : error ? (
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
                <button 
                  className="submitbtn" 
                  onClick={() => setOpen(false)}
                  style={{ marginRight: "0.5rem" }}
                >
                  Close
                </button>
                <button 
                  className="submitbtn" 
                  onClick={() => {
                    setError(null);
                    setBlobUrl(null);
                    fetchPDF();
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <p style={{ color: "red", padding: "1rem" }}>Unable to load PDF</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PDFPreviewModal;
