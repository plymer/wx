const path = require("path");
const dotenv = require("dotenv/config");

const ENV_VARS = {
  NODE_ENV: "production",
  SQLITE_PATH: process.env.SQLITE_PATH,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT ?? "5432",
  // PM2 runs on the host; use loopback to reach the published Postgres/PgBouncer port.
  DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
  OUTLOOK_DIR: process.env.OUTLOOK_DIR,
  STATIC_DATA_DIR: process.env.STATIC_DATA_DIR,
  TILES_DIR: process.env.TILES_DIR,
};

module.exports = {
  apps: [
    {
      name: "data-processing",
      script: path.resolve(__dirname, "dist/server/data/index.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data-error.log",
      out_file: "./logs/data-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *",
    },
  ],
};
