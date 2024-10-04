from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import joblib
import os
import secrets

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grocery_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)
app.config['JWT_SECRET_KEY'] = 'your-very-secure-secret-key'

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Ensure the directory for user-specific data exists
if not os.path.exists('user_data'):
    os.makedirs('user_data')

# Ensure the directory for saving models exists
if not os.path.exists('models'):
    os.makedirs('models')

initialCategories = [
        { 'id': 1, 'name': 'Produce' },
        { 'id': 2, 'name': 'Meat & Seafood' },
        { 'id': 3, 'name': 'Dairy & Eggs' },
        { 'id': 4, 'name': 'Bakery' },
        { 'id': 5, 'name': 'Pantry' },
        { 'id': 6, 'name': 'Frozen Foods' },
        { 'id': 7, 'name': 'Beverages' },
        { 'id': 8, 'name': 'Snacks' },
        { 'id': 9, 'name': 'Personal Care' },
        { 'id': 10, 'name': 'Household' },
        { 'id': 11, 'name': 'Pet Supplies' },
        { 'id': 12, 'name': 'Deli' },
        { 'id': 13, 'name': 'Condiments & Sauces' },
        { 'id': 14, 'name': 'Canned Goods' },
        { 'id': 15, 'name': 'Pasta & Grains' },
    ]

# Load the Label Encoder if exists, else create and save
def load_label_encoder():
    label_encoder_path = 'models/label_encoder.pkl'
    if os.path.exists(label_encoder_path):
        label_encoder = joblib.load(label_encoder_path)
        logger.info("LabelEncoder loaded from saved file.")
    else:
        # If not exists, create it from initial data
        initial_data = pd.read_csv('data.csv')
        y = initial_data['Category'].tolist()
        label_encoder = LabelEncoder()
        label_encoder.fit(y)
        joblib.dump(label_encoder, label_encoder_path)
        logger.info("LabelEncoder created from initial data and saved.")
    return label_encoder

label_encoder = load_label_encoder()

# Load initial training data from CSV
initial_data = pd.read_csv('data.csv')

# Standardize the 'Item' column by converting to lowercase and stripping whitespace
initial_data['Item'] = initial_data['Item'].str.lower().str.strip()

X = initial_data['Item'].tolist()
y = initial_data['Category'].tolist()

# Use TF-IDF Vectorizer for text feature extraction
tfidf_vectorizer = TfidfVectorizer()

# Train initial model using TfidfVectorizer
initial_model = LogisticRegression(max_iter=2000)
pipeline = make_pipeline(tfidf_vectorizer, initial_model)
pipeline.fit(X, label_encoder.transform(y))
logger.info("Initial model trained.")

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(128), nullable=False)

def load_user_data(user_id):
    """
    Load the user's data from the file system if available.
    Ensure that the user history is a dictionary.
    """
    user_file = f'user_data/{user_id}.joblib'
    try:
        if os.path.exists(user_file):
            user_data = joblib.load(user_file)
            logger.info(f"User data loaded for user_id: {user_id}")
            
            # Ensure history is a dictionary, initialize if it's not
            if not isinstance(user_data.get('history', {}), dict):
                user_data['history'] = {}
            
            return user_data
    except Exception as e:
        logger.error(f"Failed to load user data for user_id {user_id}. Error: {e}")
    
    # If no user-specific data is found, return initial model and empty history
    return {'model': pipeline, 'history': {}}


@app.route('/grocery/loadUserData', methods=['GET'])
@jwt_required()
def load_user_data_endpoint():
    user_id = get_jwt_identity()
    if not user_id:
        logger.error("User ID is missing in the request")
        return jsonify({"error": "User ID is required"}), 400

    logger.info(f"Loading user data for user_id: {user_id}")

    # Load user-specific data
    user_data = load_user_data(user_id)

    if not user_data:
        logger.error(f"No data found for user_id: {user_id}")
        return jsonify({"error": "No data found"}), 404

    logger.info(f"User data loaded successfully for user_id: {user_id}")

    # Convert 'history' dict to 'userHistory' array
    user_history_list = [
        {'item': item, 'category': category}
        for item, category in user_data.get('history', {}).items()
    ]

    # Prepare response with the user's items, categories, and history
    response_data = {
        'items': user_data.get('items', []),
        'categories': user_data.get('categories', initialCategories),  # Send initial categories if none exist
        'categoryUsage': user_data.get('categoryUsage', {}),
        'userHistory': user_history_list
    }

    logger.info(f"Sending response data for user_id: {user_id}: {response_data}")
    return jsonify(response_data), 200



