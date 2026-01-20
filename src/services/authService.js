class AuthService {
  constructor() {
    // Use proxy in development, direct URL in production
    this.baseURL = import.meta.env.DEV ? '/api' : 'https://fb-backend-chandra.kernn.xyz';
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Store tokens securely
  storeTokens(accessToken, refreshToken) {
    if (!accessToken || !refreshToken) {
      console.error('Cannot store null/undefined tokens');
      return false;
    }
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenTimestamp', Date.now().toString());
    
    console.log('✅ Tokens stored successfully');
    return true;
  }

  // Retrieve tokens safely
  getTokens() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Check for null/undefined values
    if (!accessToken || accessToken === 'null' || accessToken === 'undefined') {
      console.warn('Access token is null/undefined, clearing tokens');
      this.clearTokens();
      return { accessToken: null, refreshToken: null };
    }
    
    if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
      console.warn('Refresh token is null/undefined, clearing tokens');
      this.clearTokens();
      return { accessToken: null, refreshToken: null };
    }
    
    return { accessToken, refreshToken };
  }

  // Clear tokens
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenTimestamp');
    console.log('🗑 Tokens cleared');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const { accessToken, refreshToken } = this.getTokens();
    return !!(accessToken && refreshToken);
  }

  // Get token age in minutes
  getTokenAge() {
    const timestamp = localStorage.getItem('tokenTimestamp');
    if (!timestamp) return Infinity;
    
    const age = Date.now() - parseInt(timestamp);
    return Math.floor(age / (1000 * 60)); // Convert to minutes
  }

  // Check if token is expired (assuming 2 hour expiry)
  isTokenExpired() {
    return this.getTokenAge() > 120; // 2 hours
  }
}

export default new AuthService();
