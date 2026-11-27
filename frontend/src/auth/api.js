const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

async function readResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`The authentication service returned an error (${response.status}).`);
    }
    throw new Error("The authentication service returned invalid JSON.");
  }

  if (!response.ok) {
    const detail =
      data.detail ||
      Object.entries(data)
        .map(([field, messages]) =>
          `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
        )
        .join("; ");
    throw new Error(detail || `Authentication request failed (${response.status}).`);
  }

  return data;
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    credentials: "include",
  });
  if (response.status === 401 || response.status === 403) {
    return null;
  }
  const data = await readResponse(response);
  return data.user;
}

export async function fetchCsrfToken() {
  const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf/`, {
    credentials: "include",
  });
  const csrfData = await readResponse(csrfResponse);
  return csrfData.csrfToken;
}

export async function postAuthRequest(endpoint, payload = {}) {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(payload),
  });
  return readResponse(response);
}
