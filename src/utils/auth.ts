export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/login";
}

export async function apiClient(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error("Authentication expired. Please login again.");
  }

  return response;
}
