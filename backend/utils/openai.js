import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const hasOpenAIKey = () => Boolean(process.env.OPENAI_API_KEY);

export const createOpenAIChatCompletion = async ({
  messages,
  model = process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature = 0.3,
  response_format = { type: "json_object" },
}) => {
  if (!hasOpenAIKey()) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.code = "MISSING_OPENAI_KEY";
    throw error;
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model,
        temperature,
        response_format,
        messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    const error = new Error("OpenAI request failed");
    error.code = "OPENAI_REQUEST_FAILED";
    error.details = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw error;
  }
};
