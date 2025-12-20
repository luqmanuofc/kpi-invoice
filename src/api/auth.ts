export interface LoginResponse {
  token: string;
}

export interface LoginError {
  error: string;
}

export async function login(password: string): Promise<LoginResponse> {
  const response = await fetch("/.netlify/functions/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}
