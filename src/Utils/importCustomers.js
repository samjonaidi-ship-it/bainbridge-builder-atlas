// Import customer data from Excel file
// This is a one-time utility to load initial customer data

const customerData = [
  { name: '970 Aptos', address: '970 Huntington Dr, Aptos, CA 95003' },
  { name: 'Bainbridge', address: '4333 Fairway Dr, Soquel, CA 95073' },
  { name: 'Brian Baumgartner', address: '529 N 22nd St, San Jose, CA 95112' },
  { name: 'Christian Warne', address: '10650 E Zayante Rd, Felton, CA 95018' },
  { name: 'David Krueger', address: '18101 Overlook Rd, Los Gatos, CA 95030' },
  { name: 'Derek Ross', address: '122 Grandview St, Santa Cruz, CA 95060' },
  { name: 'Elizabeth Johnson', address: '3095 Woodwardia Dr, Aptos, CA 95003' },
  { name: 'Eric Vane', address: '122 Primrose Ln, Santa Cruz, CA 95062' },
  { name: 'James Leong', address: '4325 Scotts Valley Dr, Scotts Valley, CA 95066' },
  { name: 'Jeff Taylor', address: '1013 Seacliff Dr, Aptos, CA 95003' },
  { name: 'Jessie Martin', address: '7420 Langley Canyon Rd, Salinas, CA 93907' },
  { name: 'John Canepa', address: '3 Buckskin Ln, Scotts Valley, CA 95066' },
  { name: 'John Hoeck', address: '7 Upper Highland Way, Watsonville, CA 95076' },
  { name: 'John T', address: '475 Mill St, Half Moon Bay, CA 94019' },
  { name: 'Julie & Don Anderson', address: '1500 Hillcrest Dr, Boulder Creek, CA 95006' },
  { name: 'Kathy Moreno', address: '1520 Rodeo Gulch Rd, Soquel, CA 95073' },
  { name: 'Laura Young', address: '625 Lincoln St #6, Santa Cruz, CA 95060' },
  { name: 'Mariposa Residence', address: '1329 Oslo Ln, San Jose, CA 95129' },
  { name: 'Marsha Briscoe', address: '314 Seacliff Dr, Aptos, CA 95003' },
  { name: 'Matt Lymberis', address: '3 Tiki Ln, Aptos, CA 95003' },
  { name: 'Michael and Julianne Boyle', address: '610 Spruce Ave, Pacific Grove, CA 93950' },
  { name: 'Pat Henry', address: '146 Seacliff Dr, Aptos, CA 95003' },
  { name: 'William McLaughlin', address: '1120 Laurel St, Santa Cruz, CA 95060' }
];

// Function to geocode address using Google Maps API
async function geocodeAddress(address, apiKey) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
      };
    } else {
      console.error(`Geocoding failed for ${address}:`, data.status);
      return null;
    }
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error);
    return null;
  }
}

// Main import function
export async function importCustomers(apiKey, onProgress) {
  const STORAGE_KEY = 'bainbridge_locations';
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // Get existing locations
  const existingData = localStorage.getItem(STORAGE_KEY);
  const locations = existingData ? JSON.parse(existingData) : [];
  
  console.log('Starting import of', customerData.length, 'customers...');
  
  for (let i = 0; i < customerData.length; i++) {
    const customer = customerData[i];
    
    // Check if already exists
    const exists = locations.find(loc => 
      loc.name.toLowerCase() === customer.name.toLowerCase() ||
      loc.address.toLowerCase() === customer.address.toLowerCase()
    );
    
    if (exists) {
      console.log(`Skipping ${customer.name} (already exists)`);
      results.skipped++;
      if (onProgress) onProgress(i + 1, customerData.length, customer.name, 'skipped');
      continue;
    }
    
    // Geocode address
    console.log(`Geocoding ${customer.name}...`);
    if (onProgress) onProgress(i + 1, customerData.length, customer.name, 'processing');
    
    const geoData = await geocodeAddress(customer.address, apiKey);
    
    if (geoData) {
      const newLocation = {
        id: Date.now().toString() + '_' + i,
        category: 'customer',
        name: customer.name,
        address: geoData.formatted_address,
        lat: geoData.lat,
        lng: geoData.lng,
        phone: '',
        email: '',
        notes: 'Imported from Excel',
        created_at: new Date().toISOString()
      };
      
      locations.push(newLocation);
      results.success++;
      console.log(`✓ Added ${customer.name}`);
    } else {
      results.failed++;
      results.errors.push({
        name: customer.name,
        address: customer.address,
        error: 'Geocoding failed'
      });
      console.log(`✗ Failed to geocode ${customer.name}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  
  console.log('\n=== Import Complete ===');
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`- ${err.name}: ${err.error}`);
    });
  }
  
  return results;
}

// Browser console helper
export function runImport() {
  const apiKey = prompt('Enter your Google Maps API Key:');
  if (!apiKey) {
    console.error('API key required!');
    return;
  }
  
  console.log('Starting import... (this may take 30-60 seconds)');
  importCustomers(apiKey, (current, total, name, status) => {
    console.log(`[${current}/${total}] ${name} - ${status}`);
  }).then(results => {
    alert(`Import complete!\nSuccess: ${results.success}\nFailed: ${results.failed}\nSkipped: ${results.skipped}`);
    window.location.reload(); // Refresh to show markers
  });
}
