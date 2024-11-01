import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GroceryListApp from './components/GroceryList';
import HomePage from './components/HomePage'; // Remove the MacronutrientAnalyzer import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/grocery" element={<GroceryListApp />} />
      </Routes>
    </Router>
  );
}

export default App;