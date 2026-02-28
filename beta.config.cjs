const path = require("path");

const ENV_VARS = {
  NODE_ENV: "production",
  AM_I_A_SERVER: process.env.AM_I_A_SERVER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  OUTLOOK_DIR: process.env.OUTLOOK_DIR,
  PORT: 3000,
};

module.exports = {
  apps: [
    {
      name: "prairiewx-beta",
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
    {
      name: "aq-data-processing",
      script: path.resolve(__dirname, "dist/server/data/aq-data.js"),
      instances: 1,
      exec_mode: "fork", // use form for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/aq-error.log",
      out_file: "./logs/data/aq-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "*/10 * * * *", // run every 10 minutes
    },
    {
      name: "build-station-catalog",
      script: path.resolve(__dirname, "dist/server/data/stations.js"),
      instances: 1,
      exec_mode: "fork", // use form for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/stations-error.log",
      out_file: "./logs/data/stations-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "0 0 * * *", // run once a day at midnight
    },
    {
      name: "metars-processing",
      script: path.resolve(__dirname, "dist/server/data/metars.js"),
      instances: 1,
      exec_mode: "fork", // use form for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/metars-error.log",
      out_file: "./logs/data/metars-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *", // run every minute
    },
    {
      name: "tafs-processing",
      script: path.resolve(__dirname, "dist/server/data/tafs.js"),
      instances: 1,
      exec_mode: "fork", // use form for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/tafs-error.log",
      out_file: "./logs/data/tafs-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *", // run every minute
    },
    {
      name: "sigmets-processing",
      script: path.resolve(__dirname, "dist/server/data/sigmets.js"),
      instances: 1,
      exec_mode: "fork", // use form for single-instance cron scripts
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/data/sigmets-error.log",
      out_file: "./logs/data/sigmets-out.log",
      merge_logs: true,
      env: { ...ENV_VARS },
      autorestart: false, // don't restart this script automatically
      cron_restart: "* * * * *", // run every 5 minutes
    },
  ],
};
