export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  tags: string[];
  summary: string;
  description?: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }[];
  requestBody?: {
    type: "object";
    properties: Record<
      string,
      { type: string; description?: string; example?: string | number }
    >;
    required?: string[];
  };
  responses: {
    status: number;
    description: string;
    example?: unknown;
  }[];
}

// Manual registry of API endpoints
export const apiEndpoints: ApiEndpoint[] = [
  {
    path: "/api/auth/login",
    method: "POST",
    tags: ["Authentication"],
    summary: "Authenticate and get API token",
    description:
      "Authenticate using username and password to receive an API token for subsequent requests.",
    requestBody: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "User username",
          example: "admin",
        },
        password: {
          type: "string",
          description: "User password",
          example: "promptguard",
        },
      },
      required: ["username", "password"],
    },
    responses: [
      {
        status: 200,
        description: "Authentication successful",
        example: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          expiresIn: 3600,
          user: { username: "admin", role: "admin" },
        },
      },
      {
        status: 401,
        description: "Invalid credentials",
      },
    ],
  },
  {
    path: "/api/agents",
    method: "GET",
    tags: ["Agents"],
    summary: "List all registered agents",
    parameters: [
      {
        name: "limit",
        type: "integer",
        required: false,
        description: "Max results (default 20)",
      },
      {
        name: "offset",
        type: "integer",
        required: false,
        description: "Pagination offset (default 0)",
      },
    ],
    responses: [
      {
        status: 200,
        description: "List of agents",
        example: {
          agents: [
            {
              id: "ag_001",
              name: "Production Inference Agent",
              type: "inference",
              organization: "Acme Corp",
              status: " ACTIVE",
              trustScore: 0.95,
            },
          ],
          total: 1,
        },
      },
    ],
  },
  {
    path: "/api/agents",
    method: "POST",
    tags: ["Agents"],
    summary: "Register a new agent",
    requestBody: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Agent name",
          example: "My Agent",
        },
        type: {
          type: "string",
          description: "Agent type",
          example: "inference",
        },
        organization: {
          type: "string",
          description: "Organization name",
          example: "Acme Corp",
        },
        description: { type: "string", description: "Optional description" },
      },
      required: ["name", "type", "organization"],
    },
    responses: [
      {
        status: 201,
        description: "Agent registered successfully",
        example: {
          id: "ag_001",
          apiKey: "YWdfMDAxOjE2OTI1NzA0MDAw",
          name: "My Agent",
        },
      },
    ],
  },
  {
    path: "/api/events",
    method: "GET",
    tags: ["Events"],
    summary: "Get security events",
    parameters: [
      {
        name: "agentId",
        type: "string",
        required: false,
        description: "Filter by agent ID",
      },
      {
        name: "decision",
        type: "string",
        required: false,
        description: "Filter by decision (ALLOW, REVIEW, BLOCK)",
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        description: "Max results",
      },
    ],
    responses: [
      {
        status: 200,
        description: "List of security events",
        example: {
          events: [
            {
              id: "evt_001",
              agentId: "ag_001",
              decision: "ALLOW",
              risk: 0.15,
              timestamp: "2024-07-08T12:00:00Z",
            },
          ],
          total: 1,
        },
      },
    ],
  },
  {
    path: "/api/events",
    method: "POST",
    tags: ["Events"],
    summary: "Log a security event",
    requestBody: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Agent ID", example: "ag_001" },
        content: {
          type: "string",
          description: "Message content",
          example: "Analyze user sentiment",
        },
        destination: {
          type: "string",
          description: "Destination service",
          example: "sentiment-api",
        },
      },
      required: ["agentId", "content", "destination"],
    },
    responses: [
      {
        status: 201,
        description: "Event logged successfully",
      },
    ],
  },
  {
    path: "/api/policy",
    method: "GET",
    tags: ["Policy"],
    summary: "Get current risk policy",
    responses: [
      {
        status: 200,
        description: "Current risk thresholds",
        example: {
          allowThreshold: 0.3,
          reviewThreshold: 0.7,
          blockThreshold: 0.85,
        },
      },
    ],
  },
  {
    path: "/api/policy",
    method: "POST",
    tags: ["Policy"],
    summary: "Update risk policy thresholds",
    requestBody: {
      type: "object",
      properties: {
        allowThreshold: {
          type: "number",
          description: "Allow threshold",
          example: 0.3,
        },
        reviewThreshold: {
          type: "number",
          description: "Review threshold",
          example: 0.7,
        },
        blockThreshold: {
          type: "number",
          description: "Block threshold",
          example: 0.85,
        },
      },
    },
    responses: [
      {
        status: 200,
        description: "Policy updated successfully",
      },
    ],
  },
];

export function getEndpointsByTag(tag: string): ApiEndpoint[] {
  return apiEndpoints.filter((e) => e.tags.includes(tag));
}

export function getEndpoint(
  path: string,
  method: string,
): ApiEndpoint | undefined {
  return apiEndpoints.find((e) => e.path === path && e.method === method);
}

export const allTags = Array.from(new Set(apiEndpoints.flatMap((e) => e.tags)));

export const codeExamples = {
  curl: (endpoint: ApiEndpoint) => {
    const isPost = endpoint.method === "POST";
    let example = `curl -X ${endpoint.method} "http://localhost:3000${endpoint.path}"`;

    if (isPost && endpoint.requestBody) {
      const props = Object.keys(endpoint.requestBody.properties);
      const body = props
        .slice(0, 2)
        .map((p) => `"${p}": "value"`)
        .join(",");
      example += ` \\\n  -H "Content-Type: application/json" \\\n  -d "{ ${body} }"`;
    }

    return example;
  },

  javascript: (endpoint: ApiEndpoint) => {
    const isPost = endpoint.method === "POST";
    let code = `const response = await fetch('http://localhost:3000${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
  },`;

    if (isPost && endpoint.requestBody) {
      code += `
  body: JSON.stringify({
    // Add required fields here
  }),`;
    }

    code += `
})

const data = await response.json()
console.log(data)`;

    return code;
  },

  python: (endpoint: ApiEndpoint) => {
    const isPost = endpoint.method === "POST";
    let code = `import requests

url = "http://localhost:3000${endpoint.path}"`;

    if (isPost && endpoint.requestBody) {
      code += `
headers = {"Content-Type": "application/json"}
data = {
    # Add required fields here
}
response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)`;
    } else {
      code += `
response = requests.${endpoint.method.toLowerCase()}(url)`;
    }

    code += `

print(response.json())`;

    return code;
  },
};
