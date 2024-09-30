import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react';
import Item from './Item';

const CategoryList = ({
  categories,
  items,
  openCategories,
  toggleCategory,
  startEditingCategory,
  saveEditedCategory,
  editingCategory,
  editedCategoryName,
  setEditedCategoryName,
  toggleChecked,
  removeItem,
}) => (
  <>
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
              <div className="cursor-pointer" onClick={() => toggleCategory(category.name)}>
                {openCategories[category.name] ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </div>
          {openCategories[category.name] && (
            <ul className="mt-2">
              {categoryItems.map((item) => (
                <Item key={item.id} item={item} toggleChecked={toggleChecked} removeItem={removeItem} />
              ))}
            </ul>
          )}
        </div>
      );
    })}
  </>
);

export default CategoryList;
