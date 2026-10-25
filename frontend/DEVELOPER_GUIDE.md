# PromptGuard Developer Guide

Welcome to PromptGuard! This guide will help you get started with the API and integrate PromptGuard into your AI applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [API Overview](#api-overview)
- [Code Examples](#code-examples)
- [SDKs](#sdks)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Access the API Documentation

Visit the inter ACTIVE API documentation at:

```
http://localhost:3000/developer
```

This portal provides:

- Complete endpoint documentation
- Inter ACTIVE code examples in cURL, JavaScript, and Python
- Real-time API testing
- Error handling guides

### 2. Get Your API Key

First, authenticate to get your API token:

**cURL**:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"promptguard"}'
```

**JavaScript**:

```javascript
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "promptguard" }),
});
const { token } = await response.json();
console.log(token);
```

**Python**:

```python
import requests

response = requests.post('http://localhost:3000/api/auth/login',
  json={'username': 'admin', 'password': 'promptguard'}
)
token = response.json()['token']
print(token)
```

### 3. Register Your Agent

Register your AI agent with PromptGuard:

**cURL**:

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Agent",
    "type": "inference",
    "organization": "My Company",
    "description": "Production inference service"
  }'
```

**Response**:

```json
{
  "id": "ag_xyz123",
  "apiKey": "YWdfeFl6MTIz...",
  "message": "Agent registered successfully"
}
```

## Authentication

### Bearer Token

Include your API token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/agents
```

### Token Expiration

Tokens expire after 1 hour. Get a new token by calling `/api/auth/login` again.

## API Overview

### Core Endpoints

#### Agents

- `GET /api/agents` - List all agents
- `POST /api/agents` - Register new agent
- `GET /api/agents/{id}` - Get agent details

#### Events

- `GET /api/events` - List security events
- `POST /api/events` - Log a security event
- `GET /api/events/{id}` - Get event details

#### Policy

- `GET /api/policy` - Get current policy
- `POST /api/policy` - Update policy thresholds

## Code Examples

### Listing Agents

**JavaScript**:

```javascript
const token = "your_token_here";

const response = await fetch("http://localhost:3000/api/agents?limit=20", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const { agents, total } = await response.json();
console.log(`Found ${total} agents:`, agents);
```

**Python**:

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:3000/api/agents?limit=20', headers=headers)
data = response.json()
print(f"Found {data['total']} agents")
for agent in data['agents']:
    print(f"  - {agent['name']} ({agent['id']})")
```

### Logging Events

**JavaScript**:

```javascript
const response = await fetch("http://localhost:3000/api/events", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    agentId: "ag_xyz123",
    content: "User query: What is the capital of France?",
    destination: "openai-api",
  }),
});

const event = await response.json();
console.log(`Event logged: ${event.id}, Decision: ${event.decision}`);
```

**Python**:

```python
response = requests.post('http://localhost:3000/api/events',
  headers=headers,
  json={
    'agentId': 'ag_xyz123',
    'content': 'User query: What is the capital of France?',
    'destination': 'openai-api'
  }
)

event = response.json()
print(f"Event logged: {event['id']}, Decision: {event['decision']}")
```

### Updating Policy

**JavaScript**:

```javascript
const response = await fetch("http://localhost:3000/api/policy", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    allowThreshold: 0.3,
    reviewThreshold: 0.7,
    blockThreshold: 0.85,
  }),
});

const policy = await response.json();
console.log("Policy updated:", policy);
```

## SDKs

### JavaScript/TypeScript

```bash
npm install @promptguard/sdk
```

```typescript
import { PromptGuard } from "@promptguard/sdk";

const client = new PromptGuard({
  baseUrl: "http://localhost:3000",
  apiKey: "your_token_here",
});

// List agents
const agents = await client.agents.list();

// Register agent
const agent = await client.agents.create({
  name: "My Agent",
  type: "inference",
  organization: "My Company",
});

// Log event
const event = await client.events.log({
  agentId: agent.id,
  content: "User query",
  destination: "api",
});
```

### Python

```bash
pip install promptguard-sdk
```

```python
from promptguard import PromptGuard

client = PromptGuard(
    base_url='http://localhost:3000',
    api_key='your_token_here'
)

# List agents
agents = client.agents.list()

# Register agent
agent = client.agents.create(
    name='My Agent',
    type='inference',
    organization='My Company'
)

# Log event
event = client.events.log(
    agent_id=agent['id'],
    content='User query',
    destination='api'
)
```

## Troubleshooting

### 401 Unauthorized

**Problem**: Getting 401 error when calling API

**Solution**:

1. Check your token is valid: `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/agents`
2. Get a new token: `curl -X POST http://localhost:3000/api/auth/login ...`
3. Include the `Authorization` header in all requests

### 400 Bad Request

**Problem**: Getting 400 error with invalid parameters

**Solution**:

1. Check required fields match the endpoint documentation
2. Verify JSON syntax is valid
3. Review error message for specific field errors

### Network Connection Issues

**Problem**: Cannot connect to API

**Solution**:

1. Verify PromptGuard is running: `curl http://localhost:3000/`
2. Check the API base URL is correct
3. Ensure firewall allows port 3000

### Rate Limiting

**Problem**: Getting 429 Too Many Requests

**Solution**:

1. Check `X-RateLimit-Remaining` header
2. Wait before retrying (see `X-RateLimit-Reset`)
3. Implement exponential backoff in your code

## Getting Help

- **Documentation**: Visit http://localhost:3000/developer
- **Issues**: Report bugs at https://github.com/promptguard/sdk/issues
- **Discussions**: Ask questions at https://github.com/promptguard/discussions
- **Email**: support@promptguard.io

## Best Practices

1. **Always use HTTPS in production**
2. **Store API keys securely** (use environment variables)
3. **Implement proper error handling** and retries
4. **Log all API interactions** for debugging
5. **Monitor rate limits** and implement backoff
6. **Keep SDKs updated** for latest features

## Next Steps

1. Try the [inter ACTIVE API docs](http://localhost:3000/developer)
2. Integrate using your preferred SDK
3. Check out [example projects](https://github.com/promptguard/examples)
4. Join the [community](https://github.com/promptguard/discussions)
