FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose backend API port
EXPOSE 5000

# Start server in dev mode with hot reload
CMD ["npm", "run", "dev"]
