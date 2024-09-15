import React, { useState, useEffect } from 'react';
import './MacronutrientAnalyzer.css'; // We'll create this CSS file next

const MacronutrientAnalyzer = () => {
  const [foodData, setFoodData] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedResults, setDisplayedResults] = useState(10);
  const [selectedFood, setSelectedFood] = useState(null);

  useEffect(() => {
    // Load CSV data
    async function loadCSV() {
      const response = await fetch(process.env.PUBLIC_URL + '/food_data.csv');
      const data = await response.text();
      const rows = data.split('\n').slice(1); // Skip header row
      const parsedData = rows.map(row => {
        const columns = row.split(',');
        return {
          name: columns[1],
          calories: parseFloat(columns[3]),
          fat: parseFloat(columns[4]),
          protein: parseFloat(columns[5]),
          carbs: parseFloat(columns[6]),
          fiber: parseFloat(columns[8]),
          sugars: parseFloat(columns[7]),
          cholesterol: parseFloat(columns[9]),
          saturatedFats: parseFloat(columns[10]),
          calcium: parseFloat(columns[11]),
          iron: parseFloat(columns[12]),
          potassium: parseFloat(columns[13]),
          magnesium: parseFloat(columns[14]),
          vitaminA: parseFloat(columns[15]),
          vitaminC: parseFloat(columns[17]),
          vitaminB12: parseFloat(columns[18]),
          vitaminD: parseFloat(columns[19]),
          vitaminE: parseFloat(columns[20]),
        };
      });
      setFoodData(parsedData);
    }

    loadCSV();
  }, []);

  useEffect(() => {
    const filtered = foodData.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (a.name.length === b.name.length) {
        return a.name.localeCompare(b.name);
      }
      return a.name.length - b.name.length;
    });

    setFilteredFoods(filtered);
    setDisplayedResults(10);
    setSelectedFood(null);
  }, [searchTerm, foodData]);

  const calculateScore = (food) => {
    // (Same scoring logic as in your original code)
    let score = 0;

    // Positive scoring: protein
    if (food.protein > 25) score += 4;
    else if (food.protein > 15) score += 3;
    else if (food.protein > 10) score += 2;
    else if (food.protein > 5) score += 1;

    // Positive scoring: fiber
    if (food.fiber > 10) score += 3;
    else if (food.fiber > 5) score += 2;
    else if (food.fiber > 2) score += 1;

    // Positive scoring: vitamins and minerals
    if (food.vitaminC > 30) score += 1;
    if (food.calcium > 100) score += 1;
    if (food.iron > 5) score += 1;
    if (food.potassium > 300) score += 1;

    // Positive scoring: low fat and carbs
    if (food.fat < 10) score += 1;
    if (food.carbs < 20) score += 1;

    // Negative scoring: sugars
    if (food.sugars > 20) score -= 2;
    else if (food.sugars > 10) score -= 1;
    else if (food.sugars < 3) score += 2;

    // Negative scoring: saturated fats
    if (food.saturatedFats > 10) score -= 2;
    else if (food.saturatedFats > 5) score -= 1;

    // Calories score modifier (rewards low-calorie foods)
    if (food.calories < 100) score += 2; // Excellent calorie range
    else if (food.calories < 200) score += 1; // Good calorie range
    else if (food.calories > 350) score -= 2; // Penalize high-calorie foods

    // Normalize the score to be within 0 to 10
    score = Math.max(0, Math.min(score, 10));

    return score;
  };

  const showDetailedView = (food) => {
    setSelectedFood(food);
  };

  const loadMoreResults = () => {
    setDisplayedResults(prev => prev + 10);
  };

  return (
    <div className="analyzer-container">
      <div className="left-panel">
        <h1>Macronutrient Profile Scorer</h1>
        <input
          type="text"
          id="searchInput"
          placeholder="Search for a food item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div id="results">
          {filteredFoods.slice(0, displayedResults).map(food => (
            <div
              key={food.name}
              className="food-item"
              onClick={() => showDetailedView(food)}
            >
              <h3>{food.name}</h3>
            </div>
          ))}
        </div>
        {filteredFoods.length > displayedResults && (
          <button id="showMoreBtn" onClick={loadMoreResults}>
            Show More
          </button>
        )}
      </div>
      {selectedFood && (
        <div className="right-panel" id="detailedView">
          <h2>{selectedFood.name}</h2>
          <p className="macro">Calories: {selectedFood.calories}</p>
          <p className="macro">Fat: {selectedFood.fat}g</p>
          <p className="macro">Protein: {selectedFood.protein}g</p>
          <p className="macro">Carbs: {selectedFood.carbs}g</p>
          <p className="macro">Fiber: {selectedFood.fiber}g</p>
          <p className="macro">Sugars: {selectedFood.sugars}g</p>
          <p className="macro">Cholesterol: {selectedFood.cholesterol}mg</p>
          <p className="macro">Saturated Fats: {selectedFood.saturatedFats}g</p>
          <p className="macro">Calcium: {selectedFood.calcium}mg</p>
          <p className="macro">Iron: {selectedFood.iron}mg</p>
          <p className="macro">Potassium: {selectedFood.potassium}mg</p>
          <p className="macro">Magnesium: {selectedFood.magnesium}mg</p>
          <p className="macro">Vitamin A: {selectedFood.vitaminA}IU</p>
          <p className="macro">Vitamin C: {selectedFood.vitaminC}mg</p>
          <p className="macro">Vitamin B12: {selectedFood.vitaminB12}mcg</p>
          <p className="macro">Vitamin D: {selectedFood.vitaminD}mcg</p>
          <p className="macro">Vitamin E: {selectedFood.vitaminE}mg</p>
          <p>
            Score:{' '}
            <span
              className={`score ${
                calculateScore(selectedFood) >= 7
                  ? 'score-good'
                  : calculateScore(selectedFood) >= 4
                  ? 'score-medium'
                  : 'score-bad'
              }`}
            >
              {calculateScore(selectedFood)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MacronutrientAnalyzer;