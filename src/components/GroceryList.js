import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import CategoryList from './CategoryList';
import { PlusCircle, X } from 'lucide-react';
import { initialCategories } from '../data/categories';

const GroceryList = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Automatic');
  const [predictedCategory, setPredictedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryUsage, setCategoryUsage] = useState({});
  const [openCategories, setOpenCategories] = useState(() =>
    initialCategories.reduce((acc, category) => ({ ...acc, [category.name]: true }), {})
  );
  const [userHistory, setUserHistory] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [categoryUpdates, setCategoryUpdates] = useState({});
  
  const [authToken, setAuthToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authUsername, setAuthUsername] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
      setAuthToken(savedToken);
      setAuthUsername(savedUsername);
      setShowAuthModal(false);
      loadUserData(savedToken);
    }
  }, []);  

  const loadUserData = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/grocery/loadUserData', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        console.error('Failed to load user data');
        return;
      }
  
      const data = await response.json();
      setItems(data.items);
      setCategories(data.categories);
      setCategoryUsage(data.categoryUsage);
      setUserHistory(data.userHistory);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  

  const saveUserData = async () => {
    const stateData = {
      items,
      categories,
      categoryUsage,
      userHistory
    };
  
    try {
      const response = await fetch('http://127.0.0.1:5000/grocery/saveState', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(stateData),
      });
  
      if (!response.ok) {
        console.error('Failed to save user data');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  

  useEffect(() => {
    if (newItemName.length > 2) {
      fetchPredictedCategory(newItemName);
    } else {
      setPredictedCategory('');
    }
  }, [newItemName]);

  const handleAuth = async (username, password, isLogin) => {
    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const response = await fetch(`http://127.0.0.1:5000/grocery/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
  
      if (response.ok) {
        const { access_token } = data;
        setAuthToken(access_token);
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('username', username);
        setShowAuthModal(false);
        loadUserData(access_token); // Pass the token here
      } else {
        throw new Error(data.error || `${isLogin ? 'Login' : 'Signup'} failed`);
      }
    } catch (error) {
      throw new Error(error.message || `An error occurred during ${isLogin ? 'login' : 'signup'}`);
    }
  };
  

  const fetchPredictedCategory = async (itemName) => {
    if (!itemName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/grocery/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ itemName }),
      });
      const data = await response.json();
      setPredictedCategory(data.predictedCategory);
      setSelectedCategory('Automatic');
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching predicted category:', error);
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    let categoryToUse = selectedCategory === 'Automatic' ? predictedCategory : selectedCategory;

    if (newItemName && (categoryToUse || selectedCategory === 'Automatic')) {
      if (!categories.find((category) => category.name === categoryToUse)) {
        const newCategory = { id: Date.now(), name: categoryToUse };
        setCategories((prevCategories) => [...prevCategories, newCategory]);
      }

      const newItem = {
        id: Date.now(),
        name: newItemName,
        category: categoryToUse,
        checked: false,
      };
      setItems((prevItems) => [...prevItems, newItem]);

      setNewItemName('');
      setSelectedCategory('Automatic');
      setPredictedCategory('');
      setIsAddingItem(false);

      setCategoryUsage((prevUsage) => ({
        ...prevUsage,
        [categoryToUse]: (prevUsage[categoryToUse] || 0) + 1,
      }));

      setUserHistory((prevHistory) => [
        ...prevHistory,
        { item: newItemName, category: categoryToUse },
      ]);

      localStorage.setItem(`groceryItems_${authUsername}`, JSON.stringify([...items, newItem]));
      localStorage.setItem(
        `categoryUsage_${authUsername}`,
        JSON.stringify({
          ...categoryUsage,
          [categoryToUse]: (categoryUsage[categoryToUse] || 0) + 1,
        })
      );
      localStorage.setItem(`userHistory_${authUsername}`, JSON.stringify([...userHistory, { item: newItemName, category: categoryToUse }]));
      localStorage.setItem(`categories_${authUsername}`, JSON.stringify(categories));

      try {
        await fetch(`http://127.0.0.1:5000/grocery/saveItem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            itemName: newItemName,
            category: categoryToUse,
          }),
        });
      } catch (error) {
        console.error('Error sending data to server:', error);
      }
    }
  };

  const addCategory = () => {
    if (newCategoryName) {
      const existingCategory = categories.find((category) => category.name.toLowerCase() === newCategoryName.toLowerCase());
      if (existingCategory) {
        setSelectedCategory(existingCategory.name);
      } else {
        const newCategory = { id: Date.now(), name: newCategoryName };
        setCategories((prevCategories) => [...prevCategories, newCategory]);
        setSelectedCategory(newCategoryName);
      }

      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const toggleChecked = (itemId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
    setTimeout(() => {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }, 800);
  };

  const removeItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const startEditingCategory = (categoryId, categoryName) => {
    setEditingCategory(categoryId);
    setEditedCategoryName(categoryName);
  };

  const saveEditedCategory = (categoryId) => {
    if (editedCategoryName.trim() !== '') {
      const oldCategoryName = categories.find((c) => c.id === categoryId).name;
      const newCategoryName = editedCategoryName.trim();

      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === categoryId ? { ...category, name: newCategoryName } : category
        )
      );

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.category === oldCategoryName
            ? { ...item, category: newCategoryName }
            : item
        )
      );

      setCategoryUsage((prevUsage) => {
        const { [oldCategoryName]: oldUsage, ...rest } = prevUsage;
        return {
          ...rest,
          [newCategoryName]: oldUsage || 0,
        };
      });

      setUserHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.category === oldCategoryName
            ? { ...entry, category: newCategoryName }
            : entry
        )
      );

      setCategoryUpdates((prevUpdates) => ({
        ...prevUpdates,
        [oldCategoryName]: newCategoryName,
      }));

      setEditingCategory(null);
      setEditedCategoryName('');
    }
  };

  const logout = async () => {
    await saveUserData();  // Save the user's state before logging out
  
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setShowAuthModal(true);
    setAuthUsername('');
    setItems([]);
    setCategories(initialCategories);
    setUserHistory([]);
    setCategoryUsage({});
  };

  if (showAuthModal) {
    return (
      <AuthModal
        onLogin={(username, password) => handleAuth(username, password, true)}
        onSignup={(username, password) => handleAuth(username, password, false)}
      />
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-red-500">Grocery List</h1>
        <button onClick={logout} className="bg-gray-700 text-white p-2 rounded">
          Logout
        </button>
      </div>

      <CategoryList
        categories={categories}
        items={items}
        openCategories={openCategories}
        toggleCategory={toggleCategory}
        startEditingCategory={startEditingCategory}
        saveEditedCategory={saveEditedCategory}
        editingCategory={editingCategory}
        editedCategoryName={editedCategoryName}
        setEditedCategoryName={setEditedCategoryName}
        toggleChecked={toggleChecked}
        removeItem={removeItem}
      />

      {isAddingItem ? (
        <div className="mt-4">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter item name"
            className="bg-gray-800 text-white p-2 rounded mb-2 w-full"
          />

          <select
            value={selectedCategory === 'Automatic' ? 'Automatic' : selectedCategory}
            onChange={(e) => {
              if (e.target.value === 'addCustom') {
                setIsAddingCategory(true);
              } else {
                setSelectedCategory(e.target.value);
              }
            }}
            className="bg-gray-800 text-white p-2 rounded mb-2 w-full"
          >
            <option value="Automatic">Automatic (AI)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
            <option value="addCustom">Add custom category</option>
          </select>

          {isAddingCategory && (
            <div className="flex mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="bg-gray-800 text-white p-2 rounded mr-2 flex-grow"
              />
              <button onClick={addCategory} className="bg-red-500 text-white p-2 rounded">
                Add Category
              </button>
            </div>
          )}

          {selectedCategory === 'Automatic' && predictedCategory && (
            <div className="text-white mt-2">
              Predicted Category: {predictedCategory}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={addItem}
              className="bg-red-500 text-white p-2 rounded"
              disabled={!newItemName || (selectedCategory === 'Automatic' && !predictedCategory)}
            >
              Add Item
            </button>
            <button onClick={() => setIsAddingItem(false)} className="bg-gray-500 text-white p-2 rounded">
              <X />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingItem(true)}
          className="flex items-center justify-center w-full text-red-500 mt-4 p-2 border-2 border-red-500 rounded"
        >
          <PlusCircle className="mr-2" />
          New Item
        </button>
      )}
    </div>
  );
};

export default GroceryList;