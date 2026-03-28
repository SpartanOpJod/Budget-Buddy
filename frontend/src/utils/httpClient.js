import axios from "axios";
import { API_URL } from "./ApiRequest";

const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    (() => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user?.token || "";
      } catch {
        return "";
      }
    })();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default httpClient;
