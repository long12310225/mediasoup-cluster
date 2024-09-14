set -e

ENV=$1

if [ $ENV = "fat_main" ]; then
  echo "Running in fat_main environment......."
  pnpm run build
  pm2 start sh/run/pm2_fat_main.json --env fat --no-daemon
elif [ $ENV = "fat_producer" ]; then
  echo "Running in fat_producer environment......."
  pnpm run build
  pm2 start sh/run/pm2_fat_producer.json --env fat --no-daemon
elif [ $ENV = "fat_consumer" ]; then
  echo "Running in fat_consumer environment......."
  pnpm run build
  pm2 start sh/run/pm2_fat_consumer.json --env fat --no-daemon
fi
