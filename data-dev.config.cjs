const path = require("path");

const ENV_VARS = {
  NODE_ENV: "production",
  SQLITE_PATH: process.env.SQLITE_PATH,
  OUTLOOK_DIR: process.env.OUTLOOK_DIR,
  STATIC_DATA_DIR: process.env.STATIC_DATA_DIR,
};

module.exports = {
  apps: [
    {
      name: "dev-metars-processing",
      script: path.resolve(__dirname, "dist/server/data/metars.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/metars-error.log",
      out_file: "./logs/data/metars-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *",
    },
  ],
};
