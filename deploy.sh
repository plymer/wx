#! /usr/bin/env bash

if [ ! -f .env ]; then
  echo "Error: .env file not found - no database credentials available"
  exit 1
fi

source .env

# stop data processing to limit chance for OOM
pm2 stop data.config.cjs 

# ensure our infra is running
docker compose up -d

# install dependencies and build the app
pnpm install
pnpm build

# ensure that the database has our postgis extension installed
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# run our migrations to ensure the database is up to date
pnpm db:push

# start the data feed
pm2 start data.config.cjs --update-env

# restart the API/tRPC server
pm2 restart prod.config.cjs --update-env

# save the current pm2 process list so that it will be resurrected on reboot
pm2 save