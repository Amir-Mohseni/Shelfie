import React, { useState, useEffect } from 'react';
import { PlusCircle, X, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryUsage, setCategoryUsage] = useState({});
  const [openCategories, setOpenCategories] = useState({});
  const [itemTuples, setItemTuples] = useState([]); // New state to store tuples

  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem('groceryItems')) || [];
    const savedCategoryUsage = JSON.parse(localStorage.getItem('categoryUsage')) || {};
    setItems(savedItems);
    setCategoryUsage(savedCategoryUsage);
  }, []);

  useEffect(() => {
    localStorage.setItem('groceryItems', JSON.stringify(items));
    localStorage.setItem('categoryUsage', JSON.stringify(categoryUsage));
  }, [items, categoryUsage]);

  const addItem = () => {
    if (newItemName && selectedCategory) {
      const newItem = { 
        id: Date.now(), 
        name: newItemName, 
        category: selectedCategory, 
        checked: false 
      };
      setItems(prevItems => [...prevItems, newItem]);

      // Store the category-product tuple
      setItemTuples(prevTuples => [...prevTuples, { category: selectedCategory, product: newItemName }]);

      setNewItemName('');
      setSelectedCategory('');
      setIsAddingItem(false);

      setCategoryUsage(prevUsage => ({
        ...prevUsage,
        [selectedCategory]: (prevUsage[selectedCategory] || 0) + 1
      }));

      setOpenCategories(prev => ({ ...prev, [selectedCategory]: true }));
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

  // Toggle check/uncheck for an item and remove it if marked as done
  const toggleItemCheck = (itemId) => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    
    // Remove the item if it is marked as checked
    const itemsAfterCheck = updatedItems.filter(item => !(item.id === itemId && item.checked));

    setItems(itemsAfterCheck);
  };

  // Manual item removal (delete)
  const removeItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const toggleCategory = (categoryName) => {
    setOpenCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  // Export data as JSON
  const exportDataAsJSON = () => {
    const data = JSON.stringify(itemTuples, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'category_product_data.json';  // File name for the download
    a.click();

    URL.revokeObjectURL(url);
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-black text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Grocery</h1>
      
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="mb-4">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <h2 className="text-xl font-semibold">{category}</h2>
            {openCategories[category] ? <ChevronUp /> : <ChevronDown />}
          </div>
          {openCategories[category] && (
            <ul className="mt-2">
              {categoryItems.map(item => (
                <li key={item.id} className="flex items-center mb-2">
                  <div 
                    className="w-6 h-6 mr-3 rounded-full border-2 border-gray-400 flex items-center justify-center cursor-pointer"
                    onClick={() => toggleItemCheck(item.id)}
                  >
                    {item.checked && <CheckCircle className="text-red-500" size={20} />}
                  </div>
                  <span className={`flex-grow ${item.checked ? 'line-through text-gray-500' : ''}`}>{item.name}</span>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

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
            value={selectedCategory}
            onChange={(e) => {
              if (e.target.value === "addCustom") {
                setIsAddingCategory(true);
              } else {
                setSelectedCategory(e.target.value);
              }
            }}
            className="bg-gray-800 text-white p-2 rounded mb-2 w-full"
          >
            <option value="">Select category</option>
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
          <div className="flex justify-between">
            <button onClick={addItem} className="bg-red-500 text-white p-2 rounded">
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

      {/* Button to export data as JSON */}
      <div className="mt-4">
        <button onClick={exportDataAsJSON} className="bg-green-500 text-white p-2 rounded">
          Export as JSON
        </button>
      </div>
    </div>
  );
};

export default GroceryListApp;