@app.route('/grocery/saveState', methods=['POST'])
@jwt_required()
def save_user_state():
    data = request.get_json()
    logger.info(f"Received saveState request with data: {data}")  # Log the incoming request data
    user_id = get_jwt_identity()

    # Validate input
    if not data:
        logger.error("No data provided in saveState request")
        return jsonify({"error": "No data provided"}), 400

    # Load existing user data
    user_data = load_user_data(user_id)

    # Save the entire state
    user_data['items'] = data.get('items', [])
    user_data['categories'] = data.get('categories', initialCategories)  # Use global initialCategories
    user_data['categoryUsage'] = data.get('categoryUsage', {})

    # Convert 'userHistory' array to dict
    user_history_list = data.get('userHistory', [])
    user_data['history'] = {entry['item']: entry['category'] for entry in user_history_list}

    # Save the updated user data
    save_user_data(user_id, user_data)

    return jsonify({"message": "State saved successfully"}), 200



import shutil
import tempfile

def save_user_data(user_id, data):
    """
    Save user-specific data into a file atomically.
    """
    user_file = f'user_data/{user_id}.joblib'
    temp_file = f'{user_file}.tmp'
    
    # Save data to a temporary file first, then rename (atomic save)
    joblib.dump(data, temp_file)
    shutil.move(temp_file, user_file)
    
    logger.info(f"User data saved for user_id: {user_id}")


def retrain_model_with_user_history(user_history):
    """
    Retrain the model by incorporating user-specific data with higher priority.
    Parameters:
    - user_history: Dictionary of {item_name: category}
    Returns:
    - Updated sklearn Pipeline model.
    """
    global label_encoder  # Explicitly use the global label_encoder

    # Ensure user_history is a dictionary
    if not isinstance(user_history, dict):
        logger.error("User history is not in the expected dictionary format.")
        return pipeline  # Return the original model if the history is not in the right format

    if not user_history:
        logger.info("No user history provided. Returning initial model.")
        return pipeline  # Return the initial model if no user history is present

    # Load initial data
    df_initial = pd.DataFrame({'Item': X, 'Category': y})

    # Load user history as DataFrame
    df_user = pd.DataFrame({'Item': list(user_history.keys()), 'Category': list(user_history.values())})

    # Combine categories from initial data and user history
    combined_categories = pd.concat([df_initial['Category'], df_user['Category']]).unique()

    # Check for new categories
    new_categories = set(df_user['Category']) - set(label_encoder.classes_)
    if new_categories:
        logger.info(f"New categories detected: {new_categories}. Updating LabelEncoder.")
        
        # Update the LabelEncoder by including all categories (initial + user categories)
        updated_classes = list(label_encoder.classes_) + list(new_categories)  # Combine old and new categories
        label_encoder = LabelEncoder()  # Re-initialize LabelEncoder
        label_encoder.fit(updated_classes)  # Fit it with the updated list of categories
        
        # Save the updated LabelEncoder
        joblib.dump(label_encoder, 'models/label_encoder.pkl')
        logger.info("LabelEncoder updated and saved with new categories.")
    else:
        logger.info("No new categories detected. Using existing LabelEncoder.")

    # Encode categories using the updated LabelEncoder
    try:
        df_user['Category_encoded'] = label_encoder.transform(df_user['Category'])
    except Exception as e:
        logger.error(f"Error encoding user categories: {e}")
        raise

    # Assign higher weight to user data by duplicating user entries
    user_multiplier = 20  # Adjust this multiplier as needed to prioritize user data
    df_user_weighted = pd.concat([df_user] * user_multiplier, ignore_index=True)

    # Combine initial data with weighted user data
    df_combined = pd.concat([df_initial, df_user_weighted], ignore_index=True)

    # Standardize the 'Item' column by converting to lowercase and stripping whitespace
    df_combined['Item'] = df_combined['Item'].str.lower().str.strip()

    # Encode categories
    try:
        y_combined = label_encoder.transform(df_combined['Category'])
    except Exception as e:
        logger.error(f"Error encoding combined categories: {e}")
        raise

    # Prepare data for retraining
    X_combined = df_combined['Item'].tolist()

    # Retrain the model using only logistic regression and tfidf vectorizer
    new_pipeline = make_pipeline(TfidfVectorizer(), LogisticRegression(max_iter=1000))
    new_pipeline.fit(X_combined, y_combined)
    logger.info("Model retrained with user history.")

    return new_pipeline


