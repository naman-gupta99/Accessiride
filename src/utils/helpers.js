import { Bus, Car, Bike, Footprints } from 'lucide-react';

export const getReportIcon = (type, confirmations = 0) => {
  const icons = {
    'blocked-sidewalk': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F59E0B" stroke="white" stroke-width="2"><rect x="2" y="6" width="20" height="8" rx="1"/></svg>',
    'broken-elevator': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/></svg>',
    'missing-curb-cut': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
  };
  return { svg: icons[type] || icons['missing-curb-cut'], scale: 32 + (confirmations * 4) };
};

export const getTravelModeIcon = (mode) => {
  const icons = { TRANSIT: Bus, DRIVING: Car, BICYCLING: Bike, WALKING: Footprints };
  return icons[mode] || Footprints;
};
