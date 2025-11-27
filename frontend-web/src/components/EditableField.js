import React, { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function EditableField({ value, onSave, label, type = "text" }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <div className="flex items-center justify-between group h-8">
        {isEditing ? (
          <div className="flex items-center w-full gap-2">
            <input
              type={type}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-repforce-primary focus:ring-repforce-primary sm:text-sm py-1 px-2"
            />
            <button onClick={handleSave} className="text-green-600 hover:text-green-800"><CheckIcon className="w-5 h-5"/></button>
            <button onClick={handleCancel} className="text-red-600 hover:text-red-800"><XMarkIcon className="w-5 h-5"/></button>
          </div>
        ) : (
          <div className="flex items-center w-full justify-between">
            <span className="text-gray-900 dark:text-white text-base truncate">{value || '-'}</span>
            <button onClick={() => setIsEditing(true)} className="invisible group-hover:visible text-gray-400 hover:text-repforce-primary">
              <PencilIcon className="w-4 h-4"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}