# Use the official lightweight Node image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose no ports (it's a publisher)
# But document that logs go to stdout

# Default environment variables (just documentation)
ENV EVENT_INTERVAL_MS=100
ENV PUBSUB_TOPIC=game-events

# Run the generator
CMD ["node", "index.js"]
