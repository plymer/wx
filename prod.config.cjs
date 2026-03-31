const path = require("path");

const ENV_VARS = {
  NODE_ENV: "production",
  AM_I_A_SERVER: process.env.AM_I_A_SERVER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  OUTLOOK_DIR: process.env.OUTLOOK_DIR,
  STATIC_DATA_DIR: process.env.STATIC_DATA_DIR,
  PORT: 3000,
};

module.exports = {
  apps: [
    {
      name: "prairiewx-prod",
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
