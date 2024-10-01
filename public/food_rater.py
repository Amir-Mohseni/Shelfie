import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np

# Step 1: Read the CSV file with low_memory=False to avoid DtypeWarning
file_path = 'food_data.csv'
food_data = pd.read_csv(file_path, low_memory=False)

# Step 2: Select relevant columns for macronutrients
nutrient_columns = ['Calories', 'Fat (g)', 'Protein (g)', 'Carbohydrate (g)', 'Sugars (g)', 'Fiber (g)']

# Step 3: Convert selected columns to numeric, forcing errors to NaN
for col in nutrient_columns:
    food_data[col] = pd.to_numeric(food_data[col], errors='coerce')

# Step 4: Handle missing values (you can choose to drop them or fill them)
food_data = food_data.dropna(subset=nutrient_columns)  # Drops rows with NaN values in nutrient columns

# Step 5: Normalize the data
scaler = MinMaxScaler(feature_range=(0, 10))
normalized_nutrients = scaler.fit_transform(food_data[nutrient_columns])

# Step 6: Create a rating function
def rate_food(nutrient_profile):
    calories, fat, protein, carbs, sugars, fiber = nutrient_profile
    
    # Example rating logic
    rating = (0.2 * protein + 0.1 * fiber - 0.2 * sugars - 0.1 * fat + 0.5 * carbs)
    
    return max(0, min(10, rating))  # Ensure rating is between 0 and 10

# Step 7: Apply the rating function to each food item
food_data['Rating'] = [rate_food(profile) for profile in normalized_nutrients]

# Step 8: Display the data with ratings
print(food_data[['ID', 'name', 'Rating']])
