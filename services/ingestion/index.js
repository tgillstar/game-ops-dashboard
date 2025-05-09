const fs   = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { PubSub } = require('@google-cloud/pubsub');
const { Pool }   = require('pg');

const projectId      = process.env.PROJECT_ID;
const subscriptionId = process.env.PUBSUB_SUBSCRIPTION;
const dbConfig       = {
  host:     process.env.PG_HOST,       
  port:     parseInt(process.env.PG_PORT, 10), 
  database: process.env.PG_DATABASE,   
  user:     process.env.PG_USER,       
  password: process.env.PG_PASSWORD,   
};

const pubsub       = new PubSub({ projectId });
const subscription = pubsub.subscription(subscriptionId);
const pool         = new Pool(dbConfig);

subscription.on('message', async message => {
  console.log(`Received message ${message.id}`);
  
  // Parse the JSON payload
  let event;
  try {
    event = JSON.parse(message.data.toString());
  } catch (err) {
    console.error('Failed to parse message data as JSON:', err);
    // Acknowledge so it isn’t retried endlessly
    return message.ack();
  }

  // Destructure for clarity
  const { id, type, timestamp, metadata } = event;

  // Insert into Postgres
  try {
    await pool.query(
      `INSERT INTO game_events(id, type, timestamp, metadata)
       VALUES($1, $2, $3, $4)`,
      [id, type, timestamp, JSON.stringify(metadata)]
    );
    console.log(`💾 Stored event ${id}`);
    message.ack();
  } catch (err) {
    console.error('DB insert error:', err);
  }
});

// Handle subscription errors
subscription.on('error', err => {
  console.error('Subscription error:', err);
});