const dotenv = require("dotenv");

dotenv.config();

const REQUIRED_ENV_VARS = [
  "PORT",
  "JWT_SECRET",
  "OPENROUTER_API_KEY",
  "NEWS_RSS_URLS",
  "MARKET_DATA_PROVIDER",
];

const ALLOWED_MARKET_DATA_PROVIDERS = ["stooq", "alphavantage", "finnhub"];

const getMissingEnvVars = () =>
  REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

const parseNewsRssUrls = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const validateEnv = () => {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}.`
    );
    process.exit(1);
  }

  if (!ALLOWED_MARKET_DATA_PROVIDERS.includes(process.env.MARKET_DATA_PROVIDER)) {
    console.error(
      `Invalid MARKET_DATA_PROVIDER. Expected one of: ${ALLOWED_MARKET_DATA_PROVIDERS.join(
        ", "
      )}.`
    );
    process.exit(1);
  }
};

validateEnv();

const config = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  newsRssUrls: parseNewsRssUrls(process.env.NEWS_RSS_URLS),
  marketDataProvider: process.env.MARKET_DATA_PROVIDER,
  marketDataApiKey: process.env.MARKET_DATA_API_KEY || null,
};

/**
 * @typedef {Object} PublicConfig
 * @property {string[]} newsRssUrls
 * @property {string} marketDataProvider
 */

/**
 * @typedef {Object} AppConfig
 * @property {number} port
 * @property {string} databaseUrl
 * @property {string} jwtSecret
 * @property {string} openRouterApiKey
 * @property {string[]} newsRssUrls
 * @property {string} marketDataProvider
 * @property {string|null} marketDataApiKey
 * @property {PublicConfig} public
 */

/** @type {AppConfig} */
const typedConfig = {
  ...config,
  public: {
    newsRssUrls: config.newsRssUrls,
    marketDataProvider: config.marketDataProvider,
  },
};

module.exports = typedConfig;
