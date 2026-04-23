/**
 * Miele 3rd Party API Client
 * 
 * Handles OAuth2 authentication and API calls to the Miele Cloud Service
 */

// Miele API Status codes
export const MieleStatus = {
  OFF: 1,
  ON: 2,
  PROGRAMMED: 3,
  PROGRAMMED_WAITING_TO_START: 4,
  RUNNING: 5,
  PAUSE: 6,
  END_PROGRAMMED: 7,
  FAILURE: 8,
  PROGRAMME_INTERRUPTED: 9,
  IDLE: 10,
  RINSE_HOLD: 11,
  SERVICE: 12,
  SUPERFREEZING: 13,
  SUPERCOOLING: 14,
  SUPERHEATING: 15,
  SUPERCOOLING_SUPERFREEZING: 146,
  NOT_CONNECTED: 255,
};

export class MieleClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.username = config.username;
    this.password = config.password;
    this.vg = config.vg || 'en-US';
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // New OAuth2 endpoints (recommended by Miele)
    this.authUrl = 'https://api.mcs3.miele.com/thirdparty/token';
    this.apiBaseUrl = 'https://api.mcs3.miele.com/v1';
  }
  
  /**
   * Authenticate with Miele API using Resource Owner Password Credentials flow
   */
  async authenticate() {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: this.username,
      password: this.password,
      vg: this.vg,
    });
    
    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return data;
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });
    
    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      // If refresh fails, try full re-authentication
      return this.authenticate();
    }
    
    const data = await response.json();
    
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return data;
  }
  
  /**
   * Ensure we have a valid access token
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      await this.authenticate();
      return;
    }
    
    // Refresh if token expires in less than 5 minutes
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 300000) {
      await this.refreshAccessToken();
    }
  }
  
  /**
   * Make an authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    await this.ensureValidToken();
    
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      'Accept-Language': this.vg,
      ...options.headers,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get all devices associated with the account
   */
  async getDevices() {
    return this.apiRequest('/devices');
  }
  
  /**
   * Get state of a specific device
   */
  async getDeviceState(deviceId) {
    return this.apiRequest(`/devices/${deviceId}/state`);
  }
  
  /**
   * Get identification info for a specific device
   */
  async getDeviceIdent(deviceId) {
    return this.apiRequest(`/devices/${deviceId}/ident`);
  }
  
  /**
   * Get available actions for a specific device
   */
  async getDeviceActions(deviceId) {
    return this.apiRequest(`/devices/${deviceId}/actions`);
  }
}
