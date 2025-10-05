import React, { useState } from 'react';
import { X } from 'lucide-react';

export const AccessibilityProfileModal = ({ preferences, onSave, onClose }) => {
    const [prefs, setPrefs] = useState(preferences);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPrefs(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detailed Accessibility Profile</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="maxSteps" className="block text-lg font-medium text-gray-700 dark:text-gray-300">Max steps I can handle (0 for none)</label>
                        <input type="number" name="maxSteps" id="maxSteps" value={prefs.maxSteps} onChange={handleChange} className="w-full mt-1 p-2 border-2 rounded-lg" />
                    </div>
                     <div className="flex items-center">
                        <input type="checkbox" name="avoidCurbs" id="avoidCurbs" checked={prefs.avoidCurbs} onChange={handleChange} className="h-5 w-5 rounded" />
                        <label htmlFor="avoidCurbs" className="ml-2 text-lg text-gray-700 dark:text-gray-300">Require curb cuts on sidewalks</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="restStops" id="restStops" checked={prefs.restStops} onChange={handleChange} className="h-5 w-5 rounded" />
                        <label htmlFor="restStops" className="ml-2 text-lg text-gray-700 dark:text-gray-300">Need routes with rest stops/benches</label>
                    </div>
                     <div className="flex items-center">
                        <input type="checkbox" name="avoidLoud" id="avoidLoud" checked={prefs.avoidLoud} onChange={handleChange} className="h-5 w-5 rounded" />
                        <label htmlFor="avoidLoud" className="ml-2 text-lg text-gray-700 dark:text-gray-300">Prefer to avoid loud streets</label>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="text-lg font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(prefs)} className="text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 py-2 px-6 rounded-lg">Save Profile</button>
                </div>
            </div>
        </div>
    );
};
