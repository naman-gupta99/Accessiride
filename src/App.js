import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Accessibility, Volume2 as VolumeIcon, Annoyed, Sun, Moon, Save, Trash2, Bus, Footprints, X, CheckCircle2, ThumbsUp, Bike, Car, MapPin, Phone, Bot, Mic, SlidersHorizontal, Share2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('REACT_APP_GOOGLE_MAPS_API_KEY is not set. Create a .env file or set the environment variable.');
}

const APP_URL = 'https://accessiride.netlify.app/';
const TRAVEL_MODES = ['TRANSIT', 'DRIVING', 'BICYCLING'];
const REPORT_TYPES = [
  { value: 'blocked-sidewalk', label: 'Blocked Sidewalk' },
  { value: 'broken-elevator', label: 'Broken Elevator' },
  { value: 'missing-curb-cut', label: 'Missing Curb Cut' },
  { value: 'other', label: 'Other Hazard' }
];
const ACCESSIBLE_CAB_COMPANIES = [
    { id: 1, name: 'Yellow Cab of Pittsburgh', phone: '412-321-8100' },
    { id: 2, name: 'Classy Cab', phone: '412-322-5080' },
    { id: 3, name: 'Veterans Taxi', phone: '412-481-8387' },
    { id: 4, name: 'Communit-T', phone: '412-422-8233' },
];

const DARK_MAP_STYLE = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#746855" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#38414e" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] } ];

// --- HELPER FUNCTIONS ---
const getReportIcon = (type, confirmations = 0) => {
  const icons = {
    'blocked-sidewalk': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F59E0B" stroke="white" stroke-width="2"><rect x="2" y="6" width="20" height="8" rx="1"/></svg>',
    'broken-elevator': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/></svg>',
    'missing-curb-cut': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
  };
  return { svg: icons[type] || icons['missing-curb-cut'], scale: 32 + (confirmations * 4) };
};

const getTravelModeIcon = (mode) => {
  const icons = { TRANSIT: Bus, DRIVING: Car, BICYCLING: Bike, WALKING: Footprints };
  return icons[mode] || Footprints;
};

