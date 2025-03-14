const path = require('path');

module.exports = {
  apps: [
    {
      name: 'prairiewx-beta',               // The name of your app
      script: path.resolve(__dirname,'dist/main.js'),                 // Path to your entry file (the main file to start your app)
      instances: 'max',                   // 'max' will auto-detect the number of available CPU cores and fork the app accordingly
      exec_mode: 'cluster',               // Use cluster mode for better performance and multi-core scaling
      watch: true,                        // Watch for file changes and restart the app when changes are detected
      env_production: {
        NODE_ENV: 'production',          // Environment variables for production
        PORT: 3000,                       // The port your app will run on
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z', // Log date format
      error_file: './logs/app-error.log', // Path to save error logs
      out_file: './logs/app-out.log',     // Path to save standard output logs
      merge_logs: true,                   // Merge all logs into one file
      max_memory_restart: '1G',           // Restart the app if it uses more than 1 GB of memory
    },
  ],
};

