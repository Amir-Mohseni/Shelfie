import pandas as pd
import joblib
import os
import numpy as np

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

# Load the model and vectorizer
def load_model_and_vectorizer():
    model = joblib.load('food_model.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    return model, vectorizer

# Predict the top 3 food groups for new items
def predict_top3_food_groups(food_names, model, vectorizer):
    X_new = vectorizer.transform(food_names)
    probabilities = model.predict_proba(X_new)
    
    # Get the top 3 categories by probability for each food item
    top_3_indices = np.argsort(probabilities, axis=1)[:, -3:][:, ::-1]  # Sort and get top 3 indices in descending order
    top_3_categories = [[list(label_mapping.keys())[i] for i in indices] for indices in top_3_indices]

    return top_3_categories

# Append top 3 predictions to the CSV file and create a new file
def append_top3_predictions_to_csv(input_csv_path, output_csv_path):
    # Load the CSV file
    df = pd.read_csv(input_csv_path)

    # Load the model and vectorizer
    model, vectorizer = load_model_and_vectorizer()

    # Predict the top 3 food groups for each food name
    top_3_predictions = predict_top3_food_groups(df['name'].str.lower(), model, vectorizer)

    # Add the top 3 predictions as new columns
    df['Predicted Food Group 1'] = [pred[0] for pred in top_3_predictions]
    df['Predicted Food Group 2'] = [pred[1] for pred in top_3_predictions]
    df['Predicted Food Group 3'] = [pred[2] for pred in top_3_predictions]

    # Save the new dataframe to a new CSV file
    df.to_csv(output_csv_path, index=False)

    print(f"Top 3 predictions added and saved to {output_csv_path}")

if __name__ == "__main__":
    input_csv = "../public/food_data.csv"  # Replace with the path to your input CSV
    output_csv = "../public/new_food_data.csv"  # Replace with your desired output path

    if not os.path.exists('food_model.pkl'):
        print("Model not found! Please train the model first.")
    else:
        append_top3_predictions_to_csv(input_csv, output_csv)
