require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env')
});

const { PubSub } = require('@google-cloud/pubsub');
const { v4: uuid } = require('uuid');
const pubsub = new PubSub({ projectId: process.env.PROJECT_ID });

const TOPIC = process.env.PUBSUB_TOPIC;
const INTERVAL_MS = parseInt(process.env.EVENT_INTERVAL_MS, 10) || 100;

// Define event types and weights
const EVENT_TYPES = [
  { type: 'login', weight: 5 },
  { type: 'match_start', weight: 3 },
  { type: 'match_end', weight: 3 },
  { type: 'chat', weight: 15 },
  { type: 'purchase', weight: 1 },
  { type: 'error', weight: 1 },
];

// Utility to pick a random type based on weight
function pickEventType() {
  const total = EVENT_TYPES.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * total;
  for (const e of EVENT_TYPES) {
    if (r < e.weight) return e.type;
    r -= e.weight;
  }
}

// Build metadata based on event type
function buildMetadata(type) {
  switch (type) {
    case 'login':
      return { region: 'us-central1' };
    case 'match_start':
    case 'match_end':
      return { matchId: uuid(), duration: Math.floor(Math.random() * 300) };
    case 'chat':
      return { userId: uuid(), message: 'Hello world!' };
    case 'purchase':
      return { itemId: `item-${Math.ceil(Math.random() * 100)}`, amount: (Math.random() * 50).toFixed(2) };
    case 'error':
      return { errorCode: `E${Math.floor(Math.random() * 1000)}`, severity: 'high' };
    default:
      return {};
  }
}

// Kick off the loop and keep a reference for shutdown
let timer = setInterval(publishEvent, INTERVAL_MS);

// Back-off settings
let backoffMs = INTERVAL_MS;
const MAX_BACKOFF_MS = 10000; // Cap at 10s

// Graceful shutdown on SIGINT (Ctrl+C) and SIGTERM (container stop)
process.on('SIGINT', () => {
  console.log('\n Caught SIGINT. Shutting down generator…');
  clearInterval(timer);
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n Caught SIGTERM. Shutting down generator…');
  clearInterval(timer);
  process.exit(0);
});

async function publishEvent() {
  const type = pickEventType();
  const event = {
    id: uuid(),
    type,
    timestamp: new Date().toISOString(),
    metadata: buildMetadata(type),
  };
  const dataBuffer = Buffer.from(JSON.stringify(event));

  try {
    const messageId = await pubsub.topic(TOPIC).publish(dataBuffer);
    console.log(`Published ${type} (${messageId})`);

    // If we were in back-off, restore normal interval
    if (backoffMs !== INTERVAL_MS) {
      clearInterval(timer);
      backoffMs = INTERVAL_MS;
      timer = setInterval(publishEvent, INTERVAL_MS);
      console.log('Recovered—resuming normal publish rate');
    }
  } catch (err) {
    console.error(`Publish error, backing off for ${backoffMs}ms`, err);

    // Stop the regular interval
    clearInterval(timer);

    // If we’re already at max backoff, give up entirely
    if (backoffMs >= MAX_BACKOFF_MS) {
      console.error(`Reached max back-off of ${MAX_BACKOFF_MS}ms. Exiting generator.`);
      process.exit(1);
    }

    // Otherwise wait backoffMs, then restart the loop and increase backoff
    setTimeout(() => {
      timer = setInterval(publishEvent, INTERVAL_MS);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      console.log(`Retrying publishes; next back-off up to ${backoffMs}ms if errors continue`);
    }, backoffMs);
  }
}

// Export for testing
module.exports = {
  pickEventType,
  buildMetadata
};