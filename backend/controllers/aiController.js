import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
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
  const normalized = String(value).toLowerCase().trim();
  if (normalized === "credit" || normalized === "income") {
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

const normalizeType = (value = "") => String(value).toLowerCase().trim();

const toMonthKey = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const summarizeExpensesByCategory = (transactions = []) => {
  const totals = {};

  for (const tx of transactions) {
    const type = normalizeType(tx?.transactionType);
    if (type && type !== "expense") {
      continue;
    }

    const category = tx?.category ? String(tx.category) : "Uncategorized";
    const amount = Number(tx?.amount) || 0;
    totals[category] = (totals[category] || 0) + amount;
  }

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total);
};

const calculateTrends = (transactions = []) => {
  const monthBuckets = {};

  for (const tx of transactions) {
    const monthKey = toMonthKey(tx?.date);
    if (!monthKey) {
      continue;
    }

    if (!monthBuckets[monthKey]) {
      monthBuckets[monthKey] = { income: 0, expense: 0 };
    }

    const type = normalizeType(tx?.transactionType);
    const amount = Number(tx?.amount) || 0;

    if (type === "income") {
      monthBuckets[monthKey].income += amount;
    } else {
      monthBuckets[monthKey].expense += amount;
    }
  }

  const monthly = Object.entries(monthBuckets)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, values]) => ({
      month,
      income: Number(values.income.toFixed(2)),
      expense: Number(values.expense.toFixed(2)),
      net: Number((values.income - values.expense).toFixed(2)),
    }));

  const recent = monthly.slice(-2);
  const expenseDelta = recent.length === 2 ? Number((recent[1].expense - recent[0].expense).toFixed(2)) : 0;
  const incomeDelta = recent.length === 2 ? Number((recent[1].income - recent[0].income).toFixed(2)) : 0;
  const netDelta = recent.length === 2 ? Number((recent[1].net - recent[0].net).toFixed(2)) : 0;

  return {
    monthly,
    deltas: {
      expenseDelta,
      incomeDelta,
      netDelta,
    },
  };
};

const buildPrompt = ({ expenseSummary, trends }) => {
  return [
    "You are a personal finance assistant.",
    "Analyze the provided transaction aggregates and trends.",
    "Return concise, practical advice in JSON format:",
    '{"insights":"short paragraph","suggestions":["actionable item 1","actionable item 2"]}',
    "",
    `Expense summary by category: ${JSON.stringify(expenseSummary)}`,
    `Trend data: ${JSON.stringify(trends)}`,
    "",
    "Rules:",
    "- Keep insights under 120 words.",
    "- Provide 3 to 5 suggestions.",
    "- Suggestions must be specific and measurable.",
  ].join("\n");
};

const parseAssistantJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const normalizeExpenseItem = (item) => {
  if (typeof item === "number") {
    return {
      amount: Number(item) || 0,
      category: "Other",
      title: "",
    };
  }

  return {
    amount: Number(item?.amount) || 0,
    category: item?.category ? String(item.category) : "Other",
    title: item?.title ? String(item.title) : "",
  };
};

const summarizeBudgetExpenses = (expenses = []) => {
  const normalized = expenses.map(normalizeExpenseItem);
  const totalExpense = normalized.reduce((acc, item) => acc + item.amount, 0);
  const byCategory = {};

  for (const item of normalized) {
    byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
  }

  return {
    totalExpense: Number(totalExpense.toFixed(2)),
    byCategory: Object.entries(byCategory)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount),
  };
};

const monthIndexFromDate = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};

const projectNextMonthSpending = (transactions = []) => {
  const expenses = transactions.filter(
    (tx) => normalizeType(tx?.transactionType) === "expense"
  );

  if (expenses.length === 0) {
    return {};
  }

  const monthIndexes = expenses
    .map((tx) => monthIndexFromDate(tx?.date))
    .filter((monthIndex) => monthIndex !== null);

  if (monthIndexes.length === 0) {
    return {};
  }

  const minMonth = Math.min(...monthIndexes);
  const maxMonth = Math.max(...monthIndexes);
  const monthSpan = Math.max(maxMonth - minMonth + 1, 1);
  const categoryTotals = {};

  for (const tx of expenses) {
    const category = normalizePredictedCategory(tx?.category);
    const amount = Number(tx?.amount) || 0;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  }

  const projectionEntries = Object.entries(categoryTotals)
    .map(([category, total]) => [
      category,
      Number((total / monthSpan).toFixed(2)),
    ])
    .sort((a, b) => b[1] - a[1]);

  return Object.fromEntries(projectionEntries);
};

