# Bainbridge Builder Mapping

Location management and mapping system for Bainbridge Builders, Inc.

## Features

- 🗺️ Interactive Google Maps with user location
- 📍 Multi-category location management (Customers, Vendors, Chains, Employees)
- 🔍 Smart search with Google Places autocomplete
- 📊 Time-series employee tracking
- 📤 Import/Export (Excel, JSON)
- 🎨 Custom branding and presets

## Setup

1. **Install dependencies:**
```bash
   npm install
```

2. **Create `.env` file:**
```bash
   cp .env.example .env
```

3. **Add your Google Maps API Key to `.env`:**
```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

4. **Start development server:**
```bash
   npm run dev
```

5. **Build for production:**
```bash
   npm run build
```

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create credentials (API Key)
5. Add restrictions (HTTP referrers for production)
6. Copy key to `.env` file

## Project Structure
```
src/
├── components/          # UI components
│   ├── ui/             # Universal components
│   ├── map/            # Map-related
│   ├── table/          # Table views
│   ├── layers/         # Layer control
│   └── settings/       # Settings panels
├── stores/             # Zustand state management
├── services/           # API wrappers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── config/             # Configuration files
```

## Development Roadmap

### Phase 0: Foundation ✅
- [x] Project scaffold
- [x] Branding integration
- [x] User location detection
- [ ] Universal Tab component
- [ ] Zustand stores setup

### Phase 1: Multi-Category System
- [ ] Category management
- [ ] Layer control panel
- [ ] Map marker system
- [ ] Table with color hints
- [ ] Search functionality

### Phase 2: Chain Stores & Nesting
- [ ] Google Places integration
- [ ] Nested categories
- [ ] Color overrides
- [ ] County filtering

### Phase 3: Employee Tracking
- [ ] CSV import
- [ ] Time-range slider
- [ ] Heatmap visualization
- [ ] Finer radius controls

### Phase 4-8: Advanced Features
- See design documentation for complete roadmap

## License

Proprietary - Bainbridge Builders, Inc.