import { useState, useEffect } from 'react';

export const useGoogleMaps = (apiKey) => {
  const [isLoaded, setIsLoaded] = useState(() => !!(window.google && window.google.maps && window.google.maps.places));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not provided.');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      if (!isLoaded) setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setError("Failed to load Google Maps.");
    
    window.initMap = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
      } else {
        setError("Places API failed to load.");
      }
    };

    document.head.appendChild(script);
  }, [apiKey, isLoaded]);

  return { isLoaded, error };
};
