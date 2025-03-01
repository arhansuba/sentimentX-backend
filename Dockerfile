FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Set the command to start the app
CMD ["npm", "run", "start:prod"]