import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GroceryListApp from './components/GroceryList';
import MacronutrientAnalyzer from './components/MacronutrientAnalyzer';
import HomePage from './components/HomePage';

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
