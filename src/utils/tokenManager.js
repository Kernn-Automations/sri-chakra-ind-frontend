// Token Management Utility
class TokenManager {
  constructor() {
    this.ACCESS_TOKEN_KEY = 'accessToken';
    this.REFRESH_TOKEN_KEY = 'refreshToken';
  }

  // Store both tokens
  storeTokens(accessToken, refreshToken) {
    if (!accessToken || !refreshToken) {
      console.error('❌ Cannot store null/undefined tokens');
      return false;
    }
    
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      console.log('✅ Both tokens stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
      return false;
    }
  }

  // Get access token only (for Authorization header)
  getAccessToken() {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') {
      console.warn('⚠️ Access token is null/undefined');
      return null;
    }
    return token;
  }

  // Get refresh token only (for refresh requests)
  getRefreshToken() {
    const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') {
      console.warn('⚠️ Refresh token is null/undefined');
      return null;
    }
    return token;
  }

  // Get both tokens
  getTokens() {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken()
    };
  }

  // Check if user is authenticated (has both tokens)
  isAuthenticated() {
    const { accessToken, refreshToken } = this.getTokens();
    return !!(accessToken && refreshToken);
  }

  // Clear all tokens
  clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    console.log('🗑️ All tokens cleared');
  }

  // Update access token (after refresh)
  updateAccessToken(newAccessToken) {
    if (newAccessToken) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, newAccessToken);
      console.log('✅ Access token updated');
      return true;
    }
    return false;
  }

  // Update refresh token (after refresh)
  updateRefreshToken(newRefreshToken) {
    if (newRefreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, newRefreshToken);
      console.log('✅ Refresh token updated');
      return true;
    }
    return false;
  }

  // Update both tokens (after refresh)
  updateTokens(newAccessToken, newRefreshToken) {
    return this.updateAccessToken(newAccessToken) && this.updateRefreshToken(newRefreshToken);
  }

  // Get Authorization header value
  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }
}

export default new TokenManager();
