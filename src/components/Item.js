import React from 'react';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';

const Item = ({ item, toggleChecked, removeItem }) => (
  <li className="flex items-center mb-2">
    {item.checked ? (
      <CheckCircle className="mr-2 text-green-500" onClick={() => toggleChecked(item.id)} />
    ) : (
      <Circle className="mr-2 text-gray-500" onClick={() => toggleChecked(item.id)} />
    )}
    <span className={`${item.checked ? 'line-through' : ''}`}>{item.name}</span>
    <Trash2 className="ml-auto text-red-500 cursor-pointer" onClick={() => removeItem(item.id)} />
  </li>
);

export default Item;
