# Use the official lightweight Node image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# No ports exposed; this is a subscriber
CMD ["node", "index.js"]
