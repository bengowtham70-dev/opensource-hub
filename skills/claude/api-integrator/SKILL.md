---
name: api-integrator
description: Help integrate APIs into your application. Use when you need to connect to external services, set up API calls, handle authentication, or work with REST/GraphQL APIs. USE FOR: API integration, REST API, GraphQL, authentication setup, webhooks, third-party services.
---

# API Integrator

Guide for integrating external APIs into your application.

## When to Use

- Connecting to third-party services (Stripe, Auth0, etc.)
- Setting up REST or GraphQL API calls
- Implementing authentication (OAuth, API keys)
- Configuring webhooks
- Working with rate limits and error handling

## How to Use

### Step 1: Identify the API
Gather information about the target API:
- API type (REST, GraphQL, WebSocket)
- Authentication method
- Base URL and endpoints
- Rate limits
- Documentation URL

### Step 2: Research Documentation
Use web-research skill to find:
- Official API documentation
- SDK/library options
- Authentication guides
- Example code

### Step 3: Plan Integration
Create a plan covering:
1. **Authentication setup** (API keys, OAuth flow)
2. **API client creation** (wrapper/service class)
3. **Error handling strategy**
4. **Rate limit management**
5. **Data models/types**

### Step 4: Implement
Write the integration code following patterns:

```typescript
// Example: API service pattern
class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL;
    this.apiKey = process.env.API_KEY;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}
```

### Step 5: Test and Validate
- Test with sample requests
- Verify error handling
- Check rate limit behavior
- Validate data types

## Common API Patterns

### REST API
```typescript
// GET request
const data = await api.get('/users/123');

// POST request
const result = await api.post('/users', { name: 'John' });

// With query params
const filtered = await api.get('/users', { params: { role: 'admin' } });
```

### GraphQL
```typescript
const query = `
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
`;

const result = await api.graphql(query, { variables: { id: '123' } });
```

### Webhook Handler
```typescript
app.post('/webhooks/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePayment(event.data.object);
      break;
  }
  
  res.json({ received: true });
});
```

## Error Handling Best Practices

1. **Retry logic** with exponential backoff
2. **Rate limit handling** (429 responses)
3. **Timeout configuration**
4. **Graceful degradation**
5. **Logging and monitoring**
