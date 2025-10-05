import React, { useRef, useEffect } from 'react';

export const AutocompleteInput = ({ value, onChange, placeholder, isLoaded, onPlaceSelected, id }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, { fields: ["formatted_address", "geometry"] });
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.formatted_address) onPlaceSelected(place.formatted_address);
      });
    }
  }, [isLoaded, onPlaceSelected]);
  
  return <input ref={inputRef} id={id} type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />;
};
