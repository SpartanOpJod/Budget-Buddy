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
