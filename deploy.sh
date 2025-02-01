#!/bin/bash

APP_NAME="beta.prairiewx.ca"

# Stop the CloudLinux Node.js app
echo "Stopping App: '$APP_NAME'..."
cloudlinux-selector stop --json --interpreter nodejs --app-root ~/$APP_NAME

# Check if 'dist' directory exists
if [ -d "dist" ]; then
  echo "Removing previous deployment before continuing.."
  rm -rf dist
else
  echo "No previous deployment found, continuing..."
fi

source /home/ryanpimi/nodevenv/$APP_NAME/20/bin/activate && cd /home/ryanpimi/$APP_NAME

# Run the npm deploy command
echo "Deploying app..."
npm run deploy

# Start the CloudLinux Node.js app
echo "Starting app: '$APP_NAME'..."
cloudlinux-selector start --json --interpreter nodejs --app-root ~/$APP_NAME --startup-file dist/main.js