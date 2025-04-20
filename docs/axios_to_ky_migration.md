# Migrating from Axios to Ky

This guide provides instructions for migrating components from using Axios to Ky for making HTTP requests in our application.

## Overview

We are transitioning from Axios to Ky for HTTP requests across the application. Ky offers several advantages:

- Modern, simpler interface with a more intuitive API
- Lighter footprint (smaller bundle size)
- Better TypeScript support
- Improved response handling with async/await
- Better promise handling with retry capabilities

## ⚠️ CRITICAL: API Path Format

When using Ky with `prefixUrl` configuration, **do not include leading slashes** in your API paths:

```javascript
// ❌ INCORRECT - Leading slash will cause issues with prefixUrl
const response = await authAxios.get('/api/v1/endpoint');

// ✅ CORRECT - No leading slash
const response = await authAxios.get('api/v1/endpoint');
```

This is the most common migration issue. All API paths must be updated to remove leading slashes.

## Required Modifications

When migrating from Axios to Ky, you'll need to make the following changes to your code:

### 1. Import Statements

No changes needed to your imports. Continue to import `useAuth` as before:

```javascript
import { useAuth } from "@/context/AuthContext";
```

### 2. Component Setup

Instead of extracting `token` from `useAuth()`, extract `authAxios`:

```javascript
// Old approach with Axios
const { token } = useAuth();

// New approach with Ky
const { authAxios } = useAuth();
```

### 3. GET Requests

Change from Axios format to Ky format:

```javascript
// Old approach with Axios
try {
  const response = await axios.get(`${API_URL}/endpoint`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = response.data;
} catch (error) {
  // Handle error
}

// New approach with Ky
try {
  const data = await authAxios.get('api/v1/endpoint').json();
} catch (error) {
  // Handle error (see error handling section below)
}
```

### 4. POST Requests

```javascript
// Old approach with Axios
try {
  const response = await axios.post(
    `${API_URL}/endpoint`, 
    payload,
    { headers: { Authorization: `Bearer ${token}` }}
  );
  const data = response.data;
} catch (error) {
  // Handle error
}

// New approach with Ky
try {
  const data = await authAxios.post('api/v1/endpoint', {
    json: payload // Note the json property wrapper
  }).json();
} catch (error) {
  // Handle error
}
```

## Error Handling

Ky error handling is slightly different from Axios:

```javascript
// Error handling with Ky
try {
  const data = await authAxios.get('api/v1/endpoint').json();
} catch (error) {
  if (error.name === 'HTTPError') {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Server error:', error.message);
    
    // Get the error response body if needed
    const errorData = await error.response.json();
    console.error('Error details:', errorData);
  } else {
    // Network error, timeout, or other issue
    console.error('Request failed:', error.message);
  }
}
```

## Complete Examples

### Example 1: Fetching Data

```javascript
// Component using Ky for data fetching
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export function DataList() {
  const { authAxios } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await authAxios.get('api/v1/items').json();
        setData(result);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [authAxios]);
  
  // Rest of component...
}
```

### Example 2: Form Submission

```javascript
// Form component using Ky for submission
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export function SubmitForm() {
  const { authAxios } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await authAxios.post('api/v1/items', {
        json: formData
      }).json();
      
      console.log('Success:', result);
      // Handle success
    } catch (error) {
      console.error('Error:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rest of component...
}
```

## Additional Resources

- [Ky Documentation](https://github.com/sindresorhus/ky)
- [Internal Standards Documentation](../docs/http_client_standards.md)

If you encounter any issues during migration, please contact the team lead or open a ticket in our issue tracker. 