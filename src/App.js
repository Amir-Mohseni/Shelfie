import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  X,
  CheckCircle,
  Trash2,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
} from 'lucide-react';

const initialCategories = [
  { id: 1, name: 'Produce' },
  { id: 2, name: 'Meat & Seafood' },
  { id: 3, name: 'Dairy & Eggs' },
  { id: 4, name: 'Bakery' },
  { id: 5, name: 'Pantry' },
  { id: 6, name: 'Frozen Foods' },
  { id: 7, name: 'Beverages' },
  { id: 8, name: 'Snacks' },
  { id: 9, name: 'Personal Care' },
  { id: 10, name: 'Household' },
  { id: 11, name: 'Pet Supplies' },
  { id: 12, name: 'Deli' },
  { id: 13, name: 'Condiments & Sauces' },
  { id: 14, name: 'Canned Goods' },
  { id: 15, name: 'Pasta & Grains' },
];

const GroceryListApp = () => {
  // State variables for the main app functionality
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

  // State variables for authentication
  const [authToken, setAuthToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
      setAuthToken(savedToken);
      setAuthUsername(savedUsername);
      setShowAuthModal(false);
      loadUserData(savedUsername);
    }
  }, []);

  const loadUserData = (username) => {
    const savedItems = JSON.parse(localStorage.getItem(`groceryItems_${username}`)) || [];
    const savedCategoryUsage =
      JSON.parse(localStorage.getItem(`categoryUsage_${username}`)) || {};
    const savedUserHistory =
      JSON.parse(localStorage.getItem(`userHistory_${username}`)) || [];
    const savedCategories =
      JSON.parse(localStorage.getItem(`categories_${username}`)) || initialCategories;
    setItems(savedItems);
    setCategoryUsage(savedCategoryUsage);
    setUserHistory(savedUserHistory);
    setCategories(savedCategories);
  };

  useEffect(() => {
    if (newItemName.length > 2) {
      fetchPredictedCategory(newItemName);
    } else {
      setPredictedCategory('');
    }
  }, [newItemName]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername || !authPassword) {
      setAuthError('Username and password are required.');
      return;
    }

    try {
      const url =
        authMode === 'login'
          ? 'http://127.0.0.1:5000/login'
          : 'http://127.0.0.1:5000/signup';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        if (authMode === 'signup') {
          setAuthMode('login');
          setAuthError('Signup successful! Please log in.');
        } else {
          const { access_token } = data;
          setAuthToken(access_token);
          localStorage.setItem('authToken', access_token);
          localStorage.setItem('username', authUsername);
          setShowAuthModal(false);
          loadUserData(authUsername);
        }
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setAuthError('An error occurred during authentication.');
    }
  };

  const fetchPredictedCategory = async (itemName) => {
    if (!itemName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          itemName,
        }),
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
    let categoryToUse =
      selectedCategory === 'Automatic' ? predictedCategory : selectedCategory;

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

      // Update localStorage after adding item
      localStorage.setItem(
        `groceryItems_${authUsername}`,
        JSON.stringify([...items, newItem])
      );
      localStorage.setItem(
        `categoryUsage_${authUsername}`,
        JSON.stringify({
          ...categoryUsage,
          [categoryToUse]: (categoryUsage[categoryToUse] || 0) + 1,
        })
      );
      localStorage.setItem(
        `userHistory_${authUsername}`,
        JSON.stringify([...userHistory, { item: newItemName, category: categoryToUse }])
      );
      localStorage.setItem(
        `categories_${authUsername}`,
        JSON.stringify(categories)
      );

      // Send the new item data to the server when the user presses "Add Item"
      try {
        await fetch(`http://127.0.0.1:5000/saveItem`, {
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
      const existingCategory = categories.find(
        (category) => category.name.toLowerCase() === newCategoryName.toLowerCase()
      );
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

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setShowAuthModal(true);
    setAuthUsername('');
    setAuthPassword('');
    setItems([]);
    setCategories(initialCategories);
    setUserHistory([]);
    setCategoryUsage({});
  };

  if (showAuthModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="Username"
              className="bg-gray-700 text-white p-2 rounded"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              className="bg-gray-700 text-white p-2 rounded"
            />
            {authError && <div className="text-red-500">{authError}</div>}
            <button type="submit" className="bg-red-500 text-white p-2 rounded">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="mt-4 text-red-500"
          >
            {authMode === 'login'
              ? 'Create an account'
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
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

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category.name);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-4">
            <div className="flex justify-between items-center">
              {editingCategory === category.id ? (
                <input
                  type="text"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  className="bg-gray-800 text-white p-1 rounded mr-2"
                />
              ) : (
                <h2 className="text-xl font-semibold">{category.name}</h2>
              )}
              <div className="flex items-center">
                {editingCategory === category.id ? (
                  <Save
                    className="mr-2 cursor-pointer text-green-500"
                    onClick={() => saveEditedCategory(category.id)}
                  />
                ) : (
                  <Edit2
                    className="mr-2 cursor-pointer text-yellow-500"
                    onClick={() => startEditingCategory(category.id, category.name)}
                  />
                )}
                <div
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category.name)}
                >
                  {openCategories[category.name] ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </div>
            {openCategories[category.name] && (
              <ul className="mt-2">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-center mb-2">
                    {item.checked ? (
                      <CheckCircle
                        className="mr-2 text-green-500"
                        onClick={() => toggleChecked(item.id)}
                      />
                    ) : (
                      <Circle
                        className="mr-2 text-gray-500"
                        onClick={() => toggleChecked(item.id)}
                      />
                    )}
                    <span className={`${item.checked ? 'line-through' : ''}`}>
                      {item.name}
                    </span>
                    <Trash2
                      className="ml-auto text-red-500 cursor-pointer"
                      onClick={() => removeItem(item.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

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
              disabled={
                !newItemName ||
                (selectedCategory === 'Automatic' && !predictedCategory)
              }
            >
              Add Item
            </button>
            <button
              onClick={() => setIsAddingItem(false)}
              className="bg-gray-500 text-white p-2 rounded"
            >
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

export default GroceryListApp;