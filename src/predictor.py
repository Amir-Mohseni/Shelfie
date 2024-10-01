import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import numpy as np
import joblib
import os
import sys

label_mapping = {
    'Baked Foods': 0,
    'Snacks': 1,
    'Sweets': 2,
    'Vegetables': 3,
    'American Indian': 4,
    'Restaurant Foods': 5,
    'Beverages': 6,
    'Fats and Oils': 7,
    'Meats': 8,
    'Dairy and Egg Products': 9,
    'Baby Foods': 10,
    'Breakfast Cereals': 11,
    'Soups and Sauces': 12,
    'Beans and Lentils': 13,
    'Fish': 14,
    'Fruits': 15,
    'Grains and Pasta': 16,
    'Nuts and Seeds': 17,
    'Prepared Meals': 18,
    'Fast Foods': 19,
    'Spices and Herbs': 20,
}

# Step 1: Load data from the CSV file
def load_data(file_path):
    df = pd.read_csv(file_path)
    return df

# Step 2: Preprocess data
def preprocess_data(df):
    df = df.dropna(subset=["name", "Food Group"])
    df['Food Group'] = df['Food Group'].map(label_mapping)
    df = df.dropna(subset=['Food Group'])
    df['name'] = df['name'].str.lower()
    return df

# Step 3: Extract features using TF-IDF
def extract_features(df):
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(df['name'])
    return X, vectorizer

# Step 4: Train and save the model
def train_and_save_model(file_path):
    df = load_data(file_path)
    df = preprocess_data(df)

    X, vectorizer = extract_features(df)
    y = df['Food Group']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    # Save the model and vectorizer
    joblib.dump(model, 'food_model.pkl')
    joblib.dump(vectorizer, 'vectorizer.pkl')

    y_pred = model.predict(X_test)
    print("Classification Report:\n", classification_report(y_test, y_pred))

# Step 5: Predict food groups for new items and check filters
def predict_food_groups(food_names):
    # Load the model and vectorizer
    model = joblib.load('food_model.pkl')
    vectorizer = joblib.load('vectorizer.pkl')

    # Transform the input food names
    X_new = vectorizer.transform(food_names)
    
    # Predict food groups
    predictions = model.predict(X_new)
    return predictions

# Check if the food item is within the category filters
def is_item_visible(food_name, category_filters):
    predictions = predict_food_groups([food_name])
    category = list(label_mapping.keys())[list(label_mapping.values()).index(predictions[0])]
    return category_filters.get(category, False)

if __name__ == "__main__":
    # Check if the model exists
    if not os.path.exists('food_model.pkl'):
        file_path = '../public/food_data.csv'  # Replace with your file path
        train_and_save_model(file_path)
    else:
        print("Model already exists. Skipping training.")

    # Get the food item from command line arguments
    if len(sys.argv) > 1:
        food_item = sys.argv[1].lower()  # Get the food item name from the command line
        # Define the category filters (This could be dynamic based on your needs)
        category_filters = {
            'Baked Foods': True,
            'Snacks': True,
            'Sweets': False,
            'Vegetables': True,
            # Add other categories and their filter status
        }
        # Check if the food item should be visible
        visible = is_item_visible(food_item, category_filters)
        if visible:
            print(f"'{food_item}' is visible.")
        else:
            print(f"'{food_item}' is not visible.")
    else:
        print("Please provide a food item as an argument.")
