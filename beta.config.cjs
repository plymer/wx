const path = require("path");

module.exports = {
  apps: [
    {
      name: "prairiewx-beta",
      script: path.resolve(__dirname, "dist/main.js"),
      instances: "max", // Use 'max' to scale to all available CPU cores
      exec_mode: "cluster",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/app-error.log",
      out_file: "./logs/app-out.log",
      merge_logs: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development", // Default environment if not specifying
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production", // Environment variables for production
        PORT: 3000,
      },
    },
  ],
};
