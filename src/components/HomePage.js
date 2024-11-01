import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="split left" onClick={() => navigate('/grocery')}>
        <h2>Grocery List App</h2>
      </div>
    </div>
  );
};

export default HomePage;