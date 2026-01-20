// src/utils/fetchWithDivision.js

/**
 * Fetches data from your API, automatically applying the selected division filter.
 *
 * @param {string}          endpoint      The API path (e.g. "/employees").
 * @param {string}          token         The JWT access token.
 * @param {number|string}   divisionId    The selected division ID, or "all".
 * @param {boolean}         showAll       If true, fetch across all divisions.
 *
 * @returns {Promise<any>}  The parsed JSON response.
 */
export const fetchWithDivision = async (
  endpoint,
  token,
  divisionId,
  showAll,
  options = {}
) => {
  console.log(`[fetchWithDivision] Called with:`, {
    endpoint,
    divisionId,
    showAll,
    token: token ? 'present' : 'missing',
    options
  });
  
  // 1) build the base URL
  let url = import.meta.env.VITE_API_URL + endpoint;

  // 2) append the right query parameters
  if (showAll || divisionId === "all") {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}showAllDivisions=true`;
    console.log(`[fetchWithDivision] Building URL with showAllDivisions=true (divisionId: ${divisionId})`);
  } else if (divisionId && divisionId !== "all") {
    // Use query parameter style for better compatibility
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}divisionId=${divisionId}`;
    console.log(`[fetchWithDivision] Building URL with divisionId: ${divisionId} (type: ${typeof divisionId})`);
  }
  
  console.log(`[fetchWithDivision] Final URL: ${url}`);
  
  // 3) prepare headers
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers
  };

  // 4) Note: Custom headers removed to avoid CORS issues
  // Division context is now handled via query parameters only
  // The backend should extract division info from the JWT token or query params

  console.log(`[fetchWithDivision] Request details:`, {
    method: options.method || 'GET',
    headers: {
      ...headers,
      Authorization: `Bearer ${token ? 'present' : 'missing'}`
    },
    divisionId,
    showAll,
    note: 'Division context handled via query parameters to avoid CORS issues'
  });

  // 5) do the fetch
  console.log(`[fetchWithDivision] Executing fetch to: ${url}`);
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
  console.log(`[fetchWithDivision] Response status: ${response.status}`);

  // 6) error‐throwing
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[fetchWithDivision] ${response.status} ${url}`, text);
    throw new Error(`Error ${response.status} fetching ${url}: ${text}`);
  }

  // 7) parse and return
  const result = await response.json();
  console.log(`[fetchWithDivision] Successfully parsed response for ${endpoint}`);
  
  // IMMEDIATE DEBUG for eligible sales orders
  if (endpoint.includes('eligible-sales-orders')) {
    console.log('🚨 IMMEDIATE DEBUG - fetchWithDivision result:', result);
    console.log('🚨 IMMEDIATE DEBUG - result keys:', Object.keys(result));
    console.log('🚨 IMMEDIATE DEBUG - result.salesOrders:', result.salesOrders);
    console.log('🚨 IMMEDIATE DEBUG - result.salesOrders length:', result.salesOrders?.length);
  }
  
  // Debug logging for eligible sales orders
  if (endpoint.includes('eligible-sales-orders')) {
    console.log(`[fetchWithDivision] Eligible sales orders response:`, {
      success: result.success,
      message: result.message,
      dataType: typeof result.data,
      dataKeys: result.data ? Object.keys(result.data) : 'no data',
      salesOrdersCount: result.salesOrders?.length || result.data?.salesOrders?.length || 0,
      sampleOrder: (result.salesOrders?.[0] || result.data?.salesOrders?.[0]) ? {
        id: (result.salesOrders?.[0] || result.data?.salesOrders?.[0]).id,
        orderNumber: (result.salesOrders?.[0] || result.data?.salesOrders?.[0]).orderNumber,
        status: (result.salesOrders?.[0] || result.data?.salesOrders?.[0]).orderStatus
      } : 'no orders'
    });
    
    // CRITICAL: Log the complete response structure
    console.log(`[fetchWithDivision] COMPLETE RESPONSE:`, result);
    console.log(`[fetchWithDivision] RESPONSE KEYS:`, Object.keys(result));
    if (result.data) {
      console.log(`[fetchWithDivision] DATA KEYS:`, Object.keys(result.data));
      console.log(`[fetchWithDivision] DATA TYPE:`, typeof result.data);
      console.log(`[fetchWithDivision] IS DATA ARRAY:`, Array.isArray(result.data));
    }
  }
  
  return result;
};