const buildNewsSummaryMessages = ({ symbol, items }) => {
  const system =
    "You summarize market news. Return ONLY JSON. " +
    "Schema: {\"bullets\":[string],\"sentiment\":\"bullish\"|\"bearish\"|\"mixed\",\"risks\":[string]}. " +
    "Use only provided items; do not invent facts. " +
    "Cite source URLs from the input items in each bullet or risk that references a fact. " +
    "Keep bullets short and deterministic. " +
    "Include a disclaimer that this is not financial advice as one of the bullets.";

  const user = JSON.stringify({ symbol, items });

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
    "You create a trade briefing. Return ONLY JSON. " +
    "Schema: {\"planText\":string,\"doNotTradeIf\":[string],\"checklist\":[string],\"sizingAdvice\":string}. " +
    "Use only the input data; do not invent facts. " +
    "If referencing news, only cite URLs that already appear in the provided newsSummary bullets. " +
    "Keep output short, structured, and deterministic. " +
    "Include a disclaimer that this is not financial advice in planText.";

  const user = JSON.stringify({
    symbol,
    signalOutput,
    newsSummary,
    portfolioState,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
};

module.exports = {
  buildNewsSummaryMessages,
  buildTradeBriefingMessages,
};
