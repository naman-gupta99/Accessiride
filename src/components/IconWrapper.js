import React from 'react';

export const IconWrapper = React.memo(({ icon: Icon, label, isSelected, onClick }) => (
  <div className="text-center">
    <button onClick={onClick} role="switch" aria-checked={isSelected} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 ${isSelected ? 'bg-blue-600 text-white scale-105 shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`} aria-label={label}>
      <Icon size={40} />
    </button>
    <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200" aria-hidden="true">{label}</p>
  </div>
));
