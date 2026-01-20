import React, { useState, useEffect } from "react";
import { useAuth } from "../../Auth";
import { useNavigate } from "react-router-dom";
import { useDivision } from "../context/DivisionContext";
import styles from "./DivisionSwitcher.module.css";

function DivisionSwitcher() {
  const { axiosAPI } = useAuth();
  const navigate = useNavigate();
  const { 
    divisions, 
    selectedDivision, 
    setSelectedDivision, 
    loading: contextLoading,
    reload: reloadDivisions,
    reset: resetDivisions
  } = useDivision();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Only fetch divisions once when component mounts or when user changes
    // Also check if divisions are already loaded to prevent unnecessary API calls
    if (user && divisions.length === 0) {
      reloadDivisions().catch(err => {
        console.error("Failed to load divisions:", err);
        setError("Failed to load divisions");
      });
    }
  }, [user, divisions.length]); // Add divisions.length to prevent unnecessary calls

  // Reset error when divisions load successfully
  useEffect(() => {
    if (divisions.length > 0) {
      setError(null);
    }
  }, [divisions.length]);

  // Listen for division change events
  useEffect(() => {
    const handleDivisionChange = (event) => {
      const { divisionId, division } = event.detail;
      console.log('DivisionSwitcher - Division changed to:', divisionId);
      console.log('DivisionSwitcher - Division details:', division);
      // The context will handle the state update automatically
    };

    window.addEventListener('divisionChanged', handleDivisionChange);
    return () => {
      window.removeEventListener('divisionChanged', handleDivisionChange);
    };
  }, []);
  
  // Add logging for context updates
  useEffect(() => {
    console.log('DivisionSwitcher - Context updated:', {
      selectedDivision,
      selectedDivisionName: selectedDivision?.name,
      selectedDivisionId: selectedDivision?.id,
      divisionsCount: divisions.length,
      timestamp: new Date().toISOString()
    });
  }, [selectedDivision, divisions.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setLoading(false);
    };
  }, []);

  const handleDivisionClick = () => {
    // Navigate to the /divs route instead of reloading the page
    navigate("/divs");
  };

  // Always show the component if user exists, even if no divisions are loaded yet
  if (!user) {
    return null;
  }

  // Remove console.log statements to prevent console spam
  // console.log("DivisionSwitcher render - divisions:", divisions);
  // console.log("DivisionSwitcher render - selectedDivision:", selectedDivision);

  return (
    <div className={styles.container}>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '10px', fontSize: '12px' }}>
          {error}
          <button 
            onClick={() => {
              setError(null);
              reloadDivisions().catch(err => {
                console.error("Failed to reload divisions:", err);
                setError("Failed to reload divisions");
              });
            }}
            style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '10px' }}
          >
            Retry
          </button>
        </div>
      )}
      <div className={styles.selector}>
        <div className={styles.divisionDisplay}>
          <span className={styles.divisionName}>
            {(() => {
              const displayName = contextLoading || loading ? "Loading..." : (selectedDivision?.name || "Select Division");
              console.log('DivisionSwitcher - Rendering division name:', {
                contextLoading,
                loading,
                selectedDivisionName: selectedDivision?.name,
                finalDisplayName: displayName
              });
              return displayName;
            })()}
          </span>
          <button
            className={styles.backArrowButton}
            onClick={handleDivisionClick}
            disabled={contextLoading || loading}
          >
            <span className={styles.backArrow}>
              ←
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DivisionSwitcher; 