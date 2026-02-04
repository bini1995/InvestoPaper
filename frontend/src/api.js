const RAW_API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:4000";

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

export const requestJson = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      return {
        error:
          payload?.error ||
          payload?.message ||
          `Request failed with ${response.status}`,
      };
    }

    return { data: payload };
  } catch (error) {
    return { error: error?.message || "Network error" };
  }
};

export const getJson = (path) => requestJson(path, { method: "GET" });

export const postJson = (path, body) =>
  requestJson(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
