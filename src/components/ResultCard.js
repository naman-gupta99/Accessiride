import React from 'react';
import { Bus, Car, Bike, Accessibility } from 'lucide-react';

export const ResultCard = React.memo(({ option }) => {
  if (option.type === 'TRANSIT') {
    const { line, departure_stop, arrival_stop, departure_time, arrival_time } = option.details;
    const lineName = line.short_name || line.name;
    const vehicleIcon = line.vehicle.type === 'BUS' ? <Bus size={20} /> : null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">{vehicleIcon} Public Transit</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{lineName} - {line.headsign}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">From: {departure_stop.name}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">To: {arrival_stop.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{departure_time.text}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Arrive {arrival_time.text}</p>
          </div>
        </div>
      </div>
    );
  }

  const icons = { DRIVING: Car, BICYCLING: Bike, 'Ride-Share': Car };
  const Icon = icons[option.type];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Icon size={20} /> {option.provider || option.type}
            {option.provider && option.provider.includes('WAV') && <Accessibility size={16} className="ml-1 text-blue-500" />}
          </p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Estimated Trip</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{option.duration}</p>
          {option.price && <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{option.price}</p>}
          {option.distance && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{option.distance}</p>}
        </div>
      </div>
    </div>
  );
});
