const config = require("./src/config");
const app = require("./src/app");

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
