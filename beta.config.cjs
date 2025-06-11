const path = require("path");

module.exports = {
  apps: [
    {
      name: "prairiewx-beta",
      script: path.resolve(__dirname, "dist/main.js"),
      instances: "max",
      exec_mode: "cluster",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/app-error.log",
      out_file: "./logs/app-out.log",
      merge_logs: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        AM_I_A_SERVER: process.env.AM_I_A_SERVER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        PORT: 3000,
      },
    },
  ],
};
