const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const resolveApiUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VITE_API_URL;

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return trimTrailingSlash(window.location.origin);
  }

  return "http://localhost:5001";
};

const API_URL = resolveApiUrl();

const API_PREFIX = "/api";

export { API_URL };

export const setAvatarAPI = `${API_PREFIX}/auth/setAvatar`;
export const registerAPI = `${API_PREFIX}/auth/register`;
export const loginAPI = `${API_PREFIX}/auth/login`;
export const addTransaction = `${API_PREFIX}/transactions/addTransaction`;
export const getTransactions = `${API_PREFIX}/transactions/getTransaction`;
export const editTransactions = `${API_PREFIX}/transactions/updateTransaction`;
export const deleteTransactions = `${API_PREFIX}/transactions/deleteTransaction`;
export const predictCategoryAPI = `${API_PREFIX}/ai/predict-category`;
export const parseTransactionTextAPI = `${API_PREFIX}/ai/parse`;
export const spendingPredictionAPI = `${API_PREFIX}/ai/spending-prediction`;
export const aiInsightsAPI = `${API_PREFIX}/ai/insights`;
