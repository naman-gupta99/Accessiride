export const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.warn(
    "REACT_APP_GOOGLE_MAPS_API_KEY is not set. Create a .env file or set the environment variable."
  );
}

export const APP_URL = "https://accessiride.netlify.app/";

export const TRAVEL_MODES = ["TRANSIT", "DRIVING", "BICYCLING"];

export const REPORT_TYPES = [
  { value: "blocked-sidewalk", label: "Blocked Sidewalk" },
  { value: "broken-elevator", label: "Broken Elevator" },
  { value: "missing-curb-cut", label: "Missing Curb Cut" },
  { value: "other", label: "Other Hazard" },
];

export const ACCESSIBLE_CAB_COMPANIES = [
  { id: 1, name: "Yellow Cab of Pittsburgh", phone: "4127855227" },
  { id: 2, name: "Classy Cab", email: "naman.gupta.iiits@gmail.com" },
  // { id: 3, name: 'Veterans Taxi', phone: '+1-412-785-5227' }
];

export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];