@app.route('/')
def home():
    return "Welcome to the Personalized Grocery Categorization API. Use /predict to get a category."

@app.route('/grocery/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    # Create new user
    new_user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()

    logger.info(f"New user created: {username}")

    # Initialize user data with default model and empty history
    user_data = {'model': pipeline, 'history': {}}
    save_user_data(new_user.id, user_data)
    logger.info(f"Initialized data for new user: {username}")

    # Automatically log in the user and generate access token
    access_token = create_access_token(identity=new_user.id)
    logger.info(f"Access token created for user: {username}")

    return jsonify({
        "message": "User created successfully",
        "access_token": access_token
    }), 201



@app.route('/grocery/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Find user
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        # Create access token
        access_token = create_access_token(identity=user.id)
        logger.info(f"User logged in: {username}")

        # Load user data
        user_data = load_user_data(user.id)

        # Retrain model with the user's history upon login
        if user_data['history']:
            logger.info('Retraining model with user history upon login...')
            user_data['model'] = retrain_model_with_user_history(user_data['history'])
            save_user_data(user.id, user_data)
            logger.info('Model retrained and saved after login.')

        return jsonify({"access_token": access_token}), 200
    else:
        logger.warning(f"Failed login attempt for username: {username}")
        return jsonify({"error": "Invalid username or password"}), 401



@app.route('/grocery/predict', methods=['POST'])
@jwt_required()
def predict():
    data = request.get_json()
    if data is None:
        logger.error("Invalid JSON data received.")
        return jsonify({"error": "Invalid JSON data"}), 400

    item_name = data.get('itemName')
    if not item_name:
        logger.error("'itemName' is missing in the request.")
        return jsonify({"error": "'itemName' is required"}), 400

    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    # Load user data
    user_data = load_user_data(user_id)

    item_name_standardized = item_name.strip().lower()

    # Check the user history first and return if found
    if 'history' in user_data and item_name_standardized in user_data['history']:
        predicted_category = user_data['history'][item_name_standardized]
        logger.info(f"Item '{item_name_standardized}' found in user history with category '{predicted_category}'.")
        # Short-circuit: return the category immediately if found in history
        return jsonify({"predictedCategory": predicted_category})

    # If not in history, proceed with model prediction
    try:
        user_model = user_data['model']
        predicted_category_encoded = user_model.predict([item_name_standardized])[0]
        predicted_category = label_encoder.inverse_transform([predicted_category_encoded])[0]
        logger.info(f"Predicted category: {predicted_category}")
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({"error": "Error during prediction"}), 500

    return jsonify({"predictedCategory": predicted_category})




@app.route('/grocery/saveItem', methods=['POST'])
@jwt_required()
def save_item():
    data = request.get_json()
    logger.info(f"Received request data for saving item: {data}")

    item_name = data.get('itemName')
    category = data.get('category')
    user_id = get_jwt_identity()

    if not item_name or not category:
        return jsonify({"error": "Item name and category are required"}), 400

    item_name_standardized = item_name.strip().lower()
    category = category.strip()

    # Load user data
    user_data = load_user_data(user_id)

    # Initialize history as a dictionary if it doesn't exist
    if 'history' not in user_data or not isinstance(user_data['history'], dict):
        user_data['history'] = {}

    # Update the item's category in the history
    user_data['history'][item_name_standardized] = category

    try:
        # Retrain the model with the updated history
        logger.info('Retraining model with user history:')
        logger.info(user_data['history'])
        model = retrain_model_with_user_history(user_data['history'])

        user_data['model'] = model
        save_user_data(user_id, user_data)
        logger.info(f"Item '{item_name_standardized}' saved with category '{category}' for user '{user_id}'.")

        # Check if the category is new and update LabelEncoder
        global label_encoder
        if category not in label_encoder.classes_:
            logger.info(f"New category '{category}' detected, updating LabelEncoder.")
            all_categories = list(label_encoder.classes_) + [category]
            label_encoder = LabelEncoder()
            label_encoder.fit(all_categories)
            joblib.dump(label_encoder, os.path.join('models', LABEL_ENCODER_PATH))
            logger.info("LabelEncoder reloaded and updated after saving.")

    except Exception as e:
        logger.error(f"Error during saving and retraining: {e}")
        return jsonify({"error": "Error saving the item and retraining the model"}), 500

    return jsonify({"message": "Item saved and model retrained successfully"})

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'The token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token provided'}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Missing or invalid authorization header'}), 401


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)