import React, { useState } from 'react';
import { Bot, Phone } from 'lucide-react';
import { ACCESSIBLE_CAB_COMPANIES } from '../utils/constants';

export const AccessibleCabs = ({ setAnnouncement }) => {
    const [botStatus, setBotStatus] = useState('idle'); // idle, loading, complete
    const [botResults, setBotResults] = useState([]);

    const handleBotRequest = () => {
        setBotStatus('loading');
        setAnnouncement("AccessiBot is contacting companies for pricing and availability...");
        setTimeout(() => {
            const results = ACCESSIBLE_CAB_COMPANIES.map(cab => ({
                ...cab,
                price: `$${(Math.random() * 15 + 20).toFixed(2)}`,
                eta: `${Math.floor(Math.random() * 10) + 8} min`,
            }));
            setBotResults(results);
            setBotStatus('complete');
            setAnnouncement("AccessiBot has found your options.");
        }, 2500); // Simulate bot calling companies
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Local Accessible Cabs</h3>
            
            {botStatus === 'idle' && (
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Let our bot call local companies to find the best price and availability for you.</p>
                    <button onClick={handleBotRequest} className="w-full text-lg font-bold p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2">
                        <Bot size={20} /> Request Prices via Bot
                    </button>
                </>
            )}

            {botStatus === 'loading' && (
                <div className="text-center p-4">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 dark:text-gray-400">AccessiBot is contacting companies...</p>
                </div>
            )}

            {botStatus === 'complete' && (
                 <div className="space-y-3">
                    {botResults.map(cab => (
                        <div key={cab.id} className="flex flex-wrap justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="mb-2 w-full sm:w-auto sm:mb-0">
                                <span className="font-bold text-gray-800 dark:text-gray-200">{cab.name}</span>
                                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">{cab.price} <span className="text-gray-500 dark:text-gray-400 font-normal">({cab.eta} ETA)</span></p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => setAnnouncement(`Simulating booking with ${cab.name}.`)} className="flex-1 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2">Select</button>
                                <a href={`tel:${cab.phone}`} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500" aria-label={`Call ${cab.name}`}>
                                    <Phone size={18} />
                                </a>
                                <button onClick={() => setAnnouncement(`Simulating a callback request to ${cab.name}.`)} className="flex-1 text-sm text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg px-3 py-2">Callback</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setBotStatus('idle')} className="w-full text-sm font-bold p-2 mt-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Start Over</button>
                </div>
            )}
        </div>
    );
};
