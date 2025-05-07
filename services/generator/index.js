require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env')
});

const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub({ projectId: process.env.PROJECT_Id });

async function publishDummyEvent() {

  const topicName = process.env.PUBSUB_TOPIC;

  // Create a simple payload
  const event = {
    type: 'login',
    userId: 'test-user',
    timestamp: new Date().toISOString(),
    metadata: { region: 'us-central1' }
  };

  const dataBuffer = Buffer.from(JSON.stringify(event));

  try {
    const messageId = await pubsub.topic(topicName).publish(dataBuffer);
    console.log(`Event published with message ID: ${messageId}`);
  } catch (err) {
    console.error('Error publishing message:', err);
  }
}

publishDummyEvent();
