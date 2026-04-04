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
      name: "aq-data-processing",
      script: path.resolve(__dirname, "dist/server/data/aq-data.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/aq-error.log",
      out_file: "./logs/data/aq-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "*/10 * * * *",
    },
    {
      name: "build-station-catalog",
      script: path.resolve(__dirname, "dist/server/data/stations.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/stations-error.log",
      out_file: "./logs/data/stations-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "0 0 * * *", // run once a day at midnight
    },
    {
      name: "public-alerts-fetch",
      script: path.resolve(__dirname, "dist/server/data/public-alerts.js"),
      instances: 1,
      exec_mode: "fork",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/alerts-error.log",
      out_file: "./logs/data/alerts-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *",
    },
    {
      name: "metars-processing",
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
    {
      name: "tafs-processing",
      script: path.resolve(__dirname, "dist/server/data/tafs.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/tafs-error.log",
      out_file: "./logs/data/tafs-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *",
    },
    {
      name: "sigmets-processing",
      script: path.resolve(__dirname, "dist/server/data/sigmets.js"),
      instances: 1,
      exec_mode: "fork", // use fork for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/sigmets-error.log",
      out_file: "./logs/data/sigmets-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *",
    },
  ],
};
