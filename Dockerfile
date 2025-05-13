FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies efficiently
RUN apk add --no-cache --virtual .gyp python3 make g++ && \
    npm install && \
    npm install -g nodemon && \
    apk del .gyp

# Copy source code
COPY . .

# Create necessary directories for volumes
RUN mkdir -p src public

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"] 