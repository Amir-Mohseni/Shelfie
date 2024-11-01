
# Grocery List App

This project is a full-stack Grocery List app built with a React frontend and a Flask backend. The frontend is bootstrapped with [React App](https://github.com/facebook/create-react-app), and the backend provides API endpoints for user authentication and data management using Flask, SQLAlchemy, and Flask-JWT-Extended.

## Features

- User Authentication (Login and Signup)
- Item categorization using machine learning
- Real-time prediction of grocery item categories
- Intuitive and responsive UI
- Persistence using SQLite database

## Prerequisites

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package installer)

## Installation Guide

To streamline the setup process, you can use the provided `setup.sh` script to automatically install dependencies and start the project.

### Using the Setup Script

1. Clone the repository:

   ```bash
   git clone https://github.com/Amir-Mohseni/grocery-list-app.git
   cd grocery-list-app
   ```

2. Run the setup script:

   ```bash
   bash setup.sh
   ```

   This script will:
   - Install Node.js dependencies
   - Set up the Python virtual environment and install Python dependencies
   - Start both the frontend and backend servers concurrently

### Manual Setup

If you prefer to install dependencies manually, follow these steps.

#### 1. Install Node.js Dependencies

In the project root, run:

```bash
npm install
```

#### 2. Install Python Dependencies

1. Navigate to the backend directory:

   ```bash
   cd src/backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use venv\Scripts\activate
   ```

3. Install Python packages:

   ```bash
   pip install -r requirements.txt
   ```

#### 3. Run the Project

To start both the frontend and backend servers, run:

```bash
npm run dev
```

- The React frontend will be available at [http://localhost:3000](http://localhost:3000).
- The Flask backend will be available at [http://localhost:5000](http://localhost:5000).

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs both the React frontend and Flask backend concurrently in development mode.

### `npm run start`

Runs only the React frontend in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run backend`

Runs only the Flask backend on [http://localhost:5000](http://localhost:5000).

### `npm run build`

Builds the React app for production to the `build` folder. The build is optimized for the best performance.

## Directory Structure

- **src**: Contains all source code.
  - **src/frontend**: React frontend.
  - **src/backend**: Flask backend.
- **public**: Static assets for the frontend.
- **requirements.txt**: Python dependencies for the backend.
- **setup.sh**: Shell script to set up and start the project.

## Troubleshooting

- Ensure you have installed all dependencies for both the frontend and backend.
- If there are issues with styles, verify that Tailwind CSS is installed and configured correctly in the frontend.

## Learn More

To learn more about the tools used in this project:

- [React Documentation](https://reactjs.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## `setup.sh` (Installation Script)

This script simplifies the setup process by installing all necessary dependencies and starting both the frontend and backend servers.

```bash
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
```

### Instructions for Using `setup.sh`

1. Make the script executable:

   ```bash
   chmod +x setup.sh
   ```

2. Run the script:

   ```bash
   ./setup.sh
   ```

This will install dependencies and start both servers.
