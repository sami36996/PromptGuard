const API_URL = "http://localhost:8000";


async function request(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "API request failed"
            );
        }

        return data;

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}


// ==========================
// Chat / Prompt Analysis
// ==========================

export async function analyzePrompt(message) {
    return request("/api/chat", {
        method: "POST",
        body: JSON.stringify({
            message: message
        }),
    });
}


// ==========================
// Logs
// ==========================

export async function getLogs() {
    return request("/api/logs");
}


// ==========================
// Statistics
// ==========================

export async function getStats() {
    return request("/api/stats");
}


// ==========================
// Risk Summary
// ==========================

export async function getRiskSummary() {
    return request("/api/risk-summary");
}


// ==========================
// Recent Attacks
// ==========================

export async function getRecentAttacks() {
    return request("/api/recent-attacks");
}


// ==========================
// Dashboard
// ==========================

export async function getDashboard() {
    return request("/api/dashboard");
}


// ==========================
// Analytics
// ==========================

export async function getAnalytics() {
    return request("/api/analytics/");
}


// ==========================
// Events
// ==========================

export async function getEvents() {
    return request("/api/events/");
}


// ==========================
// Login
// ==========================

export async function login(username, password) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        }),
    });
}