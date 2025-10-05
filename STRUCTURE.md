# Project Structure

This document describes the organization of the AccessiRide codebase after the component-driven refactoring.

## Directory Structure

```
src/
├── components/         # Reusable UI components
│   ├── AccessibilityMap.js
│   ├── AccessibilityProfileModal.js
│   ├── AccessibleCabs.js
│   ├── AutocompleteInput.js
│   ├── IconWrapper.js
│   ├── IndoorNavigationModal.js
│   ├── QRCodeModal.js
│   ├── ReportModal.js
│   ├── ResultCard.js
│   ├── StepByStepDirections.js
│   └── VisuallyHidden.js
├── hooks/              # Custom React hooks
│   ├── useDataStorage.js
│   ├── useGoogleMaps.js
│   └── useSpeechRecognition.js
├── utils/              # Helper functions and constants
│   ├── constants.js
│   └── helpers.js
└── App.js              # Main application component
```

## Components

### UI Components (`/src/components/`)

- **AccessibilityMap**: Renders the Google Maps interface with trip routes and community reports
- **AccessibilityProfileModal**: Modal for editing detailed accessibility preferences
- **AccessibleCabs**: Shows local accessible cab companies with pricing
- **AutocompleteInput**: Input field with Google Places autocomplete
- **IconWrapper**: Reusable icon button with label
- **IndoorNavigationModal**: Modal showing simulated indoor navigation maps
- **QRCodeModal**: Modal for sharing the app via link/QR code
- **ReportModal**: Modal for submitting and viewing accessibility issue reports
- **ResultCard**: Displays transportation option results (transit/rideshare)
- **StepByStepDirections**: Shows turn-by-turn directions with voice output
- **VisuallyHidden**: Accessibility helper for screen reader-only content

## Hooks

### Custom Hooks (`/src/hooks/`)

- **useDataStorage**: Manages localStorage for preferences, saved trips, and community reports
- **useGoogleMaps**: Loads and initializes Google Maps API
- **useSpeechRecognition**: Provides voice input functionality

## Utilities

### Constants (`/src/utils/constants.js`)

- Google Maps API configuration
- Travel mode options
- Report type definitions
- Accessible cab company data
- Map styling

### Helpers (`/src/utils/helpers.js`)

- `getReportIcon()`: Returns icon SVG for report types
- `getTravelModeIcon()`: Returns icon component for travel modes

## Benefits of This Structure

1. **Modularity**: Each component is in its own file, making it easier to find and modify
2. **Reusability**: Components can be easily reused across the application
3. **Maintainability**: Separation of concerns makes the codebase easier to maintain
4. **Testability**: Individual components can be tested in isolation
5. **Scalability**: New features can be added as new components without cluttering the main App.js
6. **Code Organization**: Related functionality is grouped together (components, hooks, utilities)

## Main App Component

The `App.js` file (reduced from 891 to 348 lines) now focuses on:
- Application state management
- Business logic coordination
- Component composition
- Event handling

All presentational components have been extracted to the `/components` directory, custom hooks to `/hooks`, and utilities to `/utils`.
