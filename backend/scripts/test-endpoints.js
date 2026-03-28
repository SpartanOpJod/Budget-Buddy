const API_URL =
  process.env.API_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

const ts = Date.now();
const email = `apitest_${ts}@example.com`;
const password = "TestPass@123";
const name = `API Test ${ts}`;

const logStep = (step) => console.log(`\n[step] ${step}`);
const logOk = (label, data) => console.log(`[ok] ${label}:`, data);
const logErr = (label, error) => {
  const status = error?.status;
  const data = error?.data;
  console.error(`[error] ${label}${status ? ` (status ${status})` : ""}`);
  if (data) console.error(data);
  else console.error(error?.message || error);
};

const requestJson = async (url, { method = "POST", payload, token } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

const run = async () => {
  console.log(`[config] API_URL=${API_URL}`);

  try {
    logStep("1. Register user");
    const registerData = await requestJson(`${API_URL}/api/auth/register`, {
      method: "POST",
      payload: { name, email, password },
    });
    logOk("register", { success: registerData.success });

    logStep("2. Login");
    const loginData = await requestJson(`${API_URL}/api/auth/login`, {
      method: "POST",
      payload: { email, password },
    });
    const token = loginData?.token;
    const userId = loginData?.user?._id;
    if (!token || !userId) {
      throw new Error("Login did not return token/user");
    }
    logOk("login", { success: loginData.success, userId });

    logStep("3. Add transaction");
    const addData = await requestJson(`${API_URL}/api/transactions/addTransaction`, {
      method: "POST",
      token,
      payload: {
        userId,
        title: "API test transaction",
        amount: 100,
        description: "Created by test script",
        date: new Date().toISOString(),
        category: "Other",
        transactionType: "expense",
      },
    });
    logOk("addTransaction", { success: addData.success });

    logStep("4. Fetch transactions (all)");
    const fetchAll = await requestJson(`${API_URL}/api/transactions/getTransaction`, {
      method: "POST",
      token,
      payload: {
        userId,
        type: "all",
        frequency: "30",
      },
    });
    logOk("getTransaction", {
      success: fetchAll.success,
      count: fetchAll?.transactions?.length ?? 0,
    });

    logStep("5. Fetch transactions with filter (expense)");
    const fetchFiltered = await requestJson(`${API_URL}/api/transactions/getTransaction`, {
      method: "POST",
      token,
      payload: {
        userId,
        type: "expense",
        frequency: "30",
      },
    });
    logOk("getTransaction filtered", {
      success: fetchFiltered.success,
      count: fetchFiltered?.transactions?.length ?? 0,
    });

    console.log("\n[result] All deployment checks passed.");
  } catch (error) {
    logErr("Deployment/API checks failed", error);
    process.exitCode = 1;
  }
};

run();
