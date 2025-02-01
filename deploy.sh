#!/bin/bash

APP_NAME="beta.prairiewx.ca"

# Stop the CloudLinux Node.js app
printf "\nStopping App: '$APP_NAME'..."
cloudlinux-selector stop --json --interpreter nodejs --app-root ~/$APP_NAME

# Check if 'dist' directory exists
if [ -d "dist" ]; then
  printf "\nRemoving previous deployment before continuing.."
  rm -rf dist
else
  printf "\nNo previous deployment found, continuing..."
fi

# Get the latest repo
printf "\nPulling from git repo...\n"
git pull

# Activate the virtual environment
printf "\nActivating nodevenv...\n"
source /home/ryanpimi/nodevenv/$APP_NAME/20/bin/activate && cd /home/ryanpimi/$APP_NAME

# Run the npm deploy command
printf "\nDeploying app...\n"
npm run deploy

# Start the CloudLinux Node.js app
printf "\nStarting app: '$APP_NAME'..."
cloudlinux-selector start --json --interpreter nodejs --app-root ~/$APP_NAME