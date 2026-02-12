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

# Create the data files if they don't exist (prevents crashes on first run)
RUN echo "[]" > movies.json && echo "{}" > collections.json

# Expose the port Render will use
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
