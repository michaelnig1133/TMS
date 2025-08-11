# Stage1: Build
# Use official Node.js image
FROM node:18-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the React app for production
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Install a simple server to serve the built app
# RUN npm install -g serve

# Expose port 3000
EXPOSE 80

# Start the production server
# CMD ["serve", "-s", "build", "-l", "3000"]
CMD ["nginx", "-g", "daemon off;"]
