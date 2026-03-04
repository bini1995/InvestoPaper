const DEFAULT_API_BASE_URL = "http://localhost:4000";

const RAW_API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  DEFAULT_API_BASE_URL;

const normalizeApiBaseUrl = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_API_BASE_URL;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL;
  }

  let candidate = trimmedValue;

  if (/^:\d+$/.test(candidate)) {
    candidate = `http://localhost${candidate}`;
  } else if (/^\d+$/.test(candidate)) {
    candidate = `http://localhost:${candidate}`;
  } else if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname) {
      return DEFAULT_API_BASE_URL;
    }

    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

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
    return {
      error:
        error?.message ||
        `Network error while contacting backend at ${API_BASE_URL}`,
    };
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
