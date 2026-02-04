const config = require("../../config");

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const parseJsonResponse = (content) => {
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("OpenRouter response was not valid JSON.");
    }
    return JSON.parse(match[0]);
  }
};

const callOpenRouter = async ({ messages, model = DEFAULT_MODEL }) => {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey}`,
      "Content-Type": "application/json",
      "X-Title": "InvestoPaper",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      top_p: 1,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorText}`
    );
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  return parseJsonResponse(content);
};

module.exports = {
  callOpenRouter,
};
