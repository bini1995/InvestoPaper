const stooqProvider = require("./stooqProvider");
const stubProvider = require("./stubProvider");

const PROVIDERS = {
  stooq: stooqProvider,
  alphavantage: stubProvider,
  finnhub: stubProvider,
};

const getProvider = (providerName) => {
  if (!providerName) {
    return stubProvider;
  }
  return PROVIDERS[providerName] || stubProvider;
};

module.exports = {
  getProvider,
};
