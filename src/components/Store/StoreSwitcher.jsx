import React, { useState, useEffect } from "react";
import { useAuth } from "../../Auth";
import { useNavigate } from "react-router-dom";
import styles from "./StoreSwitcher.module.css";
import {
  isStoreManager,
  isAdmin,
  isSuperAdmin,
  isDivisionHead,
  isStoreEmployee,
} from "../../utils/roleUtils";

function StoreSwitcher() {
  const { axiosAPI } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storesCount, setStoresCount] = useState(0);
  const [currentStore, setCurrentStore] = useState(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  console.log("StoreSwitcher user:", user);

  // Check if user has the required role
  const hasRequiredRole =
    isStoreManager(user) ||
    isStoreEmployee(user) ||
    isAdmin(user) ||
    isSuperAdmin(user) ||
    isDivisionHead(user);

  useEffect(() => {
    if (!hasRequiredRole) {
      return;
    }

    // Get current store from localStorage
    const selectedStoreData = localStorage.getItem("selectedStore");
    if (selectedStoreData) {
      try {
        const store = JSON.parse(selectedStoreData);
        setCurrentStore(store);
      } catch (e) {
        console.error("Error parsing selectedStore:", e);
      }
    }

    // Fetch stores count to check if user has multiple stores
    fetchStoresCount();
  }, [hasRequiredRole]);

  const fetchStoresCount = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get assignedStores from user data (for store managers)
      const currentUser = user.user || user;
      let storesList = currentUser?.assignedStores || [];

      // Get authMeData from localStorage as fallback
      if (storesList.length === 0) {
        try {
          const authMeData = localStorage.getItem("authMeData");
          if (authMeData) {
            const parsed = JSON.parse(authMeData);
            storesList = parsed.assignedStores || [];
          }
        } catch (e) {
          console.error("Error parsing authMeData:", e);
        }
      }

      // If no stores from user data, fetch from API (for admin/super admin)
      if (storesList.length === 0) {
        try {
          const response = await axiosAPI.get("/auth/available-stores");
          const data = response.data;

          if (data.success && Array.isArray(data.data)) {
            storesList = data.data;
          } else if (Array.isArray(data.stores)) {
            storesList = data.stores;
          } else if (Array.isArray(data)) {
            storesList = data;
          }
        } catch (err) {
          console.error("Error fetching stores:", err);
          setError("Failed to load stores");
          setStoresCount(0);
          setLoading(false);
          return;
        }
      }

      setStoresCount(storesList.length);
    } catch (err) {
      console.error("Error loading stores count:", err);
      setError("Failed to load stores");
      setStoresCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Listen for store change events
  useEffect(() => {
    const handleStoreChange = (event) => {
      // If it's a custom event, use the event detail
      if (event && event.detail && event.detail.store) {
        setCurrentStore(event.detail.store);
        return;
      }

      // Otherwise, read from localStorage
      const selectedStoreData = localStorage.getItem("selectedStore");
      if (selectedStoreData) {
        try {
          const store = JSON.parse(selectedStoreData);
          setCurrentStore(store);
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }
    };

    // Listen for custom store change events (same window)
    window.addEventListener("storeChanged", handleStoreChange);
    // Listen for storage events (other windows/tabs)
    window.addEventListener("storage", handleStoreChange);

    // Also check localStorage on mount
    handleStoreChange();

    return () => {
      window.removeEventListener("storeChanged", handleStoreChange);
      window.removeEventListener("storage", handleStoreChange);
    };
  }, []);

  const handleStoreClick = () => {
    // Navigate to the /store-selector route
    navigate("/store-selector");
  };

  // Don't show if user doesn't have required role
  if (!hasRequiredRole) {
    return null;
  }

  // Don't show if user has only one or zero stores
  // Decide visibility based on role + store count
  const shouldShowSwitcher =
    // Store Manager & Store Employee: show even with 1 store
    ((isStoreManager(user) || isStoreEmployee(user)) && storesCount >= 1) ||
    // Admin / Super Admin / Division Head: only if multiple stores
    ((isAdmin(user) || isSuperAdmin(user) || isDivisionHead(user)) &&
      storesCount > 1);

  if (!shouldShowSwitcher) {
    return null;
  }

  return (
    <div className={styles.container}>
      {error && (
        <div
          className="alert alert-danger"
          style={{ marginBottom: "10px", fontSize: "12px" }}
        >
          {error}
          <button
            onClick={() => {
              setError(null);
              fetchStoresCount().catch((err) => {
                console.error("Failed to reload stores:", err);
                setError("Failed to reload stores");
              });
            }}
            style={{ marginLeft: "10px", padding: "2px 8px", fontSize: "10px" }}
          >
            Retry
          </button>
        </div>
      )}
      <div className={styles.selector}>
        <div
          className={styles.storeDisplay}
          onClick={handleStoreClick}
          style={{ cursor: "pointer" }}
        >
          <span className={styles.storeName}>
            {loading ? "Loading..." : currentStore?.name || "Select Store"}
          </span>
          <button
            className={styles.backArrowButton}
            onClick={(e) => {
              e.stopPropagation(); // Prevent double navigation
              handleStoreClick();
            }}
            disabled={loading}
          >
            <span className={styles.backArrow}>←</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreSwitcher;
