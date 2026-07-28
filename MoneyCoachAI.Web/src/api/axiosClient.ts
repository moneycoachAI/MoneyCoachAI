import axios from "axios";
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5279/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;

let pendingRequests: Array<(token: string) => void> = [];

function processQueue(token: string) {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
}

function clearStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessTokenExpiresAt");
  localStorage.removeItem("refreshTokenExpiresAt");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
    refreshToken,
  });

  const auth = response.data;

  localStorage.setItem("token", auth.token);
  localStorage.setItem("refreshToken", auth.refreshToken);

  localStorage.setItem(
    "accessTokenExpiresAt",
    auth.accessTokenExpiresAt
  );

  localStorage.setItem(
    "refreshTokenExpiresAt",
    auth.refreshTokenExpiresAt
  );

  return auth.token;
}

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

axiosClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryAxiosRequestConfig;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          originalRequest.headers.Authorization =
            `Bearer ${token}`;

          resolve(axiosClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      processQueue(newToken);

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      clearStorage();

      window.location.replace("/login");

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;