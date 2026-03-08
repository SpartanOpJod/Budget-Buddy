const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://budget-buddy-eta-roan.vercel.app";

export { API_URL };

export const setAvatarAPI = `${API_URL}/api/auth/setAvatar`;
export const registerAPI = `${API_URL}/api/auth/register`;
export const loginAPI = `${API_URL}/api/auth/login`;
export const addTransaction = `${API_URL}/api/transactions/addTransaction`;
export const getTransactions = `${API_URL}/api/transactions/getTransaction`;
export const editTransactions = `${API_URL}/api/transactions/updateTransaction`;
export const deleteTransactions = `${API_URL}/api/transactions/deleteTransaction`;
export const predictCategoryAPI = `${API_URL}/api/ai/predict-category`;
