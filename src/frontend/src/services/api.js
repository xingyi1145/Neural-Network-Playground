import axios from 'axios';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check if error is retryable (network errors, not server errors)
const isRetryableError = (error) => {
  // Retry on network errors (no response received)
  if (!error.response) return true;
  // Retry on 502, 503, 504 (gateway/service unavailable)
  if ([502, 503, 504].includes(error.response.status)) return true;
  return false;
};

// Request interceptor (optional - for adding auth tokens, etc.)
api.interceptors.request.use(
  (config) => {
    // Initialize retry count
    config.__retryCount = config.__retryCount || 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic for connection errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Retry logic for network errors (e.g., backend not ready yet)
    if (isRetryableError(error) && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.log(`[API] Retry ${config.__retryCount}/${MAX_RETRIES} for ${config.url} after connection error`);
      
      // Exponential backoff
      await delay(RETRY_DELAY_MS * config.__retryCount);
      
      return api(config);
    }

    // Handle common errors here
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: Backend may not be running');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

