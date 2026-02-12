FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .
# Expose port
EXPOSE 3000

CMD ["node", "server.js"]
