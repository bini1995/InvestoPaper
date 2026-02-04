const createStubError = (providerName) => {
  const error = new Error(
    `Market data provider "${providerName}" is not implemented.`
  );
  error.statusCode = 501;
  return error;
};

const getCandles = async ({ providerName }) => {
  throw createStubError(providerName || "unknown");
};

module.exports = {
  getCandles,
};
