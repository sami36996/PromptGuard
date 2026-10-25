# PromptGuard API Documentation

## Overview

PromptGuard provides a comprehensive REST API for managing AI agents, monitoring security events, and configuring risk policies. The API is designed to be simple, secure, and developer-friendly.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API requests require authentication via bearer token. Get a token by calling the login endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"promptguard"}'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

Include the token in subsequent requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/agents
```

## Endpoints

### Authentication

#### Login

- **Method**: POST
- **Path**: `/auth/login`
- **Description**: Authenticate and receive API token

**Request**:

```json
{
  "username": "admin",
  "password": "promptguard"
}
```

**Response** (200):

```json
{
  "token": "string",
  "expiresIn": 3600,
  "user": {
    "username": "string",
    "role": "string"
  }
}
```

### Agents

#### List Agents

- **Method**: GET
- **Path**: `/agents`
- **Query Parameters**:
  - `limit` (integer, optional): Max results (default: 20)
  - `offset` (integer, optional): Pagination offset (default: 0)

**Response** (200):

```json
{
  "agents": [
    {
      "id": "ag_001",
      "name": "Production Inference Agent",
      "type": "inference",
      "organization": "Acme Corp",
      "status": " ACTIVE",
      "trustScore": 0.95,
      "createdAt": "2024-06-08T12:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### Register Agent

- **Method**: POST
- **Path**: `/agents`
- **Description**: Register a new agent with PromptGuard

**Request**:

```json
{
  "name": "My Agent",
  "type": "inference",
  "organization": "Acme Corp",
  "description": "Optional description"
}
```

**Response** (201):

```json
{
  "id": "ag_001",
  "apiKey": "YWdfMDAxOjE2OTI1NzA0MDAw",
  "name": "My Agent",
  "type": "inference",
  "organization": "Acme Corp",
  "message": "Agent registered successfully"
}
```

### Events

#### Get Events

- **Method**: GET
- **Path**: `/events`
- **Query Parameters**:
  - `agentId` (string, optional): Filter by agent
  - `decision` (string, optional): Filter by decision (ALLOW, REVIEW, BLOCK)
  - `limit` (integer, optional): Max results (default: 20)

**Response** (200):

```json
{
  "events": [
    {
      "id": "evt_001",
      "agentId": "ag_001",
      "agentName": "Production Inference Agent",
      "content": "Analyze user sentiment from feedback",
      "destination": "sentiment-api",
      "decision": "ALLOW",
      "risk": 0.15,
      "findings": [],
      "timestamp": "2024-07-08T12:05:00Z"
    }
  ],
  "total": 1
}
```

#### Log Event

- **Method**: POST
- **Path**: `/events`
- **Description**: Log a security event

**Request**:

```json
{
  "agentId": "ag_001",
  "content": "Analyze user sentiment from feedback",
  "destination": "sentiment-api"
}
```

**Response** (201):

```json
{
  "id": "evt_001",
  "agentId": "ag_001",
  "content": "Analyze user sentiment from feedback",
  "destination": "sentiment-api",
  "decision": "ALLOW",
  "risk": 0.15,
  "timestamp": "2024-07-08T12:05:00Z",
  "message": "Event logged successfully"
}
```

### Policy

#### Get Policy

- **Method**: GET
- **Path**: `/policy`
- **Description**: Get current risk thresholds

**Response** (200):

```json
{
  "allowThreshold": 0.3,
  "reviewThreshold": 0.7,
  "blockThreshold": 0.85,
  "autoQuarantine": 5,
  "lastUpdated": "2024-07-08T12:00:00Z"
}
```

#### Update Policy

- **Method**: POST
- **Path**: `/policy`
- **Description**: Update risk policy thresholds

**Request**:

```json
{
  "allowThreshold": 0.3,
  "reviewThreshold": 0.7,
  "blockThreshold": 0.85
}
```

**Response** (200):

```json
{
  "allowThreshold": 0.3,
  "reviewThreshold": 0.7,
  "blockThreshold": 0.85,
  "message": "Policy updated successfully",
  "lastUpdated": "2024-07-08T12:00:00Z"
}
```

## Error Handling

All errors return a JSON response with an error message and HTTP status code:

```json
{
  "error": "Invalid credentials"
}
```

### Error Codes

- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Invalid or missing authentication token
- **404 Not Found**: Requested resource not found
- **500 Server Error**: Internal server error

## Rate Limiting

- **Rate limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Webhooks

Webhooks allow you to receive real-time notifications for important events.

Subscribe to events:

```json
{
  "event": "agent.created",
  "url": "https://example.com/webhooks",
  "secret": "whsec_xxxxx"
}
```

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install @promptguard/sdk`
- **Python**: `pip install promptguard-sdk`
- **Go**: `go get github.com/promptguard/sdk-go`

## Support

- **Documentation**: https://docs.promptguard.io
- **GitHub**: https://github.com/promptguard
- **Issues**: https://github.com/promptguard/sdk/issues
