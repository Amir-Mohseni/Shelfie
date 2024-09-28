import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# Step 1: Read the CSV file with low_memory=False to avoid DtypeWarning
file_path = 'food_data.csv'
food_data = pd.read_csv(file_path, low_memory=False)

# Step 2: Select relevant columns for macronutrients, vitamins, minerals, and fats
nutrient_columns = [
    'Calories', 'Fat (g)', 'Saturated Fats (g)', 'Trans Fatty Acids (g)',
    'Fatty acids, total monounsaturated (mg)', 'Fatty acids, total polyunsaturated (mg)', 
    'Protein (g)', 'Carbohydrate (g)', 'Sugars (g)', 'Fiber (g)', 
    'Calcium (mg)', 'Iron, Fe (mg)', 'Potassium, K (mg)', 'Magnesium (mg)', 
    'Vitamin A, RAE (mcg)', 'Vitamin C (mg)', 'Vitamin D (mcg)', 'Vitamin E (Alpha-Tocopherol) (mg)', 
    'Vitamin B-12 (mcg)', 'Folate (B9) (mcg)'
]

# Step 3: Convert selected columns to numeric, forcing errors to NaN
for col in nutrient_columns:
    food_data[col] = pd.to_numeric(food_data[col], errors='coerce')

# Step 4: Handle missing values (drop rows with NaN in the selected columns)
food_data = food_data.dropna(subset=nutrient_columns)

# Step 5: Normalize the data
scaler = MinMaxScaler(feature_range=(0, 10))
normalized_nutrients = scaler.fit_transform(food_data[nutrient_columns])

# Step 6: Define category ratings
category_ratings = {
    'Fruits': 3,
    'Vegetables': 3,
    'Snacks': -2,
    'Sweets': -3,
    'Fast Foods': -3,
    'Fish': 3,
    'Meats': 1.5,
    'Dairy and Egg Products': 3,
    'Baked Foods': 2,
    'Restaurant Foods': 0,
    'Beverages': -1,
    'Beans and Lentils': 3,
    'Nuts and Seeds': 3,
    'Grains and Pasta': -1,
    'Prepared Meals': -3,
    'Spices and Herbs': 0,
    'Fats and Oils': 0
}

# Step 7: Create a rating function that considers nutrients and food category
def rate_food(nutrient_profile, food_name, food_group_1, food_group_2, food_group_3):
    (calories, total_fat, saturated_fat, trans_fat, monounsaturated_fat, polyunsaturated_fat,
     protein, carbs, sugars, fiber, calcium, iron, potassium, magnesium, 
     vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_b12, folate) = nutrient_profile
    
    # Base nutrient rating
    rating = (
        0.15 * protein + 0.1 * fiber - 0.1 * total_fat - 0.35 * sugars + 
        0.20 * calcium + 0.20 * iron + 0.05 * potassium + 0.05 * magnesium + 
        0.15 * vitamin_a + 0.15 * vitamin_c + 0.15 * vitamin_d + 0.15 * vitamin_e +
        0.15 * vitamin_b12 + 0.05 * folate
    )
    
    # Adjust the score based on healthy vs. unhealthy fats
    rating += 0.1 * (monounsaturated_fat + polyunsaturated_fat)  # Reward healthy fats
    rating -= 0.4 * (saturated_fat + trans_fat)  # Penalize unhealthy fats

    # Add calorie control: slightly penalize extremely high-calorie foods
    if calories < 60:
        rating += 1
    if calories > 250:
        rating -= 0.1 * (calories - 500) / 100
    
    # Adjust score based on food groups (categories)
    food_groups = [food_group_1, food_group_2, food_group_3]
    for group in food_groups:
        if group in category_ratings:
            rating += category_ratings[group]  # Add the category rating directly

    # Ensure the rating is within 0-10
    return max(0, min(10, rating))

# Step 8: Apply the rating function to each food item
food_data['Rating'] = [
    rate_food(profile, food_name, group1, group2, group3) 
    for profile, food_name, group1, group2, group3 in zip(
        normalized_nutrients, food_data['name'], 
        food_data['Predicted Food Group 1'], 
        food_data['Predicted Food Group 2'], 
        food_data['Predicted Food Group 3'])
]

# Step 9: Scale ratings to a 0-10 range
max_rating = food_data['Rating'].max()
food_data['Scaled Rating'] = food_data['Rating'] / max_rating * 10

# Step 10: Sort the DataFrame by the 'Scaled Rating' column (descending order)
sorted_food_data = food_data[['name', 'Scaled Rating']].sort_values(by='Scaled Rating', ascending=False)

# Step 11: Save the sorted data to a new CSV file
output_file = 'food_ratings.csv'
sorted_food_data.to_csv(output_file, index=False)

# Print confirmation
print(f"Sorted and scaled ratings with categories saved to {output_file}")
