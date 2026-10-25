const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("promptguard_token")
        : null;

    const headers = new Headers(options.headers);
    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = `API Error ${response.status}`;

      try {
        const errorData = await response.json();

        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          message = errorData.detail
            .map((item: { msg?: string }) => item.msg)
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // Keep the status-based message for non-JSON failures.
      }

      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("promptguard_token");
        const loginPath = window.location.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login";
        if (window.location.pathname !== loginPath) {
          window.location.assign(loginPath);
        }
      }

      throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  get<T>(url: string) {
    return this.request<T>(url);
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(url: string) {
    return this.request<T>(url, {
      method: "DELETE",
    });
  }

  async download(path: string): Promise<Blob> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("promptguard_token")
        : null;

    const response = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "text/csv, application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    });

    if (!response.ok) {
      let message = `API Error ${response.status}`;

      try {
        const errorData = await response.json();

        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          message = errorData.detail
            .map((item: { msg?: string }) => item.msg)
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // Keep the status-based message for non-JSON failures.
      }

      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("promptguard_token");
        const loginPath = window.location.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login";
        if (window.location.pathname !== loginPath) {
          window.location.assign(loginPath);
        }
      }

      throw new ApiError(message, response.status);
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();