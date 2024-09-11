import React, { useState, useEffect } from 'react';
import { PlusCircle, X, CheckCircle, Trash2, Circle, ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react';

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
  const [userId, setUserId] = useState('');
  const [showUserModal, setShowUserModal] = useState(true);
  const [newUserId, setNewUserId] = useState('');

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      setShowUserModal(false);
      loadUserData(savedUserId);
    }
  }, []);

  const loadUserData = (id) => {
    const savedItems = JSON.parse(localStorage.getItem(`groceryItems_${id}`)) || [];
    const savedCategoryUsage = JSON.parse(localStorage.getItem(`categoryUsage_${id}`)) || {};
    const savedUserHistory = JSON.parse(localStorage.getItem(`userHistory_${id}`)) || [];
    const savedCategories = JSON.parse(localStorage.getItem(`categories_${id}`)) || initialCategories;
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
  
  const fetchPredictedCategory = async (itemName) => {
    if (!itemName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemName, 
          userHistory, 
          userId, 
          categoryUpdates 
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
    let categoryToUse = selectedCategory === 'Automatic' ? predictedCategory : selectedCategory;
    
    if (newItemName && (categoryToUse || selectedCategory === 'Automatic')) {
      if (!categories.find(category => category.name === categoryToUse)) {
        const newCategory = { id: Date.now(), name: categoryToUse };
        setCategories(prevCategories => [...prevCategories, newCategory]);
      }
  
      const newItem = { 
        id: Date.now(), 
        name: newItemName, 
        category: categoryToUse, 
        checked: false  
      };
      setItems(prevItems => [...prevItems, newItem]);
  
      setNewItemName('');
      setSelectedCategory('Automatic');
      setPredictedCategory('');
      setIsAddingItem(false);
  
      setCategoryUsage(prevUsage => ({
        ...prevUsage,
        [categoryToUse]: (prevUsage[categoryToUse] || 0) + 1
      }));
  
      setUserHistory(prevHistory => [...prevHistory, { item: newItemName, category: categoryToUse }]);
  
      // Update localStorage after adding item
      localStorage.setItem(`groceryItems_${userId}`, JSON.stringify([...items, newItem]));
      localStorage.setItem(`categoryUsage_${userId}`, JSON.stringify({
        ...categoryUsage,
        [categoryToUse]: (categoryUsage[categoryToUse] || 0) + 1
      }));
      localStorage.setItem(`userHistory_${userId}`, JSON.stringify([...userHistory, { item: newItemName, category: categoryToUse }]));
      localStorage.setItem(`categories_${userId}`, JSON.stringify(categories));
  
      // Send the new item data to the server when the user presses "Add Item"
      try {
        await fetch(`http://127.0.0.1:5000/saveItem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemName: newItemName,
            category: categoryToUse,
            userId,
          }),
        });
      } catch (error) {
        console.error('Error sending data to server:', error);
      }
    }
  };

  const addCategory = () => {
    if (newCategoryName) {
      const existingCategory = categories.find(category => category.name.toLowerCase() === newCategoryName.toLowerCase());
      if (existingCategory) {
        setSelectedCategory(existingCategory.name);
      } else {
        const newCategory = { id: Date.now(), name: newCategoryName };
        setCategories(prevCategories => [...prevCategories, newCategory]);
        setSelectedCategory(newCategoryName);
      }

      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const toggleChecked = (itemId) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId 
          ? { ...item, checked: !item.checked } 
          : item
      )
    );

    setTimeout(() => {
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }, 800);
  };

  const removeItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const toggleCategory = (categoryName) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const startEditingCategory = (categoryId, categoryName) => {
    setEditingCategory(categoryId);
    setEditedCategoryName(categoryName);
  };

  const saveEditedCategory = (categoryId) => {
    if (editedCategoryName.trim() !== '') {
      const oldCategoryName = categories.find(c => c.id === categoryId).name;
      const newCategoryName = editedCategoryName.trim();

      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === categoryId ? { ...category, name: newCategoryName } : category
        )
      );

      setItems(prevItems =>
        prevItems.map(item =>
          item.category === oldCategoryName
            ? { ...item, category: newCategoryName }
            : item
        )
      );

      setCategoryUsage(prevUsage => {
        const { [oldCategoryName]: oldUsage, ...rest } = prevUsage;
        return {
          ...rest,
          [newCategoryName]: oldUsage || 0
        };
      });

      setUserHistory(prevHistory =>
        prevHistory.map(entry =>
          entry.category === oldCategoryName
            ? { ...entry, category: newCategoryName }
            : entry
        )
      );

      setCategoryUpdates(prevUpdates => ({
        ...prevUpdates,
        [oldCategoryName]: newCategoryName
      }));

      setEditingCategory(null);
      setEditedCategoryName('');
    }
  };

  const handleUserIdSubmit = (e) => {
    e.preventDefault();
    if (newUserId) {
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
      setShowUserModal(false);
      loadUserData(newUserId);
    }
  };

  const createNewUserId = () => {
    const newId = `user_${Date.now()}`;
    setUserId(newId);
    localStorage.setItem('userId', newId);
    setShowUserModal(false);
  };

  if (showUserModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Enter User ID</h2>
          <form onSubmit={handleUserIdSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="Enter your user ID"
              className="bg-gray-700 text-white p-2 rounded"
            />
            <button type="submit" className="bg-red-500 text-white p-2 rounded">
              Submit
            </button>
          </form>
          <button onClick={createNewUserId} className="mt-4 text-red-500">
            Create New User ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Grocery List</h1>

      {categories.map((category) => {
        const categoryItems = items.filter(item => item.category === category.name);
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
                {categoryItems.map(item => (
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
              if (e.target.value === "addCustom") {
                setIsAddingCategory(true);
              } else {
                setSelectedCategory(e.target.value);
              }
            }}
            className="bg-gray-800 text-white p-2 rounded mb-2 w-full"
          >
            <option value="Automatic">Automatic (AI)</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
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
            <div className="text-white mt-2">Predicted Category: {predictedCategory}</div>
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

export default GroceryListApp;