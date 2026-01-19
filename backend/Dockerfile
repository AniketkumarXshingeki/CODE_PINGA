# Base image
FROM node:20-alpine
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Start the server
EXPOSE 3000
CMD ["npm", "run", "start:prod"]