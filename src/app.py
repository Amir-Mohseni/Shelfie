from flask import Flask, request, jsonify
import numpy as np
import joblib

app = Flask(__name__)

# Load your trained model
model = joblib.load('path/to/your/model.pkl')

# Assume you have a list of category labels corresponding to your model
categories = ['Baked Foods', 'Snacks', 'Sweets', 'Vegetables', 'American Indian', 
              'Restaurant Foods', 'Beverages', 'Fats and Oils', 'Meats', 
              'Dairy and Egg Products', 'Baby Foods', 'Breakfast Cereals', 
              'Soups and Sauces', 'Beans and Lentils', 'Fish', 'Fruits', 
              'Grains and Pasta', 'Nuts and Seeds', 'Prepared Meals', 
              'Fast Foods', 'Spices and Herbs']

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    food_item = data.get('food_item')

    # Preprocess food_item to create the input features for the model
    features = preprocess_food_item(food_item)

    # Get probabilities for each category
    probabilities = model.predict_proba([features])[0]

    # Combine categories with their corresponding probabilities
    category_probabilities = {categories[i]: probabilities[i] for i in range(len(categories))}

    # Filter categories with certainty > 0.75
    high_certainty_categories = {cat: prob for cat, prob in category_probabilities.items() if prob > 0.75}

    # Sort categories by probability and take the top 3
    top_categories = sorted(category_probabilities.items(), key=lambda item: item[1], reverse=True)[:3]

    response = {
        'high_certainty_categories': high_certainty_categories,
        'top_categories': top_categories
    }

    return jsonify(response)

def preprocess_food_item(food_item):
    # Your preprocessing logic here (vectorization, feature extraction, etc.)
    # This should return a feature vector suitable for your model
    pass

if __name__ == '__main__':
    app.run(debug=True)
