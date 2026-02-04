const buildNewsSummaryMessages = ({ symbol, items }) => {
  const system =
    "You are a concise analyst. Use only the provided headlines and URLs. Do not invent facts. If information is missing, say \u201cunknown\u201d. Output valid JSON only.";

  const user = `Summarize the following news items for ${symbol}. Provide:\n\t\u2022\t5 bullet points max, each referencing a URL from the list\n\t\u2022\toverall sentiment: bullish, bearish, or mixed\n\t\u2022\tkey risks (max 5)\n\nNews:\n${JSON.stringify(items)}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

const buildTradeBriefingMessages = ({
  symbol,
  signalOutput,
  newsSummary,
  portfolioState,
}) => {
  const system =
    "You generate cautious, rules-based trade briefings. Use only provided signal output, portfolio state, and the news summary. Do not claim certainty. Output valid JSON only.";

  const user = `Create a trade briefing for ${symbol} using:\nSignal output:\n${JSON.stringify(
    signalOutput
  )}\n\nPortfolio state:\n${JSON.stringify(
    portfolioState
  )}\n\nNews summary:\n${JSON.stringify(newsSummary)}\n\nReturn:\n\t\u2022\tplanText (short)\n\t\u2022\tchecklist (max 7)\n\t\u2022\tdoNotTradeIf (max 7)\n\t\u2022\tsizingAdvice (short)\n\t\u2022\tdisclaimer (one sentence)`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

module.exports = {
  buildNewsSummaryMessages,
  buildTradeBriefingMessages,
};
