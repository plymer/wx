const path = require("path");

const ENV_VARS = {
  NODE_ENV: "production",
  SQLITE_PATH: process.env.SQLITE_DEV_PATH,
  OUTLOOK_DIR: process.env.OUTLOOK_DIR,
  STATIC_DATA_DIR: process.env.STATIC_DATA_DIR,
  PORT: 3001,
};

module.exports = {
  apps: [
    {
      name: "prairiewx-dev",
      script: path.resolve(__dirname, "dist/server/main.js"),
      instances: 1,
      exec_mode: "cluster",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/app-error.log",
      out_file: "./logs/app-out.log",
      merge_logs: true,
      max_memory_restart: "1G",
      env: { ...ENV_VARS },
    },
  ],
};
