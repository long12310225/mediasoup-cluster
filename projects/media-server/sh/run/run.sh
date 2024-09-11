set -e

ENV=$1

if [ $ENV = "qa_main" ]; then
  echo "Running in qa_main environment......."
  pm2 start sh/run/pm2_qa_main.json --env qa --no-daemon
elif [ $ENV = "qa_producer" ]; then
  echo "Running in qa_producer environment......."
  pm2 start sh/run/pm2_qa_producer.json --env qa --no-daemon
elif [ $ENV = "qa_consumer" ]; then
  echo "Running in qa_consumer environment......."
  pm2 start sh/run/pm2_qa_consumer.json --env qa --no-daemon
elif [ $ENV = "dev" ]; then
  echo "Running in dev environment......."
  pm2 start sh/run/pm2_dev.json --env dev --no-daemon
fi
