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

  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem('groceryItems')) || [];
    const savedCategoryUsage = JSON.parse(localStorage.getItem('categoryUsage')) || {};
    const savedUserHistory = JSON.parse(localStorage.getItem('userHistory')) || [];
    const savedCategories = JSON.parse(localStorage.getItem('categories')) || initialCategories;
    setItems(savedItems);
    setCategoryUsage(savedCategoryUsage);
    setUserHistory(savedUserHistory);
    setCategories(savedCategories);
  }, []);

  useEffect(() => {
    localStorage.setItem('groceryItems', JSON.stringify(items));
    localStorage.setItem('categoryUsage', JSON.stringify(categoryUsage));
    localStorage.setItem('userHistory', JSON.stringify(userHistory));
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [items, categoryUsage, userHistory, categories]);

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
        body: JSON.stringify({ itemName, userHistory }),
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

  const addItem = () => {
    let categoryToUse = selectedCategory === 'Automatic' ? predictedCategory : selectedCategory;

    if (newItemName && categoryToUse) {
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

    // Remove item after a short delay
    setTimeout(() => {
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }, 500); // 500ms delay
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
      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === categoryId ? { ...category, name: editedCategoryName.trim() } : category
        )
      );

      // Update items with the new category name
      setItems(prevItems =>
        prevItems.map(item =>
          item.category === categories.find(c => c.id === categoryId).name
            ? { ...item, category: editedCategoryName.trim() }
            : item
        )
      );

      // Update categoryUsage with the new category name
      setCategoryUsage(prevUsage => {
        const oldCategoryName = categories.find(c => c.id === categoryId).name;
        const { [oldCategoryName]: oldUsage, ...rest } = prevUsage;
        return {
          ...rest,
          [editedCategoryName.trim()]: oldUsage || 0
        };
      });

      // Update userHistory with the new category name
      setUserHistory(prevHistory =>
        prevHistory.map(entry =>
          entry.category === categories.find(c => c.id === categoryId).name
            ? { ...entry, category: editedCategoryName.trim() }
            : entry
        )
      );

      setEditingCategory(null);
      setEditedCategoryName('');
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Grocery</h1>

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