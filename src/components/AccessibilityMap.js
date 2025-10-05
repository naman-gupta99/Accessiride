import React, { useRef, useEffect } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { GOOGLE_MAPS_API_KEY, DARK_MAP_STYLE } from '../utils/constants';
import { getReportIcon } from '../utils/helpers';

export const AccessibilityMap = React.memo(({ tripCoordinates, darkMode, isReportingMode, onMapClick, communityReports, onReportClick }) => {
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
