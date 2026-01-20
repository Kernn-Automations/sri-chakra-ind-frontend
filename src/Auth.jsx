import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [islogin, setIslogin] = useState(
    localStorage.getItem("accessToken") ? true : false
  );

  let token = localStorage.getItem("accessToken") || null;
  let reftoken = localStorage.getItem("refreshToken") || null;

  const VITE_API = import.meta.env.VITE_API_URL;
  const BASE_URL = VITE_API || 'http://localhost:8080';

  // API Initialization
  const api = axios.create({
    baseURL: VITE_API,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const formApi = axios.create({
    baseURL: VITE_API,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const getPdf = axios.create({
    baseURL: VITE_API,
    headers: {
      "Content-Type": "Application/pdf",
    },
    responseType: "blob",
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Automatically add division parameters to all requests
    // Skip division params for auth endpoints, public endpoints, and supervisors endpoint
    const skipDivisionParams = 
      config.url?.includes('/auth/') || 
      config.url?.includes('/stores/dropdowns/electricity-distributors') ||
      config.url?.includes('/public/') ||
      config.url?.includes('/employees/supervisors/');
    
    if (!skipDivisionParams) {
      try {
        const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (selectedDivision) {
          const divisionId = selectedDivision.id;
          const isAllDivisions = selectedDivision.isAllDivisions === true || divisionId === "all";
          
          // Check if user has restricted roles (Business Officer, Warehouse Manager, etc.)
          let hasRestrictedRole = false;
          if (user && user.roles && Array.isArray(user.roles)) {
            hasRestrictedRole = user.roles.some(role => {
              const roleName = typeof role === 'string' 
                ? role.toLowerCase() 
                : (role.name || role.role || String(role)).toLowerCase();
              return roleName.includes("business officer") || 
                     roleName.includes("business office") ||
                     roleName.includes("warehouse manager") ||
                     roleName.includes("area business manager");
            });
          }
          
          // For restricted roles, always use divisionId, never showAllDivisions
          if (hasRestrictedRole) {
            if (divisionId && divisionId !== "all") {
              // Add divisionId to params if not already present
              if (!config.params) config.params = {};
              if (!config.params.divisionId) {
                config.params.divisionId = divisionId;
              }
            }
          } else {
            // For non-restricted roles
            if (isAllDivisions) {
              // Add divisionId=all or showAllDivisions=true
              if (!config.params) config.params = {};
              if (!config.params.divisionId && !config.params.showAllDivisions) {
                config.params.divisionId = 'all';
                // Alternative: config.params.showAllDivisions = 'true';
              }
            } else if (divisionId && divisionId !== "all") {
              // Add divisionId to params if not already present
              if (!config.params) config.params = {};
              if (!config.params.divisionId) {
                config.params.divisionId = divisionId;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error adding division parameters to request:", error);
        // Continue with request even if division parsing fails
      }
    }
    
    return config;
  });

  getPdf.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Automatically add division parameters to all requests
    try {
      const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (selectedDivision) {
        const divisionId = selectedDivision.id;
        const isAllDivisions = selectedDivision.isAllDivisions === true || divisionId === "all";
        
        // Check if user has restricted roles
        let hasRestrictedRole = false;
        if (user && user.roles && Array.isArray(user.roles)) {
          hasRestrictedRole = user.roles.some(role => {
            const roleName = typeof role === 'string' 
              ? role.toLowerCase() 
              : (role.name || role.role || String(role)).toLowerCase();
            return roleName.includes("business officer") || 
                   roleName.includes("business office") ||
                   roleName.includes("warehouse manager") ||
                   roleName.includes("area business manager");
          });
        }
        
        // For restricted roles, always use divisionId
        if (hasRestrictedRole) {
          if (divisionId && divisionId !== "all") {
            if (!config.params) config.params = {};
            if (!config.params.divisionId) {
              config.params.divisionId = divisionId;
            }
          }
        } else {
          // For non-restricted roles
          if (isAllDivisions) {
            if (!config.params) config.params = {};
            if (!config.params.showAllDivisions && !config.params.divisionId) {
              config.params.showAllDivisions = 'true';
            }
          } else if (divisionId && divisionId !== "all") {
            if (!config.params) config.params = {};
            if (!config.params.divisionId) {
              config.params.divisionId = divisionId;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error adding division parameters to getPdf request:", error);
    }
    
    return config;
  });

  formApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Automatically add division parameters to all requests
    try {
      const selectedDivision = JSON.parse(localStorage.getItem("selectedDivision"));
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (selectedDivision) {
        const divisionId = selectedDivision.id;
        const isAllDivisions = selectedDivision.isAllDivisions === true || divisionId === "all";
        
        // Check if user has restricted roles
        let hasRestrictedRole = false;
        if (user && user.roles && Array.isArray(user.roles)) {
          hasRestrictedRole = user.roles.some(role => {
            const roleName = typeof role === 'string' 
              ? role.toLowerCase() 
              : (role.name || role.role || String(role)).toLowerCase();
            return roleName.includes("business officer") || 
                   roleName.includes("business office") ||
                   roleName.includes("warehouse manager") ||
                   roleName.includes("area business manager");
          });
        }
        
        // For restricted roles, always use divisionId
        if (hasRestrictedRole) {
          if (divisionId && divisionId !== "all") {
            if (!config.params) config.params = {};
            if (!config.params.divisionId) {
              config.params.divisionId = divisionId;
            }
          }
        } else {
          // For non-restricted roles
          if (isAllDivisions) {
            if (!config.params) config.params = {};
            if (!config.params.showAllDivisions && !config.params.divisionId) {
              config.params.showAllDivisions = 'true';
            }
          } else if (divisionId && divisionId !== "all") {
            if (!config.params) config.params = {};
            if (!config.params.divisionId) {
              config.params.divisionId = divisionId;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error adding division parameters to formApi request:", error);
    }
    
    return config;
  });

  // Define removeLogin before interceptors so it can be used in them
  const removeLogin = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedDivision");
    localStorage.removeItem("showDivisions");
    setIslogin(false);
    token = null;
    reftoken = null;
  };

  // Helper function to check if error is token-related
  const isTokenError = (error) => {
    if (!error?.response) return false;
    
    const status = error.response.status;
    const errorData = error.response.data || {};
    const errorMessage = (errorData.message || errorData.error || '').toString().toLowerCase();
    
    // Check for 401 status or token-related error messages
    if (status === 401) return true;
    
    return (
      errorMessage.includes('invalid or expired token') ||
      errorMessage.includes('authentication failed') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('token may be expired') ||
      errorMessage.includes('token expired') ||
      errorMessage.includes('expired token') ||
      errorMessage.includes('invalid token') ||
      errorMessage.includes('please log in again') ||
      errorMessage.includes('please login again') ||
      errorData.errorCode === 'TOKEN_EXPIRED' ||
      errorData.errorCode === 'TOKEN_INVALID' ||
      errorData.error === 'TOKEN_MISSING'
    );
  };

  // Response interceptor for api instance - handles token errors globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isTokenError(error)) {
        console.log('Token-related error detected in API response, automatically logging out...');
        removeLogin();
        // Optionally redirect to login page
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor for formApi instance
  formApi.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isTokenError(error)) {
        console.log('Token-related error detected in FormAPI response, automatically logging out...');
        removeLogin();
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor for getPdf instance
  getPdf.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isTokenError(error)) {
        console.log('Token-related error detected in PDF API response, automatically logging out...');
        removeLogin();
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
      return Promise.reject(error);
    }
  );

  const axiosAPI = {
    get: (url, params = {}) => api.get(url, { params }),
    post: (url, data) => api.post(url, data),
    put: (url, data) => api.put(url, data),
    delete: (url) => api.delete(url),
    formData: (url, formdata) => formApi.post(url, formdata),
    getpdf: (url, params = {}) => getPdf.get(url, { params }),
  };

  // Remove the old useEffect - we now use startRefreshCycle() when tokens are saved

  const saveToken = (newToken) => {
    localStorage.setItem("accessToken", newToken);
    token = newToken;
    setIslogin(true);
  };

  const saveRefreshToken = (refToken) => {
    localStorage.setItem("refreshToken", refToken);
    reftoken = refToken;
  };

  // Function to save both tokens and start refresh cycle
  const saveTokens = (accessToken, refreshToken) => {
    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      token = accessToken;
      reftoken = refreshToken;
      setIslogin(true);

      // Start the refresh cycle
      console.log("Tokens saved, starting refresh cycle");
      startRefreshCycle();
    }
  };

  // Function to start the refresh cycle
  const startRefreshCycle = () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      console.log("Starting token refresh cycle");

      // Set up periodic refresh
      const interval = setInterval(
        async () => {
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
              console.log("No refresh token found, stopping refresh cycle");
              clearInterval(interval);
              return;
            }

            const response = await axios.post(`${VITE_API}/auth/refresh`, {
              refreshToken: refreshToken,
            });

            console.log("Token refresh successful");
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            token = response.data.accessToken;
            reftoken = response.data.refreshToken;
          } catch (error) {
            console.error("Token refresh failed:", error);
            clearInterval(interval);
            removeLogin();
          }
        },
        5 * 60 * 1000 // Refresh every 5 minutes
      );
    }
  };
  const removeToken = async () => {
    try {
      const res = await axios.post(`${VITE_API}/api/v1/logout`, config);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      token = null;
      // setToken(null)
      setIslogin(false);
    } catch (e) {
      // console.log(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        saveToken,
        removeToken,
        saveRefreshToken,
        saveTokens,
        removeLogin,
        islogin,
        setIslogin,
        axiosAPI,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
