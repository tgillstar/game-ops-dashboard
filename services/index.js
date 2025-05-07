require('dotenv').config();
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

async function main() {
  console.log(`Publishing to topic ${process.env.PUBSUB_TOPIC}`);
  // no-op for now
}

main().catch(console.error);
