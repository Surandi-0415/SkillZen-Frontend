// src/api/client.js

import axios from "axios";

const NODE_API =
  import.meta.env.VITE_NODE_API_URL || "http://localhost:5000/api";

const PYTHON_API =
  import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

// ============================================================
// Node.js Backend Client
// ============================================================

export const nodeClient = axios.create({
  baseURL: NODE_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000,
});

// ============================================================
// Node Request Interceptor
// ============================================================

nodeClient.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("user");

    if (user) {
      try {
        const userData = JSON.parse(user);

        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (err) {
        console.error("Invalid user object:", err);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Node Response Interceptor
// ============================================================

nodeClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      // Only redirect if we are not already on the login page to allow validation display
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Python Backend Client
// ============================================================

export const pythonClient = axios.create({
  baseURL: PYTHON_API,
  timeout:300000,
});

// ============================================================
// Python Request Logger
// ============================================================

pythonClient.interceptors.request.use(
  (config) => {
    console.log("================================");
    console.log("➡️ Python Request");
    console.log("URL:", `${config.baseURL}${config.url}`);
    console.log("Method:", config.method);
    console.log("Headers:", config.headers);
    console.log("Payload:", config.data);
    console.log("================================");

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Python Response Logger
// ============================================================

pythonClient.interceptors.response.use(
  (response) => {
    console.log("================================");
    console.log("✅ Python Response");
    console.log(response.data);
    console.log("================================");

    return response;
  },
  (error) => {
    console.error("================================");
    console.error("❌ Python Request Failed");
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("================================");

    return Promise.reject(error);
  }
);

// ============================================================
// Helpers
// ============================================================

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    nodeClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  } else {
    delete nodeClient.defaults.headers.common["Authorization"];
  }
};

export const logout = () => {
  localStorage.removeItem("user");
  setAuthToken(null);
  window.location.href = "/";
};