// --- CUSTOM HOOKS ---
const useGoogleMaps = (apiKey) => {
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

const useDataStorage = () => {
  const [preferences, setPreferences] = useState(() => {
    try {
        const saved = localStorage.getItem('accessiride-prefs');
        const defaultPrefs = { 
            wheelchair: true, audioNav: false, lowSensory: false,
            maxSteps: 0, avoidCurbs: true, restStops: false, avoidLoud: false 
        };
        return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
    } catch {
        return { wheelchair: true, audioNav: false, lowSensory: false, maxSteps: 0, avoidCurbs: true, restStops: false, avoidLoud: false };
    }
  });

  const [savedTrips, setSavedTrips] = useState(() => {
    try {
        const saved = localStorage.getItem('accessiride-trips');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  const [communityReports, setCommunityReports] = useState(() => {
     try {
        const saved = localStorage.getItem('accessiride-reports');
        return saved ? JSON.parse(saved).map(r => ({...r, timestamp: new Date(r.timestamp)})) : [];
    } catch {
        return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('accessiride-prefs', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('accessiride-trips', JSON.stringify(savedTrips));
  }, [savedTrips]);
  
  useEffect(() => {
    localStorage.setItem('accessiride-reports', JSON.stringify(communityReports));
  }, [communityReports]);

  const savePreferences = useCallback((newPrefs) => setPreferences(newPrefs), []);
  const addTrip = useCallback((trip) => {
    const newTrip = { ...trip, id: Date.now().toString() };
    setSavedTrips(prev => [...prev, newTrip]);
    return newTrip;
  }, []);
  const removeTrip = useCallback((tripId) => setSavedTrips(prev => prev.filter(t => t.id !== tripId)), []);
  const addReport = useCallback((report) => {
    const newReport = { ...report, id: Date.now().toString(), timestamp: new Date(), confirmations: 1 };
    setCommunityReports(prev => [newReport, ...prev]);
  }, []);
  const confirmReport = useCallback((reportId) => {
    setCommunityReports(prev => prev.map(r => r.id === reportId ? { ...r, confirmations: (r.confirmations || 0) + 1 } : r));
  }, []);
  const resolveReport = useCallback((reportId) => setCommunityReports(prev => prev.filter(r => r.id !== reportId)), []);

  return { preferences, savePreferences, savedTrips, addTrip, removeTrip, communityReports, addReport, confirmReport, resolveReport };
};

const useSpeechRecognition = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;
    }, [onResult]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Speech recognition could not start:", error);
                setIsListening(false);
            }
        }
    };

    return { isListening, startListening };
};


// --- UI COMPONENTS ---
const VisuallyHidden = ({ children }) => <span className="sr-only">{children}</span>;

const IconWrapper = React.memo(({ icon: Icon, label, isSelected, onClick }) => (
  <div className="text-center">
    <button onClick={onClick} role="switch" aria-checked={isSelected} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 ${isSelected ? 'bg-blue-600 text-white scale-105 shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`} aria-label={label}>
      <Icon size={40} />
    </button>
    <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200" aria-hidden="true">{label}</p>
  </div>
));

const AutocompleteInput = ({ value, onChange, placeholder, isLoaded, onPlaceSelected, id }) => {
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

const ResultCard = React.memo(({ option }) => {
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

const AccessibilityMap = React.memo(({ tripCoordinates, darkMode, isReportingMode, onMapClick, communityReports, onReportClick }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const elementsRef = useRef([]);
  const { isLoaded } = useGoogleMaps(GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    
    const clearMapElements = () => {
      elementsRef.current.forEach(element => element.setMap(null));
      elementsRef.current = [];
    };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, { center: { lat: 40.4406, lng: -79.9959 }, zoom: 13, disableDefaultUI: true, clickableIcons: !isReportingMode });
    }
    
    const clickListener = mapRef.current.addListener('click', (e) => { 
        if (isReportingMode) onMapClick(e.latLng); 
    });
    
    mapRef.current.setOptions({ styles: darkMode ? DARK_MAP_STYLE : null, draggableCursor: isReportingMode ? 'crosshair' : 'grab' });
    clearMapElements();

    if (tripCoordinates) {
      const { start, end, route } = tripCoordinates;
      const bounds = new window.google.maps.LatLngBounds();
      const startLatLng = { lat: start.lat(), lng: start.lng() };
      const endLatLng = { lat: end.lat(), lng: end.lng() };
      elementsRef.current.push(new window.google.maps.Marker({ position: startLatLng, map: mapRef.current, title: "Start" }));
      elementsRef.current.push(new window.google.maps.Marker({ position: endLatLng, map: mapRef.current, title: "End" }));
      
      const routePath = route.map(coords => ({ lat: coords.lat(), lng: coords.lng() }));
      routePath.forEach(point => bounds.extend(point));
      elementsRef.current.push(new window.google.maps.Polyline({ path: routePath, geodesic: true, strokeColor: '#2563EB', strokeOpacity: 0.8, strokeWeight: 6, map: mapRef.current }));
      mapRef.current.fitBounds(bounds);
    }

    communityReports.forEach(report => {
      const { svg, scale } = getReportIcon(report.type, report.confirmations);
      const marker = new window.google.maps.Marker({
        position: report.location,
        map: mapRef.current,
        title: `${report.type.replace('-', ' ')} (${report.confirmations || 0} confirmations)`,
        icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(scale, scale) }
      });
      marker.addListener('click', () => onReportClick(report));
      elementsRef.current.push(marker);
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };

  }, [isLoaded, tripCoordinates, darkMode, isReportingMode, onMapClick, communityReports, onReportClick]);

  if (!isLoaded) return <div className="h-64 sm:h-80 w-full rounded-2xl flex items-center justify-center bg-gray-200 dark:bg-gray-700"><p className="text-gray-500 dark:text-gray-400">Loading map...</p></div>;
  return <div role="img" aria-label="Map area"><div ref={mapContainerRef} className="h-64 sm:h-80 w-full rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700" /></div>;
});

const StepByStepDirections = ({ directions, onIndoorMapClick, speak }) => {
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

const ReportModal = ({ report, onSubmit, onClose, onConfirm, onResolve }) => {
  const [reportType, setReportType] = useState(report ? report.type : 'blocked-sidewalk');
  const [description, setDescription] = useState(report ? report.description : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type: reportType, description, location: { lat: report.location.lat(), lng: report.location.lng() } });
  };

  if (report && report.id) {
    const timeAgo = report.timestamp ? report.timestamp.toLocaleTimeString() : 'Just now';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{report.type.replace('-', ' ')}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close dialog"><X /></button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{report.description || 'No description provided.'}</p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            <p>Reported at: {timeAgo}</p>
            <p>Confirmations: {report.confirmations || 0}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onConfirm(report.id)} className="w-full text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg py-3 flex items-center justify-center gap-2"><ThumbsUp size={20} /> Confirm</button>
            <button onClick={() => onResolve(report.id)} className="w-full text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-lg py-3 flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Resolved</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 id="report-dialog-title" className="text-2xl font-bold text-gray-900 dark:text-white">Report an Issue</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report dialog"><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="report-type" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Issue Type</label>
            <select id="report-type" value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              {REPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Optional Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="e.g., Construction at corner of Forbes and Craig" className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" className="w-full text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg py-3">Submit Report</button>
        </form>
      </div>
    </div>
  );
};

const AccessibleCabs = ({ setAnnouncement }) => {
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
const AccessibilityProfileModal = ({ preferences, onSave, onClose }) => {
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

const IndoorNavigationModal = ({ stationName, onClose }) => (
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

const QRCodeModal = ({ url, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share AccessiRide</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X /></button>
      </div>
      <p className="mb-4 text-gray-600 dark:text-gray-400">Scan this code or copy the link to share the app.</p>
      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-4">
        <p className="break-words text-sm text-gray-700 dark:text-gray-200">{url}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { navigator.clipboard?.writeText(url); onClose(); }} className="flex-1 text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">Copy Link</button>
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Close</button>
      </div>
    </div>
  </div>
);


// --- MAIN APP COMPONENT ---
function App() {
  const [from, setFrom] = useState('Downtown Pittsburgh');
  const [to, setTo] = useState('University of Pittsburgh');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [tripCoordinates, setTripCoordinates] = useState(null);
  const [tripDirections, setTripDirections] = useState([]);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false, data: null });
  const [travelMode, setTravelMode] = useState('TRANSIT');
  const [departureTime, setDepartureTime] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [indoorNavModal, setIndoorNavModal] = useState({ isOpen: false, stationName: '' });
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { preferences, savePreferences, savedTrips, addTrip, removeTrip, communityReports, addReport, confirmReport, resolveReport } = useDataStorage();
  const { isLoaded: isGoogleMapsLoaded, error: mapsError } = useGoogleMaps(GOOGLE_MAPS_API_KEY);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Text-to-speech not supported in this browser.");
    }
  }, []);
  
  const fetchRideShareEstimates = useCallback((origin, destination) => {
    if (!isGoogleMapsLoaded) return Promise.resolve([]);

    const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(origin, destination);
    const distanceInMiles = distanceInMeters / 1609.34;

    return new Promise(resolve => {
      setTimeout(() => {
        const basePrice = 5 + (distanceInMiles * 2.1);
        const baseEta = 3 + (distanceInMiles * 2);
        resolve([
          { id: 'uber-x', type: 'Ride-Share', provider: 'UberX', duration: `${Math.floor(baseEta + Math.random() * 3)} min`, price: `$${(basePrice + Math.random() * 2).toFixed(2)}` },
          { id: 'uber-wav', type: 'Ride-Share', provider: 'Uber WAV', duration: `${Math.floor(baseEta + 2 + Math.random() * 4)} min`, price: `$${(basePrice * 1.2 + Math.random() * 3).toFixed(2)}` },
          { id: 'lyft', type: 'Ride-Share', provider: 'Lyft', duration: `${Math.floor(baseEta + Math.random() * 3)} min`, price: `$${(basePrice * 0.95 + Math.random() * 2).toFixed(2)}` }
        ]);
      }, 800);
    });
  }, [isGoogleMapsLoaded]);

  const handleSearch = useCallback((searchFrom, searchTo) => {
    if (!isGoogleMapsLoaded) { setError("Map service is not available yet."); return; }
    setIsLoading(true); setSearched(true); setError(null); setSearchResults([]); setTripCoordinates(null); setTripDirections([]); setAnnouncement('Searching for routes...');

    const directionsService = new window.google.maps.DirectionsService();
    const request = { origin: searchFrom, destination: searchTo, travelMode: window.google.maps.TravelMode[travelMode] };

    if (travelMode === 'TRANSIT') {
      request.transitOptions = { modes: [window.google.maps.TransitMode.BUS, window.google.maps.TransitMode.TRAIN] };
      if (departureTime) request.transitOptions.departureTime = new Date(departureTime);
    }

    directionsService.route(request, (result, status) => {
      
      if (status === window.google.maps.DirectionsStatus.OK) {
        const mainRoute = result.routes[0];
        if (!mainRoute || !mainRoute.legs || mainRoute.legs.length === 0) {
            setError("No valid routes found for the selected mode."); 
            setAnnouncement("Search complete. No routes found.");
            setIsLoading(false);
            return;
        }
        const leg = mainRoute.legs[0];
        let results = [];
        if (travelMode === 'TRANSIT') {
          results = leg.steps.filter(step => step.travel_mode === 'TRANSIT').map(step => ({ id: `transit-${step.start_location.lat()}`, type: 'TRANSIT', details: step.transit }));
        } else {
          results.push({ id: travelMode.toLowerCase(), type: travelMode, duration: leg.duration.text, distance: leg.distance.text });
        }
        
        setTripCoordinates({ start: leg.start_location, end: leg.end_location, route: mainRoute.overview_path });
        setTripDirections(leg.steps);
        setAnnouncement(`Search complete. Found ${results.length} options.`);
        speak(`Search complete. Found ${results.length} options.`);
        
        fetchRideShareEstimates(leg.start_location, leg.end_location).then(rideShares => {
            setSearchResults([...results, ...rideShares]);
            setIsLoading(false);
        });
      } else {
        setIsLoading(false);
        if(status === 'NOT_FOUND') {
            setError(`No routes could be found. The locations may be too far apart for walking or too close for transit. Please try a different travel mode.`);
        } else if (status === 'REQUEST_DENIED') {
            setError(`Directions request was denied. Please ensure the "Directions API" and "Places API" are enabled in your Google Cloud project.`);
        }
        else {
            setError(`Directions request failed: ${status}. Please check addresses.`);
        }
        setAnnouncement(`Error finding directions. Status: ${status}`);
        speak(`Sorry, there was an error finding directions.`);
      }
    });
  }, [isGoogleMapsLoaded, travelMode, departureTime, fetchRideShareEstimates, speak]);

  const handleVoiceResult = useCallback((transcript) => {
    speak(`Heard: ${transcript}`);
    const lowerTranscript = transcript.toLowerCase();
    const parts = lowerTranscript.split(' to ');
    if (parts.length === 2) {
      let fromPhrase = parts[0].replace('find a route from', '').replace('get a ride from', '').trim();
      let toPhrase = parts[1].trim();
      setFrom(fromPhrase);
      setTo(toPhrase);
      speak(`Okay, searching for a route from ${fromPhrase} to ${toPhrase}.`);
      setTimeout(() => handleSearch(fromPhrase, toPhrase), 500);
    } else {
      speak("Sorry, I didn't understand. Please say, for example, 'get a ride from downtown to the university'.");
    }
  }, [speak, handleSearch]);

  const { isListening, startListening } = useSpeechRecognition(handleVoiceResult);

  useEffect(() => { if (mapsError) setError(mapsError); }, [mapsError]);
  
  const saveCurrentTrip = useCallback(() => {
    const tripName = prompt("Enter a name for this trip:");
    if (tripName) { addTrip({ name: tripName, from, to }); setAnnouncement(`Trip "${tripName}" saved.`); }
  }, [from, to, addTrip]);

  const deleteTrip = useCallback((tripId) => { removeTrip(tripId); setAnnouncement("Trip deleted."); }, [removeTrip]);
  
  const handleMapClick = useCallback((latLng) => {
    if (isReportingMode) {
      setReportModal({ isOpen: true, data: { location: latLng } });
      setIsReportingMode(false);
    }
  }, [isReportingMode]);

  const handleReportSubmit = useCallback((reportData) => {
    addReport(reportData);
    setAnnouncement("Report submitted successfully!");
    setReportModal({ isOpen: false, data: null });
  }, [addReport]);
  
  const handleConfirmReport = useCallback((reportId) => {
    confirmReport(reportId);
    setAnnouncement("Report confirmed!");
    setReportModal({ isOpen: false, data: null });
  }, [confirmReport]);

  const handleResolveReport = useCallback((reportId) => {
    resolveReport(reportId);
    setAnnouncement("Report resolved!");
    setReportModal({ isOpen: false, data: null });
  }, [resolveReport]);
  
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        return;
    }
    if (!isGoogleMapsLoaded) {
        setError("Map service is not ready yet.");
        return;
    }

    setAnnouncement("Fetching your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFrom(results[0].formatted_address);
            setAnnouncement("Current location set as starting point.");
          } else {
            setError("Could not determine address from location.");
            setAnnouncement("Error: Could not find address.");
          }
        });
      },
      () => {
        setError("Unable to retrieve your location. Please check your browser permissions.");
        setAnnouncement("Error: Location access denied.");
      }
    );
  }, [isGoogleMapsLoaded]);

  // ...existing code...

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300`}>
      {reportModal.isOpen && <ReportModal report={reportModal.data} onSubmit={handleReportSubmit} onClose={() => setReportModal({ isOpen: false, data: null })} onConfirm={handleConfirmReport} onResolve={handleResolveReport} />}
      {profileModalOpen && <AccessibilityProfileModal preferences={preferences} onSave={(newPrefs) => { savePreferences(newPrefs); setProfileModalOpen(false); }} onClose={() => setProfileModalOpen(false)} />}
      {indoorNavModal.isOpen && <IndoorNavigationModal stationName={indoorNavModal.stationName} onClose={() => setIndoorNavModal({ isOpen: false, stationName: ''})} />}
      {qrModalOpen && <QRCodeModal url={APP_URL} onClose={() => setQrModalOpen(false)} />}
      
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">AccessiRide</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setQrModalOpen(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Share App">
                <Share2 size={20} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </header>
        <main>
          <section className="mb-8" aria-labelledby="prefs-heading">
            <div className="flex justify-between items-center mb-4">
                 <h2 id="prefs-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Travel Needs</h2>
                 <button onClick={() => setProfileModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                     <SlidersHorizontal size={16} /> Edit Profile
                 </button>
            </div>
            <div className="flex justify-around space-x-2 sm:space-x-4">
              <IconWrapper icon={Accessibility} label="Wheelchair" isSelected={preferences.wheelchair} onClick={() => savePreferences({...preferences, wheelchair: !preferences.wheelchair})} />
              <IconWrapper icon={VolumeIcon} label="Audio Nav" isSelected={preferences.audioNav} onClick={() => savePreferences({...preferences, audioNav: !preferences.audioNav})} />
              <IconWrapper icon={Annoyed} label="Low Sensory" isSelected={preferences.lowSensory} onClick={() => savePreferences({...preferences, lowSensory: !preferences.lowSensory})} />
            </div>
          </section>

          <section className="mb-8" aria-labelledby="travel-mode-heading">
            <h2 id="travel-mode-heading" className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Travel Mode</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {TRAVEL_MODES.map(mode => (
                <button key={mode} onClick={() => setTravelMode(mode)} className={`p-4 rounded-lg font-bold text-center transition-colors ${travelMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{mode.charAt(0) + mode.slice(1).toLowerCase()}</button>
              ))}
            </div>
          </section>
          
          {savedTrips.length > 0 && (
            <section className="mb-8" aria-labelledby="saved-heading">
              <h2 id="saved-heading" className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Saved Trips</h2>
              <div className="space-y-2">
                {savedTrips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                    <button onClick={() => { setFrom(trip.from); setTo(trip.to); handleSearch(trip.from, trip.to); }} className="text-left flex-grow">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{trip.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{trip.from} → {trip.to}</p>
                    </button>
                    <button onClick={() => deleteTrip(trip.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full flex-shrink-0 ml-2" aria-label={`Delete saved trip ${trip.name}`}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8" aria-labelledby="trip-heading">
            <h2 id="trip-heading" className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Plan a New Trip</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(from, to); }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md space-y-4">
              <div>
                <label htmlFor="from" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                <div className="flex items-center gap-2">
                    <AutocompleteInput id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Start address" isLoaded={isGoogleMapsLoaded} onPlaceSelected={(place) => setFrom(place)} />
                    <button type="button" onClick={handleUseMyLocation} className="p-4 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500" aria-label="Use my current location"><MapPin /></button>
                </div>
              </div>
              <div>
                <label htmlFor="to" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                <AutocompleteInput id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Destination address" isLoaded={isGoogleMapsLoaded} onPlaceSelected={(place) => setTo(place)} />
              </div>
              {travelMode === 'TRANSIT' && (
                <div>
                  <label htmlFor="departureTime" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Departure Time (Optional)</label>
                  <input type="datetime-local" id="departureTime" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="w-full text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg py-4" disabled={isLoading || !isGoogleMapsLoaded}>{isLoading ? 'Searching...' : 'Find a Ride'}</button>
                <button type="button" onClick={saveCurrentTrip} className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700" aria-label="Save current trip"><Save /></button>
                <button type="button" onClick={() => { speak("Listening for your destination."); startListening(); }} disabled={isListening} className={`p-4 text-white rounded-lg transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`} aria-label="Start voice search">
                    {isListening ? "..." : <Mic />}
                </button>
              </div>
            </form>
          </section>

          <section className="mb-8">
            <button onClick={() => setIsReportingMode(prev => !prev)} className={`w-full text-lg font-bold p-4 rounded-lg transition-colors ${isReportingMode ? 'bg-red-600 text-white' : 'bg-yellow-400 text-yellow-900'}`}>{isReportingMode ? 'Cancel Reporting' : 'Report an Issue'}</button>
            {isReportingMode && <p className="text-center text-sm mt-2 text-gray-600 dark:text-gray-400">Tap on the map to place a report pin.</p>}
          </section>

          <div aria-live="polite" role="status"><VisuallyHidden>{announcement}</VisuallyHidden></div>

          {searched && (
            <section aria-labelledby="results-heading">
              <h2 id="results-heading" className="sr-only">Search Results</h2>
              {isLoading && <div className="text-center p-8" aria-label="Loading search results"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
              {!isLoading && error && <div className="text-center bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg" role="alert"><p><strong className="font-bold">Error: </strong>{error}</p></div>}
              {!isLoading && !error && searchResults.length > 0 && (
                <div className="space-y-6">
                  {tripCoordinates && <AccessibilityMap tripCoordinates={tripCoordinates} darkMode={darkMode} isReportingMode={isReportingMode} onMapClick={handleMapClick} communityReports={communityReports} onReportClick={(report) => setReportModal({ isOpen: true, data: report })} />}
                  {tripDirections.length > 0 && <StepByStepDirections directions={tripDirections} onIndoorMapClick={(stationName) => setIndoorNavModal({ isOpen: true, stationName })} speak={speak} />}
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Transportation Options</h3>
                    {searchResults.map(option => <ResultCard key={option.id} option={option} />)}
                  </div>
                  {(travelMode === 'TRANSIT' || searchResults.some(r => r.type === 'Ride-Share')) && <AccessibleCabs setAnnouncement={setAnnouncement} />}
                </div>
              )}
              {!isLoading && !error && searchResults.length === 0 && searched && (
                <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">No matches found</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">No options were found. Try adjusting your search.</p>
                </div>
              )}
            </section>
          )}
        </main>
        <footer className="text-center mt-8 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">AccessiRide - Making transportation accessible for everyone</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

