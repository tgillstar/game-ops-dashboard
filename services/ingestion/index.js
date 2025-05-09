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

