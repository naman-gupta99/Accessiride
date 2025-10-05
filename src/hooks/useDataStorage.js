import { useState, useEffect, useCallback } from 'react';

export const useDataStorage = () => {
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
