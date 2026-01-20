// Simple token management
export const storeTokens = (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    console.error('❌ Cannot store null/undefined tokens');
    return false;
  }
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenTimestamp', Date.now().toString());
    console.log('✅ Tokens stored successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to store tokens:', error);
    return false;
  }
};

export const getTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  // Check for null/undefined values
  if (!accessToken || accessToken === 'null' || accessToken === 'undefined') {
    console.warn('⚠️ Access token is null/undefined');
    return { accessToken: null, refreshToken: null };
  }
  if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
    console.warn('⚠️ Refresh token is null/undefined');
    return { accessToken: null, refreshToken: null };
  }
  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenTimestamp');
  console.log('🗑️ Tokens cleared');
};

export const isAuthenticated = () => {
  const { accessToken, refreshToken } = getTokens();
  return !!(accessToken && refreshToken);
};
