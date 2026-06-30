const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

/**
 * Helper to retrieve stored JWT session token
 */
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("curepath_token");
  }
  return null;
};

/**
 * Helper to set JWT session token
 */
export const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("curepath_token", token);
  }
};

/**
 * Helper to clear JWT session token on logout
 */
export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("curepath_token");
  }
};

/**
 * Centralized API client wrapper with JWT header injection and automatic JSON parsing
 */
export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // If body is not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Inject JWT Authorization header if present
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      return {
        success: false,
        error: data.error || `HTTP Error ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (error: any) {
    console.warn(`[API Client]: Call to ${endpoint} failed or backend offline.`, error?.message);
    return {
      success: false,
      error: error?.message || "Network connection to backend server failed.",
    };
  }
};
