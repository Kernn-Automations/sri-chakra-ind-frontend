// src/utils/divisionUtils.js

/**
 * Division mapping for consistent ID handling across the application
 */
export const DIVISION_MAPPING = {
  "Maharastra": 2,
  "Telangana": 11,
  "Pune": 12,
  "All Divisions": "all"
};

/**
 * Get division ID from division name
 * @param {string} divisionName - The name of the division
 * @returns {string|number|null} - The division ID or null if not found
 */
export const getDivisionId = (divisionName) => {
  return DIVISION_MAPPING[divisionName] || null;
};

/**
 * Get division name from division ID
 * @param {string|number} divisionId - The division ID
 * @returns {string|null} - The division name or null if not found
 */
export const getDivisionName = (divisionId) => {
  const entries = Object.entries(DIVISION_MAPPING);
  const found = entries.find(([name, id]) => id === divisionId);
  return found ? found[0] : null;
};

/**
 * Check if a division ID represents "All Divisions"
 * @param {string|number} divisionId - The division ID to check
 * @returns {boolean} - True if it's "All Divisions"
 */
export const isAllDivisions = (divisionId) => {
  return divisionId === "all" || divisionId === 1;
};

/**
 * Build API URL with division parameters
 * @param {string} baseUrl - The base API URL
 * @param {string} endpoint - The API endpoint
 * @param {string|number} divisionId - The division ID
 * @returns {string} - The complete URL with division parameters
 */
export const buildDivisionUrl = (baseUrl, endpoint, divisionId) => {
  let url = `${baseUrl}${endpoint}`;
  
  if (isAllDivisions(divisionId)) {
    url += "?showAllDivisions=true";
  } else if (divisionId && divisionId !== "all") {
    url += `?divisionId=${divisionId}`;
  }
  
  return url;
};

/**
 * Get division display name with proper formatting
 * @param {Object} division - The division object
 * @returns {string} - The formatted display name
 */
export const getDivisionDisplayName = (division) => {
  if (!division) return "Select Division";
  
  if (division.isAllDivisions || division.id === "all") {
    return "All Divisions";
  }
  
  return division.name || "Unknown Division";
};

/**
 * Validate division data structure
 * @param {Object} division - The division object to validate
 * @returns {boolean} - True if valid
 */
export const isValidDivision = (division) => {
  if (!division) return false;
  
  // Handle "All Divisions" case
  if (division.isAllDivisions || division.id === "all") {
    return true;
  }
  
  // Handle regular divisions
  return typeof division.id === 'number' && 
         typeof division.name === 'string' &&
         division.id > 0;
};

/**
 * Check if user has admin access to view all divisions
 * @param {Object} user - The user object
 * @returns {boolean} - True if user can access all divisions
 */
export const canAccessAllDivisions = (user) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  
  // Import role checking functions
  const normalizeRoleName = (role) => {
    if (!role) return "";
    if (typeof role === "string") return role.toLowerCase();
    if (typeof role === "object") {
      const name = role.name || role.role || String(role);
      return (name || "").toLowerCase();
    }
    return String(role).toLowerCase();
  };
  
  // Check for admin roles
  const hasAdminRole = user.roles.some(role => {
    const roleName = normalizeRoleName(role);
    return roleName === "admin" || roleName === "super admin" || roleName === "super_admin" || roleName === "superadmin";
         });
  
  // Exclude Business Officer, Warehouse Manager, Area Business Manager from All Divisions access
  const hasRestrictedRole = user.roles.some(role => {
    const roleName = normalizeRoleName(role);
    return roleName.includes("business officer") || 
           roleName.includes("business office") ||
           roleName.includes("warehouse manager") ||
           roleName.includes("area business manager");
  });
  
  // Only admins without restricted roles can access all divisions
  return hasAdminRole && !hasRestrictedRole;
};

/**
 * Get API parameters for division filtering
 * @param {string|number} divisionId - The division ID
 * @param {Object} user - Optional user object to check for restricted roles
 * @returns {Object} - Object with appropriate API parameters
 */
