# Dockerfile for Flask Backend

# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install Flask Werkzeug pandas scikit-learn numpy flask-cors 

# Copy the entire application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]
