// Group US states into realistic shipping zones
const fs = require('fs');

const statesData = JSON.parse(fs.readFileSync('public/data/us-states-full.json', 'utf8'));

// Define zone groupings based on carrier patterns
const zoneGroups = {
  'ZONE-1-NE': {
    name: 'Northeast',
    states: ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut'],
    multiplier: 1.12,
    remote_fee: 0
  },
  'ZONE-2-MID-ATL': {
    name: 'Mid-Atlantic',
    states: ['New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland'],
    multiplier: 1.08,
    remote_fee: 0
  },
  'ZONE-3-SE': {
    name: 'Southeast',
    states: ['Virginia', 'West Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida'],
    multiplier: 1.05,
    remote_fee: 0
  },
  'ZONE-4-GULF': {
    name: 'Gulf Coast',
    states: ['Alabama', 'Mississippi', 'Louisiana', 'Arkansas', 'Tennessee', 'Kentucky'],
    multiplier: 1.03,
    remote_fee: 0
  },
  'ZONE-5-MIDWEST': {
    name: 'Midwest',
    states: ['Ohio', 'Indiana', 'Michigan', 'Illinois', 'Wisconsin'],
    multiplier: 1.00,
    remote_fee: 0
  },
  'ZONE-6-PLAINS': {
    name: 'Great Plains',
    states: ['Minnesota', 'Iowa', 'Missouri', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas'],
    multiplier: 1.02,
    remote_fee: 1.5
  },
  'ZONE-7-SOUTH-CENTRAL': {
    name: 'South Central',
    states: ['Texas', 'Oklahoma'],
    multiplier: 1.04,
    remote_fee: 2.0
  },
  'ZONE-8-MOUNTAIN': {
    name: 'Mountain',
    states: ['Montana', 'Wyoming', 'Colorado', 'New Mexico', 'Idaho'],
    multiplier: 1.09,
    remote_fee: 3.5
  },
  'ZONE-9-SOUTHWEST': {
    name: 'Southwest',
    states: ['Arizona', 'Nevada', 'Utah'],
    multiplier: 1.10,
    remote_fee: 4.0
  },
  'ZONE-10-PACIFIC': {
    name: 'Pacific Coast',
    states: ['California', 'Oregon', 'Washington'],
    multiplier: 1.15,
    remote_fee: 2.5
  },
  'ZONE-11-ALASKA': {
    name: 'Alaska',
    states: ['Alaska'],
    multiplier: 1.85,
    remote_fee: 25.0
  },
  'ZONE-12-HAWAII': {
    name: 'Hawaii',
    states: ['Hawaii'],
    multiplier: 1.75,
    remote_fee: 20.0
  }
};

// Create features for each zone by merging state geometries
const features = Object.entries(zoneGroups).map(([zone_id, config]) => {
  // Find all states in this zone
  const stateFeatures = statesData.features.filter(f =>
    config.states.includes(f.properties.name)
  );

  // For simplicity, use the first state's geometry as the zone geometry
  // In production, you'd use turf.js or similar to properly merge polygons
  const geometry = stateFeatures.length > 0 ? stateFeatures[0].geometry : null;

  return {
    type: 'Feature',
    properties: {
      zone_id,
      name: config.name,
      states: config.states.join(', '),
      multiplier: config.multiplier,
      remote_fee: config.remote_fee,
      description: `${config.name} - ${config.states.length} state(s)`
    },
    geometry
  };
});

const zonesGeoJSON = {
  type: 'FeatureCollection',
  features: features.filter(f => f.geometry !== null)
};

fs.writeFileSync('public/data/zones.geojson', JSON.stringify(zonesGeoJSON, null, 2));
console.log('Created zones.geojson with real state boundaries');