export const getDivisionApiParams = (divisionId, user = null) => {
  // If user is provided, check if they have restricted roles (Business Officer, etc.)
  // Restricted roles should NEVER use showAllDivisions, even if divisionId is "all"
  if (user && user.roles && Array.isArray(user.roles)) {
    const normalizeRoleName = (role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toLowerCase();
      if (typeof role === "object") {
        const name = role.name || role.role || String(role);
        return (name || "").toLowerCase();
      }
      return String(role).toLowerCase();
    };
    
    const hasRestrictedRole = user.roles.some(role => {
      const roleName = normalizeRoleName(role);
      return roleName.includes("business officer") || 
             roleName.includes("business office") ||
             roleName.includes("warehouse manager") ||
             roleName.includes("area business manager");
    });
    
    // For restricted roles, always use divisionId, never showAllDivisions
    if (hasRestrictedRole) {
      if (divisionId && divisionId !== "all" && !isAllDivisions(divisionId)) {
        return { divisionId: divisionId };
      }
      // If divisionId is "all" or invalid for restricted role, return empty (should not happen)
      console.warn('getDivisionApiParams - Restricted role user with invalid divisionId:', divisionId);
      return {};
    }
  }
  
  // For non-restricted roles, use normal logic
  if (isAllDivisions(divisionId)) {
    return { showAllDivisions: 'true' };
  } else if (divisionId && divisionId !== "all") {
    return { divisionId: divisionId };
  }
  return {};
};

/**
 * Get current division from localStorage
 * @returns {Object|null} - The current division object or null
 */
export const getCurrentDivision = () => {
  try {
    const divisionData = localStorage.getItem("selectedDivision");
    return divisionData ? JSON.parse(divisionData) : null;
  } catch (error) {
    console.error("Error parsing division data:", error);
    return null;
  }
};

/**
 * Check if user has restricted role that should never use showAllDivisions
 * @param {Object} user - User object (optional, will get from storage if not provided)
 * @returns {boolean} - True if user has restricted role
 */
export const hasRestrictedRole = (user = null) => {
  try {
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser || !currentUser.roles || !Array.isArray(currentUser.roles)) {
      return false;
    }
    
    const normalizeRoleName = (role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toLowerCase();
      if (typeof role === "object") {
        const name = role.name || role.role || String(role);
        return (name || "").toLowerCase();
      }
      return String(role).toLowerCase();
    };
    
    return currentUser.roles.some(role => {
      const roleName = normalizeRoleName(role);
      return roleName.includes("business officer") || 
             roleName.includes("business office") ||
             roleName.includes("warehouse manager") ||
             roleName.includes("area business manager");
    });
  } catch (error) {
    console.error("Error checking restricted role:", error);
    return false;
  }
};

/**
 * Get division parameter for API calls - ensures restricted roles always use divisionId
 * @param {string|number} divisionId - The division ID
 * @param {boolean} showAllDivisions - Current showAllDivisions state
 * @param {Object} user - Optional user object
 * @returns {Object} - Object with divisionId or showAllDivisions parameter
 */
export const getDivisionParam = (divisionId, showAllDivisions = false, user = null) => {
  const isRestricted = hasRestrictedRole(user);
  
  // Restricted roles should NEVER use showAllDivisions, always use divisionId
  if (isRestricted) {
    if (divisionId && divisionId !== "all" && !isAllDivisions(divisionId)) {
      return { divisionId: divisionId };
    } else {
      console.warn('getDivisionParam - Restricted role user with invalid divisionId:', divisionId);
      // Try to get division from localStorage
      const currentDivision = getCurrentDivision();
      if (currentDivision && currentDivision.id && currentDivision.id !== "all") {
        return { divisionId: currentDivision.id };
      }
      return {};
    }
  }
  
  // Non-restricted roles use normal logic
  if (showAllDivisions || isAllDivisions(divisionId)) {
    return { showAllDivisions: 'true' };
  } else if (divisionId && divisionId !== "all") {
    return { divisionId: divisionId };
  }
  
  return {};
};

/**
 * Check if current division is "All Divisions"
 * @returns {boolean} - True if current division is "All Divisions"
 */
export const isCurrentDivisionAll = () => {
  const currentDivision = getCurrentDivision();
  return currentDivision && isAllDivisions(currentDivision.id);
};
