// This file intercepts all fetch requests to /api and automatically injects the 
// Firebase ID token if the user is authenticated.

declare global {
  interface Window {
    __FIREBASE_TOKEN__?: string | null;
  }
}

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    const token = window.__FIREBASE_TOKEN__;
    if (token) {
      config = config || {};
      const headers = new Headers(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
  }
  
  return originalFetch(resource, config);
};

export {};
