const config = require("./src/config");
const app = require("./src/app");
const { startNewsJob } = require("./src/jobs/newsJob");

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});

startNewsJob();
