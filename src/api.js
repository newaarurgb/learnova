
import axios from "axios";

const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000/api"
    : "https://learnova-jytp.onrender.com/api");

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise;

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem("learnova_access");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      request.url?.endsWith("/auth/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = sessionStorage.getItem("learnova_refresh");
    if (!refreshToken) return Promise.reject(error);

    request._retried = true;
    let accessToken;
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${api.defaults.baseURL}/auth/token/refresh/`, {
            refresh: refreshToken,
          })
          .then(({ data }) => {
            sessionStorage.setItem("learnova_access", data.access);
            return data.access;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      accessToken = await refreshPromise;
    } catch (refreshError) {
      sessionStorage.removeItem("learnova_user");
      sessionStorage.removeItem("learnova_access");
      sessionStorage.removeItem("learnova_refresh");
      window.dispatchEvent(new Event("learnova-auth-change"));
      return Promise.reject(refreshError);
    }

    request.headers.Authorization = `Bearer ${accessToken}`;
    return api(request);
  }
);

export default api;