export const budgetAdvisorController = async (req, res) => {
  try {
    const income = Number(req.body?.income);
    const expenses = req.body?.expenses;

    if (!Number.isFinite(income) || income < 0) {
      return res.status(400).json({
        success: false,
        message: "`income` must be a non-negative number",
      });
    }

    if (!Array.isArray(expenses)) {
      return res.status(400).json({
        success: false,
        message: "`expenses` must be an array",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is not configured",
      });
    }

    const expenseSummary = summarizeBudgetExpenses(expenses);

    let data;
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You are a personal finance advisor.",
                "Return valid JSON only with keys:",
                "recommended_budget (object), saving_tips (array of strings).",
                "Do not include any extra keys.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                "Create a monthly budget recommendation and practical savings tips.",
                `Income: ${income}`,
                `Expense summary: ${JSON.stringify(expenseSummary)}`,
                "Budget should be realistic and consistent with income.",
                'Output format: {"recommended_budget":{},"saving_tips":[]}',
              ].join("\n"),
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      data = response.data;
    } catch (error) {
      const errorText = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({
        success: false,
        message: "OpenAI request failed",
        details: errorText,
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAssistantJson(content) || {};
    const recommended_budget =
      parsed?.recommended_budget &&
      typeof parsed.recommended_budget === "object" &&
      !Array.isArray(parsed.recommended_budget)
        ? parsed.recommended_budget
        : {};
    const saving_tips = Array.isArray(parsed?.saving_tips)
      ? parsed.saving_tips.map((tip) => String(tip)).filter(Boolean)
      : [];

    return res.status(200).json({
      recommended_budget,
      saving_tips,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is not configured",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    let data;

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "Convert user transaction text into structured JSON.",
                "Allowed categories:",
                CATEGORY_OPTIONS.join(", "),
                "Type must be either `expense` or `credit`.",
                "Date must be YYYY-MM-DD.",
                "Return JSON only with keys: title, amount, category, type, date.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                `Today is ${today}.`,
                `Input text: "${text}"`,
                'Output format: {"title":"","amount":"","category":"","type":"","date":""}',
              ].join("\n"),
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      data = response.data;
    } catch (error) {
      const errorText = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({
        success: false,
        message: "OpenAI request failed",
        details: errorText,
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAssistantJson(content) || {};
    const amountValue = Number(parsed?.amount);

    return res.status(200).json({
      title: String(parsed?.title || text).trim(),
      amount: Number.isFinite(amountValue) && amountValue > 0 ? String(amountValue) : "",
      category: normalizePredictedCategory(parsed?.category),
      type: normalizeTransactionType(parsed?.type),
      date: normalizeTransactionDate(parsed?.date),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const spendingPredictionController = async (req, res) => {
  try {
    const transactions = req.body?.transactions;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "`transactions` must be an array",
      });
    }

    const predictedSpending = projectNextMonthSpending(transactions);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        next_month_expected_spending: predictedSpending,
        ai_explanation:
          "AI explanation unavailable because OPENAI_API_KEY is not configured.",
      });
    }

    let data;
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You are a finance assistant.",
                "Explain a spending forecast that was computed using statistical monthly averages.",
                "Return JSON with one key only: explanation.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                "Forecast input (next month expected spending per category):",
                JSON.stringify(predictedSpending),
                "Write a concise explanation (max 120 words), mention that this is based on historical monthly averages.",
              ].join("\n"),
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      data = response.data;
    } catch (error) {
      const errorText = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({
        success: false,
        message: "OpenAI request failed",
        details: errorText,
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAssistantJson(content) || {};
    const aiExplanation =
      typeof parsed?.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : "Forecast is based on average monthly spending by category from your previous transactions.";

    return res.status(200).json({
      next_month_expected_spending: predictedSpending,
      ai_explanation: aiExplanation,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is not configured",
      });
    }

    let data;
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You classify a transaction title into one category.",
                `Allowed categories: ${CATEGORY_OPTIONS.join(", ")}.`,
                'Return JSON only in this exact shape: {"category":"<one allowed category>"}',
              ].join(" "),
            },
            {
              role: "user",
              content: `Transaction title: "${title}"`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      data = response.data;
    } catch (error) {
      const errorText = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({
        success: false,
        message: "OpenAI request failed",
        details: errorText,
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAssistantJson(content);
    const category = normalizePredictedCategory(parsed?.category);

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const generateInsightsController = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "`transactions` must be an array",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is not configured",
      });
    }

    const expenseSummary = summarizeExpensesByCategory(transactions);
    const trends = calculateTrends(transactions);

    let data;
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You provide personal finance analysis. Always return valid JSON with keys insights and suggestions.",
            },
            {
              role: "user",
              content: buildPrompt({ expenseSummary, trends }),
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      data = response.data;
    } catch (error) {
      const errorText = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      return res.status(502).json({
        success: false,
        message: "OpenAI request failed",
        details: errorText,
      });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAssistantJson(content);

    const insights = typeof parsed?.insights === "string" ? parsed.insights : "No insights generated.";
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

    return res.status(200).json({
      insights,
      suggestions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
