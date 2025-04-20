# HTTP Client Standards: Ky

## Overview

This document outlines the standards for using [Ky](https://github.com/sindresorhus/ky) as the primary HTTP client in the E-Car admin web application. Ky is a tiny and elegant HTTP client based on the browser's Fetch API, offering a more modern alternative to Axios with better TypeScript support and improved Promise handling.

## Why Ky?

- **Lightweight**: ~7KB compared to Axios's much larger size
- **Modern**: Uses the browser's Fetch API under the hood
- **Excellent TypeScript support**: First-class TypeScript support with accurate typings
- **Better promise handling**: Uses standard Promise chain patterns
- **Simpler API**: Clear, intuitive API without unnecessary complexity
- **Built-in retry and timeout handling**: Automatic retry capabilities for failed requests
- **Active development**: Regularly maintained and updated

## Installation

```bash
npm install ky
```

## Basic Configuration

All Ky instances should be configured with these default options:

```typescript
import ky from 'ky';

// Base instance configuration
const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  credentials: 'include', // For CORS with credentials
  headers: {
    'Content-Type': 'application/json'
  },
  hooks: {
    // Global hooks can be defined here
  }
});
```

## Authentication Configuration

For authenticated requests, we use a wrapper that handles token management:

```typescript
import ky from 'ky';

// Create the authenticated instance
const createAuthInstance = (token: string | null) => {
  return ky.create({
    prefixUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 10000,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    hooks: {
      beforeRequest: [
        request => {
          const currentToken = localStorage.getItem('authToken');
          if (currentToken) {
            request.headers.set('Authorization', `Bearer ${currentToken}`);
          }
        }
      ],
      afterResponse: [
        async (request, options, response) => {
          // Handle 401 Unauthorized
          if (response.status === 401) {
            // Try to refresh token
            try {
              const newToken = await refreshToken();
              
              if (newToken) {
                // Clone the request and update the Authorization header
                const updatedRequest = request.clone();
                updatedRequest.headers.set('Authorization', `Bearer ${newToken}`);
                
                // Retry with the new token
                return ky(updatedRequest);
              }
            } catch (error) {
              // Handle refresh failure (usually logout)
              logout();
              throw error;
            }
          }
          
          return response;
        }
      ]
    }
  });
};
```

## Usage in Components

In React components, use the `useAuth` hook to access the authenticated client:

```typescript
const { authClient } = useAuth();

// GET request
const fetchData = async () => {
  try {
    const data = await authClient.get('api/v1/vehicles').json();
    return data;
  } catch (error) {
    handleError(error);
  }
};

// POST request
const createItem = async (data) => {
  try {
    const response = await authClient.post('api/v1/vehicles', {
      json: data
    }).json();
    return response;
  } catch (error) {
    handleError(error);
  }
};
```

## Error Handling

All API calls should use proper error handling:

```typescript
try {
  const data = await authClient.get('api/v1/vehicles').json();
  // Handle success
} catch (error) {
  if (error instanceof ky.HTTPError) {
    // Handle HTTP errors (4xx, 5xx)
    const errorBody = await error.response.json();
    console.error('API Error:', errorBody);
    // Show appropriate error message
  } else {
    // Handle network errors, timeouts, etc.
    console.error('Network Error:', error);
    // Show generic error message
  }
}
```

## Implementing Authentication Provider with Ky

The AuthProvider component should be updated to use Ky:

```typescript
// Inside AuthProvider.tsx
import ky from 'ky';
import { useState, useEffect, useMemo, useRef } from 'react';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const tokenRef = useRef(token);
  
  // Update ref when token changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  
  // Create a stable instance of the auth client
  const authClient = useMemo(() => {
    return ky.create({
      prefixUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 10000,
      credentials: 'include',
      hooks: {
        beforeRequest: [
          request => {
            const currentToken = tokenRef.current;
            if (currentToken) {
              request.headers.set('Authorization', `Bearer ${currentToken}`);
            }
          }
        ],
        afterResponse: [
          async (request, options, response) => {
            if (response.status === 401) {
              // Token refresh logic
              // ...
            }
            return response;
          }
        ]
      }
    });
  }, []);
  
  // Other authentication logic...
  
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    authClient,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Migration Guide

When migrating from Axios to Ky, update requests using this pattern:

### Axios (old)
```typescript
// GET
const response = await authAxios.get('/api/v1/endpoint');
const data = response.data;

// POST
const response = await authAxios.post('/api/v1/endpoint', { key: 'value' });
const data = response.data;
```

### Ky (new)
```typescript
// GET
const data = await authClient.get('api/v1/endpoint').json();

// POST
const data = await authClient.post('api/v1/endpoint', { 
  json: { key: 'value' } 
}).json();
```

## Standards to Follow

1. **Always use the authenticated client** from the auth context
2. **Always parse responses** with the appropriate method (`.json()`, `.text()`, etc.)
3. **Implement proper error handling** for all API calls
4. **Use relative URLs** without the leading slash
5. **Set appropriate timeout values** for long-running operations
6. **Include proper error handling** with user-friendly messages
7. **Use async/await** syntax for better code readability

## Testing

When writing tests, use the [ky-universal](https://github.com/sindresorhus/ky-universal) package which works in both Node.js and browser environments.

## Making API Requests with Ky

When making API requests with the `authAxios` client, follow these patterns:

### Important: API Path Format

When using Ky with `prefixUrl` configuration, **do not include leading slashes** in your API paths:

```typescript
// ❌ INCORRECT - Leading slash will cause issues with prefixUrl
const response = await authAxios.get('/api/v1/endpoint');

// ✅ CORRECT - No leading slash
const response = await authAxios.get('api/v1/endpoint');
```

### Basic GET Request
```typescript
// Fetch data
const response = await authAxios.get('api/v1/endpoint');
const data = await response.json();
```

### POST Request with JSON Body
```typescript
// Create or update resource
const response = await authAxios.post('api/v1/endpoint', { 
  json: { key: 'value' }
});
const result = await response.json();
``` 