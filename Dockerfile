# Use a lightweight Node.js version
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your backend code (index.js, index.html, etc.)
COPY . .

# Expose the port Render will use
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
