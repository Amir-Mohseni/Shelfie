import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import os

# Define constants
INITIAL_MODEL_PATH = 'initial_category_model.pkl'
LABEL_ENCODER_PATH = 'label_encoder.pkl'

# Ensure the directory for saving models exists
os.makedirs('models', exist_ok=True)

# Load the data
df = pd.read_csv('data.csv')

# Standardize the 'Item' column by converting to lowercase and stripping whitespace
df['Item'] = df['Item'].str.lower().str.strip()

X = df['Item'].tolist()
y = df['Category'].tolist()

# Initialize and fit the Label Encoder
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Save the Label Encoder for future use
joblib.dump(label_encoder, os.path.join('models', LABEL_ENCODER_PATH))
print("Label encoder saved.")

# Function to train the model
def train_model(X, y, user_history=None, user_multiplier=5):
    """
    Train the Logistic Regression model with optional user history.

    Parameters:
    - X: List of item names from the initial dataset.
    - y: List of corresponding categories.
    - user_history: Optional list of dictionaries with 'item' and 'category' keys.
    - user_multiplier: Multiplier to weight user data higher than initial data.

    Returns:
    - Trained sklearn Pipeline model.
    """
    if user_history:
        # Extract items and categories from user history
        user_items = [entry['item'] for entry in user_history]
        user_categories = [entry['category'] for entry in user_history]

        # Extend the dataset with user data, replicating user data to increase its weight
        X_extended = X + user_items * user_multiplier
        y_extended = y + user_categories * user_multiplier
    else:
        X_extended = X.copy()
        y_extended = y.copy()

    # Encode the labels
    y_encoded_extended = label_encoder.transform(y_extended)

    # Use TF-IDF Vectorizer for text feature extraction
    vectorizer = TfidfVectorizer()

    # Initialize the Logistic Regression model
    lr_model = LogisticRegression(max_iter=1000)

    # Create the pipeline
    pipeline = make_pipeline(vectorizer, lr_model)

    # Train the model
    pipeline.fit(X_extended, y_encoded_extended)

    return pipeline

# Initial training without user history
initial_model = train_model(X, y)

# Save the initial model
joblib.dump(initial_model, os.path.join('models', INITIAL_MODEL_PATH))
print("Initial model saved.")

def retrain_model_with_user_history(user_history):
    """
    Retrain the model by incorporating user-specific data with higher priority.

    Parameters:
    - user_history: List of dictionaries with 'item' and 'category' keys.

    Returns:
    - Updated sklearn Pipeline model.
    """
    updated_model = train_model(X, y, user_history=user_history)
    print("Model retrained with user history.")
    return updated_model

# Example usage:
if __name__ == "__main__":
    # Example user history
    example_user_history = [
        {'item': 'brown bread', 'category': 'Bakery'},
        {'item': 'whole grain bread', 'category': 'Bakery'}
    ]

    # Retrain the model with user history
    updated_model = retrain_model_with_user_history(example_user_history)

    # Save the updated model
    joblib.dump(updated_model, os.path.join('models', 'updated_category_model.pkl'))
    print("Updated model saved.")
