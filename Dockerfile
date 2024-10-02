# Dockerfile for frontend
FROM node:16

WORKDIR /app

# Copy package.json and package-lock.json
COPY ./public/food_data.csv /app/public/food_data.csv
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the React app
RUN npm run build

# Serve the app using a simple static server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]  # or the port of your choice
