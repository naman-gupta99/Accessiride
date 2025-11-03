import React, { useState, useEffect, useCallback } from 'react';
import { Accessibility, Volume2 as VolumeIcon, Annoyed, Sun, Moon, Save, Trash2, MapPin, Mic, SlidersHorizontal, Share2 } from 'lucide-react';

import { GOOGLE_MAPS_API_KEY, APP_URL, TRAVEL_MODES } from './utils/constants';

import { useGoogleMaps } from './hooks/useGoogleMaps';
import { useDataStorage } from './hooks/useDataStorage';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import { VisuallyHidden } from './components/VisuallyHidden';
import { IconWrapper } from './components/IconWrapper';
import { AutocompleteInput } from './components/AutocompleteInput';
import { ResultCard } from './components/ResultCard';
import { AccessibilityMap } from './components/AccessibilityMap';
import { StepByStepDirections } from './components/StepByStepDirections';
import { ReportModal } from './components/ReportModal';
import { AccessibleCabs } from './components/AccessibleCabs';
import { AccessibilityProfileModal } from './components/AccessibilityProfileModal';
import { IndoorNavigationModal } from './components/IndoorNavigationModal';
import { QRCodeModal } from './components/QRCodeModal';


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
    <div className={`${darkMode ? 'dark' : ''} min-h-screen font-sans transition-colors duration-300`}>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900`}>
      {reportModal.isOpen && <ReportModal report={reportModal.data} onSubmit={handleReportSubmit} onClose={() => setReportModal({ isOpen: false, data: null })} onConfirm={handleConfirmReport} onResolve={handleResolveReport} />}
      {profileModalOpen && <AccessibilityProfileModal preferences={preferences} onSave={(newPrefs) => { savePreferences(newPrefs); setProfileModalOpen(false); }} onClose={() => setProfileModalOpen(false)} />}
      {indoorNavModal.isOpen && <IndoorNavigationModal stationName={indoorNavModal.stationName} onClose={() => setIndoorNavModal({ isOpen: false, stationName: ''})} />}
      {qrModalOpen && <QRCodeModal url={APP_URL} onClose={() => setQrModalOpen(false)} />}
      
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">MobilU</h1>
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
                  {(travelMode === 'TRANSIT' || searchResults.some(r => r.type === 'Ride-Share')) && <AccessibleCabs setAnnouncement={setAnnouncement} from={from} to={to} />}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">MobilU - Making transportation accessible for everyone</p>
        </footer>
      </div>
    </div>
    </div>
  );
}

export default App;

