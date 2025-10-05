import React from 'react';
import { Volume2 as VolumeIcon } from 'lucide-react';
import { getTravelModeIcon } from '../utils/helpers';

export const StepByStepDirections = ({ directions, onIndoorMapClick, speak }) => {
  if (!directions || directions.length === 0) return null;

  const handleSpeak = () => {
      const textToSpeak = directions.map(step => step.instructions.replace(/<[^>]+>/g, '')).join('. ');
      speak(textToSpeak);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Directions</h3>
        <button onClick={handleSpeak} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Read directions aloud">
            <VolumeIcon size={20} />
        </button>
      </div>
      <ol className="list-none space-y-3 text-gray-700 dark:text-gray-300">
        {directions.map((step, index) => {
          const Icon = getTravelModeIcon(step.travel_mode);
          const isStation = step.travel_mode === 'TRANSIT';
          return (
            <li key={index}>
              <div className="flex items-start gap-3">
                <div className="pt-1"><Icon size={20} className="text-blue-500" /></div>
                <div className="flex-1" dangerouslySetInnerHTML={{ __html: step.instructions }} />
              </div>
              {isStation && (
                <button onClick={() => onIndoorMapClick(step.transit.departure_stop.name)} className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold ml-8 mt-1 hover:underline">
                  Show Indoor Map
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
