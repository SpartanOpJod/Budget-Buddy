import Groq from "groq-sdk";

const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};
const CATEGORY_OPTIONS = [
  "Groceries",
  "Rent",
  "Salary",
  "Tip",
  "Food",
  "Medical",
  "Utilities",
  "Entertainment",
  "Transportation",
  "Other",
];

const normalizePredictedCategory = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  const matchedCategory = CATEGORY_OPTIONS.find(
    (category) => category.toLowerCase() === normalized
  );
  return matchedCategory || "Other";
};

const normalizeTransactionType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "income" || normalized === "credit") {
    return "credit";
  }
  return "expense";
};

const normalizeTransactionDate = (value = "") => {
  const fallback = new Date().toISOString().slice(0, 10);
  if (!value) {
    return fallback;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return String(value);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toISOString().slice(0, 10);
};

const stripMarkdown = (value = "") =>
  String(value)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const safeJsonParse = (value = "") => {
  const cleaned = stripMarkdown(value);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

const computeSpendingSummary = (transactions = []) => {
  const categoryTotals = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const type = normalizeTransactionType(tx?.transactionType);
    const amount = Number(tx?.amount) || 0;
    const category = normalizePredictedCategory(tx?.category || "Other");

    if (type === "credit") {
      totalIncome += amount;
      continue;
    }

    totalExpense += amount;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  }

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    balance: Number((totalIncome - totalExpense).toFixed(2)),
    categories: Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category,
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total),
  };
};

const callAI = async (prompt, label = "unknown") => {
  const groq = getGroq();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    const content = response?.choices?.[0]?.message?.content || "";
    console.log(`[ai] ${label} raw response:`, content);
    return content;
  } catch (error) {
    console.error(`[ai] ${label} Groq error:`, error);
    throw error;
  }
};

export const parseTransactionTextController = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "`text` is required",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const prompt = [
      "Convert this natural language transaction into strict JSON only.",
      "Do not include markdown or explanation text.",
      "Use exactly this schema:",
      '{"title":"","amount":0,"category":"","type":"expense or income","date":"YYYY-MM-DD"}',
      `Allowed categories: ${CATEGORY_OPTIONS.join(", ")}.`,
      `Today is: ${today}`,
      `Input: "${text}"`,
    ].join("\n");

    const raw = await callAI(prompt, "parse");
    const parsed = safeJsonParse(raw) || {};
    const amountValue = Number(parsed?.amount);

    return res.status(200).json({
      success: true,
      title: String(parsed?.title || text).trim(),
      amount:
        Number.isFinite(amountValue) && amountValue > 0
          ? String(amountValue)
          : "",
      category: normalizePredictedCategory(parsed?.category),
      type: normalizeTransactionType(parsed?.type),
      date: normalizeTransactionDate(parsed?.date),
    });
  } catch (error) {
    console.error("[ai] parse route error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to parse transaction text",
      details: error.message,
    });
  }
};

export const generateInsightsController = async (req, res) => {
  try {
    const { transactions } = req.body || {};

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "`transactions` must be an array",
      });
    }

    const summary = computeSpendingSummary(transactions);
    const prompt = [
  "You are a strict financial advisor.",
  "Analyze the user's spending summary and return structured insights.",
  "Return ONLY JSON in this format:",
  `{
    "spendingInsights": "",
    "budgetSuggestions": ["", ""],
    "categoryWarnings": ["", ""],
    "savingsTips": ["", ""]
  }`,
  "Rules:",
  "- Do not leave any array empty",
  "- Be specific and practical",
  "- Warn if any category is high",
  `Summary: ${JSON.stringify(summary)}`
].join("\n");

    const raw = await callAI(prompt, "insights");
    const parsed = safeJsonParse(raw) || {};

return res.status(200).json({
  success: true,
  spending_insights: parsed?.spendingInsights || "No insights",
  budget_suggestions: parsed?.budgetSuggestions || [],
  category_warnings: parsed?.categoryWarnings || [],
  saving_tips: parsed?.savingsTips || [],
});

    return res.status(200).json({
      success: true,
      insights,
      spending_insights: insights,
      budget_suggestions: [],
      category_warnings: [],
      saving_tips: [],
      suggestions: [],
    });
  } catch (error) {
    console.error("[ai] insights route error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI insights",
      details: error.message,
    });
  }
};

export const aiTestController = async (req, res) => {
  try {
    const raw = await callAI("Say hello", "test");
    return res.status(200).json({
      success: true,
      message: "Groq test successful",
      response: stripMarkdown(raw),
    });
  } catch (error) {
    console.error("[ai] test route error:", error);
    return res.status(500).json({
      success: false,
      message: "Groq test failed",
      details: error.message,
    });
  }
};

export const predictCategoryController = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "`title` is required",
      });
    }

    const prompt = [
      "Classify this transaction title into one allowed category.",
      `Allowed categories: ${CATEGORY_OPTIONS.join(", ")}.`,
      'Return strict JSON only: {"category":""}',
      `Title: "${title}"`,
    ].join("\n");

    const raw = await callAI(prompt, "predict-category");
    const parsed = safeJsonParse(raw) || {};

    return res.status(200).json({
      success: true,
      category: normalizePredictedCategory(parsed?.category),
    });
  } catch (error) {
    console.error("[ai] predict-category route error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to predict category",
      details: error.message,
    });
  }
};

export const budgetAdvisorController = async (req, res) => {
  try {
    const income = Number(req.body?.income);
    const expenses = Array.isArray(req.body?.expenses) ? req.body.expenses : [];

    if (!Number.isFinite(income) || income < 0) {
      return res.status(400).json({
        success: false,
        message: "`income` must be a non-negative number",
      });
    }

    const prompt = [
      "Create a monthly budget recommendation.",
      "Return strict JSON only:",
      '{"recommended_budget":{},"saving_tips":[]}',
      `Income: ${income}`,
      `Expenses: ${JSON.stringify(expenses)}`,
    ].join("\n");

    const raw = await callAI(prompt, "budget-advisor");
    const parsed = safeJsonParse(raw) || {};

    return res.status(200).json({
      success: true,
      recommended_budget:
        parsed?.recommended_budget &&
        typeof parsed.recommended_budget === "object" &&
        !Array.isArray(parsed.recommended_budget)
          ? parsed.recommended_budget
          : {},
      saving_tips: Array.isArray(parsed?.saving_tips)
        ? parsed.saving_tips.map((item) => String(item)).filter(Boolean)
        : [],
    });
  } catch (error) {
    console.error("[ai] budget-advisor route error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate budget advice",
      details: error.message,
    });
  }
};

export const spendingPredictionController = async (req, res) => {
  try {
    const transactions = Array.isArray(req.body?.transactions)
      ? req.body.transactions
      : [];
    const summary = computeSpendingSummary(transactions);

    const prompt = [
      "Based on the data, explain expected spending next month.",
      'Return strict JSON only: {"explanation":""}',
      `Summary: ${JSON.stringify(summary)}`,
    ].join("\n");

    const raw = await callAI(prompt, "spending-prediction");
    const parsed = safeJsonParse(raw) || {};

    const nextMonthExpected = summary.categories.reduce((acc, item) => {
      acc[item.category] = item.total;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      next_month_expected_spending: nextMonthExpected,
      ai_explanation:
        typeof parsed?.explanation === "string" && parsed.explanation.trim()
          ? parsed.explanation.trim()
          : "Projection is based on your historical spending by category.",
    });
  } catch (error) {
    console.error("[ai] spending-prediction route error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate spending prediction",
      details: error.message,
    });
  }
};

