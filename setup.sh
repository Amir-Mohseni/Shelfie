
#!/bin/bash

echo "Setting up the Grocery List App..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Set up Python virtual environment and install dependencies
echo "Setting up Python environment and installing dependencies..."
cd src/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../../

# Start both frontend and backend servers
echo "Starting both frontend and backend servers..."
npm run dev
