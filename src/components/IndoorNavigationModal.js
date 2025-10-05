import React from 'react';
import { X } from 'lucide-react';

export const IndoorNavigationModal = ({ stationName, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-center">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Indoor Map: {stationName}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X /></button>
            </div>
            <p className="mb-4 text-gray-600 dark:text-gray-400">(Simulated Indoor Navigation)</p>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <svg width="100%" height="300" viewBox="0 0 400 200">
                    <rect width="400" height="200" fill="currentColor" className="text-gray-300 dark:text-gray-600" />
                    <text x="200" y="100" textAnchor="middle" className="fill-current text-gray-500">Indoor Map Placeholder</text>
                    <path d="M 50 50 Q 150 20 200 100 T 350 150" stroke="#2563EB" strokeWidth="4" fill="none" strokeDasharray="8,8" />
                    <circle cx="50" cy="50" r="8" fill="#10B981" />
                    <text x="50" y="40" textAnchor="middle" className="text-sm fill-current">Entrance</text>
                    <circle cx="350" cy="150" r="8" fill="#EF4444" />
                    <text x="350" y="140" textAnchor="middle" className="text-sm fill-current">Platform B</text>
                </svg>
            </div>
        </div>
    </div>
);
