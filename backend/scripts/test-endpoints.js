const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://budget-buddy-eta-roan.vercel.app";

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

const postJson = async (url, payload) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

const postTransactionEndpoint = async (primaryPath, fallbackPath, payload) => {
  try {
    const data = await postJson(`${API_URL}${primaryPath}`, payload);
    return { data, route: primaryPath };
  } catch (error) {
    if (error?.status !== 404 || !fallbackPath) {
      throw error;
    }

    const data = await postJson(`${API_URL}${fallbackPath}`, payload);
    return { data, route: fallbackPath };
  }
};

const run = async () => {
  console.log(`[config] API_URL=${API_URL}`);

  try {
    logStep("1. Register user");
    const registerData = await postJson(`${API_URL}/api/auth/register`, {
      name,
      email,
      password,
    });
    logOk("register", registerData);

    logStep("2. Login");
    const loginData = await postJson(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    logOk("login", loginData);

    const userId = loginData?.user?._id;
    if (!userId) {
      throw new Error("Login succeeded but user ID was not returned.");
    }

    logStep("3. Add transaction");
    const addResult = await postTransactionEndpoint(
      "/api/transactions/addTransaction",
      "/api/v1/addTransaction",
      {
        title: "API test transaction",
        amount: 100,
        description: "Created by backend test script",
        date: new Date().toISOString(),
        category: "Misc",
        transactionType: "credit",
        userId,
      }
    );
    logOk("addTransaction", { route: addResult.route, ...addResult.data });

    logStep("4. Fetch transactions");
    const fetchResult = await postTransactionEndpoint(
      "/api/transactions/getTransaction",
      "/api/v1/getTransaction",
      {
        userId,
        type: "all",
        frequency: "30",
      }
    );
    const count = fetchResult?.data?.transactions?.length ?? 0;
    logOk("getTransaction", {
      route: fetchResult.route,
      success: fetchResult?.data?.success,
      count,
    });

    console.log("\n[result] API flow completed successfully.");
  } catch (error) {
    logErr("API flow failed", error);
    process.exitCode = 1;
  }
};

run();
