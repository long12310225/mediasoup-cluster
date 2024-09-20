set -e

ENV=$1

echo "Running in ${ENV} environment......."
pnpm run build

if [ $ENV = "fat_main" ]; then
  pm2 start sh/run/pm2_main.json --env fat --no-daemon
elif [ $ENV = "fat_producer" ]; then
  pm2 start sh/run/pm2_producer.json --env fat --no-daemon
elif [ $ENV = "fat_consumer" ]; then
  pm2 start sh/run/pm2_consumer.json --env fat --no-daemon
elif [ $ENV = "prod_main" ]; then
  pm2 start sh/run/pm2_main.json --env prod --no-daemon
elif [ $ENV = "prod_producer" ]; then
  pm2 start sh/run/pm2_producer.json --env prod --no-daemon
elif [ $ENV = "prod_consumer" ]; then
  pm2 start sh/run/pm2_consumer.json --env prod --no-daemon
fi
