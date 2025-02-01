#!/bin/bash

APP_NAME="wx"

# cloudlinux-selector set --json --interpreter nodejs --selector-status enabled

# cloudlinux-selector set --json --interpreter nodejs --default-version 20

# cloudlinux-selector set --json --interpreter nodejs --app-root apps_dir/app1 

# Stop the CloudLinux Node.js app
echo "Stopping CloudLinux app '$APP_NAME'..."
sc stop $APP_NAME

# Check if 'dist' directory exists
if [ -d "dist" ]; then
  echo "'dist' directory found, deleting it..."
  rm -rf dist
else
  echo "'dist' directory does not exist."
fi

# Run the npm deploy command
echo "Running 'npm run deploy'..."
npm run deploy

# Start the CloudLinux Node.js app
echo "Starting CloudLinux app '$APP_NAME'..."
sc start $APP_NAME