import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GroceryListApp from './GroceryListApp';
import MacronutrientAnalyzer from './MacronutrientAnalyzer';
import HomePage from './HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/grocery" element={<GroceryListApp />} />
        <Route path="/analyzer" element={<MacronutrientAnalyzer />} />
      </Routes>
    </Router>
  );
}

export default App;