import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import TEST_DATA_RAW from './data/testData.json';

// Move libraries outside component to prevent re-renders
const GOOGLE_MAPS_LIBRARIES = ['places'];

const BainbridgeLogo = () => (
  <svg width="52" height="52" viewBox="0 0 53.75 52.52">
    <path fill="#bf0c2c" fillRule="evenodd" d="M12.8,5.86v2.96l-2.56,1.48v1.48l2.56-1.48v2.96l-2.56,1.48v1.48l2.56-1.48v11.77l-5.12,2.96v-2.96l-1.28.74v2.96l-2.56,1.48v-2.96l-1.28.74v2.96l-2.56,1.48v1.48l2.56-1.48v2.96l-2.56,1.48v1.48l2.56-1.48v6.49H0v1.28h2.56v2.56H0v1.28h2.56v2.56h1.28v-2.56h2.56v2.56h1.28v-2.56h46.07v-17.52l-10.24-5.91V9.01L28.18,0l-.03.02v-.02l-10.22,5.9v-2.96l-1.28.74v2.96l-2.56,1.48v-2.96l-1.28.74h0v-.04ZM6.4,31.67v2.96l-2.56,1.48v-2.96l2.56-1.48h0ZM6.4,36.11v8.71h-2.56v-7.23l2.56-1.48h0ZM6.4,46.1v2.56h-2.56v-2.56h2.56ZM7.68,48.66v-2.56h17.92v2.56H7.68ZM7.68,44.82v-9.45l5.12-2.96v2.96l1.28-.74v-2.96l2.56-1.48v2.96l1.28-.74v-2.96l7.68-4.43v19.79H7.68ZM7.68,33.89v-2.96l5.12-2.96v2.96l-5.12,2.96h0ZM25.6,23.55l-7.68,4.43v-2.96l7.68-4.43v2.96h0ZM25.6,19.11l-7.68,4.43v-11.77l7.68-4.43v11.77h0ZM25.6,5.86l-7.68,4.43v-2.96l7.68-4.43v2.96h0ZM30.71,7.31l7.68,4.43v11.8l-7.68-4.43V7.31h0ZM30.71,25.02l17.92,10.35v9.45h-17.92v-19.79h0ZM14.08,30.2v-2.96l2.56-1.48v2.96l-2.56,1.48h0ZM14.08,25.76v-11.77l2.56-1.48v11.77l-2.56,1.48h0ZM16.64,8.08v2.96l-2.56,1.48v-2.96l2.56-1.48Z"/>
  </svg>
);

const STORAGE_KEY = 'bainbridge_locations';

// Add created_at timestamp to imported test data
const TEST_DATA = TEST_DATA_RAW.map(item => ({
  ...item,
  created_at: new Date().toISOString()
}));

const getLocations = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocation = (location) => {
  const locations = getLocations();
  locations.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
};

const checkIfExists = (lat, lng, address) => {
  const locations = getLocations();
  return locations.find(loc => {
    const latMatch = Math.abs(loc.lat - lat) < 0.0001;
    const lngMatch = Math.abs(loc.lng - lng) < 0.0001;
    const addressMatch = loc.address.toLowerCase() === address.toLowerCase();
    return (latMatch && lngMatch) || addressMatch;
  });
};

export default function App() {
  const [userLocation, setUserLocation] = useState({ lat: 37.2394, lng: -121.8863 });
  const [centerOfInterest, setCenterOfInterest] = useState({ lat: 37.2394, lng: -121.8863 });
  const [map, setMap] = useState(null);
  const [showMarker, setShowMarker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [autocomplete, setAutocomplete] = useState(null);
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [canAdd, setCanAdd] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [showTestData, setShowTestData] = useState(true); // Toggle for test data
  const [formData, setFormData] = useState({
    category: 'customer',
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setCenterOfInterest(loc);
      }
    );
  }, []);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const locations = JSON.parse(data);
      setAllLocations(locations);
      console.log('Loaded', locations.length, 'locations from localStorage');
    }
  }, []);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    setTimeout(() => setShowMarker(true), 500);
  };

  const handleZoom = (miles) => {
    const z = { 1: 14, 5: 12, 10: 11, 15: 10 };
    if (map) {
      map.panTo(centerOfInterest);
      map.setZoom(z[miles]);
    }
  };

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        };
        const existing = checkIfExists(newLocation.lat, newLocation.lng, newLocation.address);
        if (existing) {
          setCanAdd(false);
          setExistingRecord(existing);
        } else {
          setCanAdd(true);
          setExistingRecord(null);
        }
        if (map) {
          map.panTo(newLocation);
          map.setZoom(15);
        }
        setCenterOfInterest(newLocation);
        setSearchMarker(newLocation);
        setSearchedPlace(place);
      }
    }
  };

  const handleAddClick = () => {
    setShowAddModal(true);
    setFormData({
      category: 'customer',
      name: searchedPlace?.name || '',
      phone: searchedPlace?.formatted_phone_number || '',
      email: '',
      notes: ''
    });
  };

  const handleViewExisting = () => {
    setShowViewModal(true);
  };

  const handleSaveLocation = () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for this location');
      return;
    }
    const newLocation = {
      id: Date.now().toString(),
      category: formData.category,
      name: formData.name,
      address: searchedPlace.formatted_address,
      lat: searchMarker.lat,
      lng: searchMarker.lng,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes,
      created_at: new Date().toISOString()
    };
    saveLocation(newLocation);
    setAllLocations([...allLocations, newLocation]);
    setShowAddModal(false);
    setSearchMarker(null);
    setSearchedPlace(null);
    setCanAdd(false);
    setExistingRecord(null);
    setFormData({ category: 'customer', name: '', phone: '', email: '', notes: '' });
    alert('Location saved successfully!');
  };

  // Combine test data with user-added locations
  const displayLocations = showTestData ? [...TEST_DATA, ...allLocations] : allLocations;

  // Get marker color based on category
  const getMarkerColor = (category) => {
    const colors = {
      customer: '#3b82f6',      // Blue
      vendor: '#8b5cf6',        // Purple
      chain_store: '#f97316',   // Orange
      employee: '#10b981'       // Green
    };
    return colors[category] || '#3b82f6';
  };

  if (!isLoaded) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Loading...</div>;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'20px',background:'white',borderBottom:'2px solid #bf0c2c',display:'flex',alignItems:'flex-end',gap:'20px',position:'relative',zIndex:50}}>
        <div style={{display:'flex',alignItems:'flex-end'}}><BainbridgeLogo /></div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1.2}}>
          <div style={{fontSize:'14px',fontWeight:'bold',color:'#374151',letterSpacing:'0.02em',textAlign:'right',alignSelf:'flex-end'}}>Atlas</div>
          <h1 style={{fontSize:'24px',fontWeight:'bold',color:'#bf0c2c',margin:0,whiteSpace:'nowrap'}}>
            Bainbridge Builders Inc.
          </h1>
        </div>
        <div style={{flex:1}}></div>
        <div style={{flex:'0 0 auto',minWidth:'300px',maxWidth:'400px',position:'relative',display:'flex',alignItems:'center'}}>
          <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceSelect}>
            <input 
              type="text" 
              placeholder="Search..." 
              onChange={() => {
                setCanAdd(false);
                setExistingRecord(null);
                setSearchMarker(null);
                setSearchedPlace(null);
              }}
              style={{width:'100%',padding:'10px 12px 10px 36px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px',lineHeight:1}}
            />
          </Autocomplete>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)'}}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        {!canAdd && !existingRecord && (
          <button disabled style={{padding:'10px 16px',background:'#d1d5db',color:'#9ca3af',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'not-allowed',display:'flex',alignItems:'center',gap:'4px',lineHeight:1,flex:'none',opacity:0.6}}>
            <span style={{fontSize:'18px',lineHeight:1}}>+</span> Add
          </button>
        )}
        {canAdd && !existingRecord && (
          <button onClick={handleAddClick} style={{padding:'10px 16px',background:'#bf0c2c',color:'white',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',lineHeight:1,flex:'none',transition:'background 0.2s'}} onMouseOver={(e) => e.currentTarget.style.background = '#a00a24'} onMouseOut={(e) => e.currentTarget.style.background = '#bf0c2c'}>
            <span style={{fontSize:'18px',lineHeight:1}}>+</span> Add
          </button>
        )}
        {existingRecord && (
          <button onClick={handleViewExisting} style={{padding:'10px 16px',background:'#2563eb',color:'white',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',lineHeight:1,flex:'none',transition:'background 0.2s'}} onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}>
            📍 View
          </button>
        )}
        <button onClick={() => setShowSettings(true)} style={{width:'40px',height:'40px',border:'none',background:'transparent',cursor:'pointer',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.2s',flex:'none'}} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button onClick={() => setShowHelp(true)} style={{width:'40px',height:'40px',border:'2px solid #bf0c2c',background:'white',color:'#bf0c2c',cursor:'pointer',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'18px',lineHeight:1,flex:'none'}}>?</button>
      </header>

      <aside style={{position:'fixed',left:0,top:'76px',bottom:0,width:sidebarOpen?'280px':'60px',background:'white',borderRight:'2px solid #e5e7eb',transition:'width 0.3s ease',zIndex:40,overflowY:'auto'}}>
        <div style={{padding:'16px'}}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'8px',background:'transparent',border:'none',borderRadius:'8px',cursor:'pointer',transition:'background 0.2s'}} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {sidebarOpen && <span style={{fontWeight:600,color:'#374151'}}>Layers</span>}
          </button>
          {sidebarOpen && (
            <div style={{marginTop:'24px'}}>
              <div style={{paddingBottom:'8px',borderBottom:'2px solid #bf0c2c',marginBottom:'12px'}}>
                <h3 style={{fontSize:'12px',fontWeight:600,color:'#374151',textTransform:'uppercase',margin:0}}>Test Data</h3>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px',cursor:'pointer',borderRadius:'6px',transition:'background 0.2s'}} onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <input type="checkbox" checked={showTestData} onChange={(e) => setShowTestData(e.target.checked)} style={{width:'16px',height:'16px',cursor:'pointer'}}/>
                <span style={{fontSize:'14px',color:'#374151'}}>Show Test Data (40)</span>
              </label>
            </div>
          )}
        </div>
      </aside>

      <div style={{flex:1,position:'relative',marginLeft:sidebarOpen?'280px':'60px',transition:'margin-left 0.3s ease'}}>
        <GoogleMap mapContainerStyle={{width:'100%',height:'100%'}} center={userLocation} zoom={13} onLoad={onMapLoad} mapTypeId={mapType} options={{disableDefaultUI:false,zoomControl:true,mapTypeControl:false,scaleControl:false,streetViewControl:false,rotateControl:false,fullscreenControl:false}}>
          {showMarker && <Marker position={userLocation} icon={{url:'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" fill="#bf0c2c" stroke="white" stroke-width="2"/><circle cx="18" cy="18" r="6" fill="white"/></svg>'),scaledSize:new window.google.maps.Size(36,48),anchor:new window.google.maps.Point(18,48)}}/>}
          {searchMarker && <Marker position={searchMarker} icon={{url:'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" fill="#10b981" stroke="white" stroke-width="2"/><circle cx="18" cy="18" r="6" fill="white"/></svg>'),scaledSize:new window.google.maps.Size(36,48),anchor:new window.google.maps.Point(18,48)}}/>}
          {displayLocations.map(location => (
            <Marker 
              key={location.id} 
              position={{lat:location.lat,lng:location.lng}} 
              icon={{url:'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.059 27.941 0 18 0z" fill="${getMarkerColor(location.category)}" stroke="white" stroke-width="2"/><circle cx="18" cy="18" r="6" fill="white"/></svg>`),scaledSize:new window.google.maps.Size(36,48),anchor:new window.google.maps.Point(18,48)}}
              title={location.name}
            />
          ))}
        </GoogleMap>
        <div style={{position:'absolute',bottom:'20px',left:'20px',display:'flex',flexDirection:'column',gap:'8px'}}>
          {[1,5,10,15].map(miles => (
            <button key={miles} onClick={() => handleZoom(miles)} style={{padding:'8px 16px',background:'white',border:'2px solid #bf0c2c',color:'#bf0c2c',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',transition:'all 0.2s'}} onMouseOver={(e) => {e.currentTarget.style.background='#bf0c2c';e.currentTarget.style.color='white'}} onMouseOut={(e) => {e.currentTarget.style.background='white';e.currentTarget.style.color='#bf0c2c'}}>{miles}mi</button>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={() => setShowAddModal(false)}>
          <div style={{background:'white',borderRadius:'8px',width:'90%',maxWidth:'500px',maxHeight:'80vh',overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
            <div style={{padding:'20px',borderBottom:'2px solid #bf0c2c',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{margin:0,fontSize:'20px',fontWeight:'bold'}}>Add New Location</h2>
              <button onClick={() => setShowAddModal(false)} style={{background:'transparent',border:'none',fontSize:'24px',cursor:'pointer',color:'#6b7280'}}>×</button>
            </div>
            <div style={{padding:'20px'}}>
              <div style={{marginBottom:'16px',padding:'12px',background:'#f3f4f6',borderRadius:'6px',fontSize:'14px',color:'#374151'}}>
                <strong>Address:</strong><br/>{searchedPlace?.formatted_address}
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',marginBottom:'6px',fontSize:'14px',fontWeight:600,color:'#374151'}}>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px'}}>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="chain_store">Chain Store</option>
                  <option value="employee">Employee Home</option>
                </select>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',marginBottom:'6px',fontSize:'14px',fontWeight:600,color:'#374151'}}>Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name" style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px'}}/>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',marginBottom:'6px',fontSize:'14px',fontWeight:600,color:'#374151'}}>Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(408) 555-1234" style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px'}}/>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',marginBottom:'6px',fontSize:'14px',fontWeight:600,color:'#374151'}}>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="name@example.com" style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px'}}/>
              </div>
              <div style={{marginBottom:'20px'}}>
                <label style={{display:'block',marginBottom:'6px',fontSize:'14px',fontWeight:600,color:'#374151'}}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Add any notes..." rows="3" style={{width:'100%',padding:'8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'14px',resize:'vertical'}}></textarea>
              </div>
              <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
                <button onClick={() => setShowAddModal(false)} style={{padding:'10px 20px',background:'#e5e7eb',color:'#374151',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSaveLocation} style={{padding:'10px 20px',background:'#bf0c2c',color:'white',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>Save Location</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && existingRecord && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={() => setShowViewModal(false)}>
          <div style={{background:'white',borderRadius:'8px',width:'90%',maxWidth:'500px',maxHeight:'80vh',overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
            <div style={{padding:'20px',borderBottom:'2px solid #2563eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{margin:0,fontSize:'20px',fontWeight:'bold'}}>📍 Existing Location</h2>
              <button onClick={() => setShowViewModal(false)} style={{background:'transparent',border:'none',fontSize:'24px',cursor:'pointer',color:'#6b7280'}}>×</button>
            </div>
            <div style={{padding:'20px'}}>
              <div style={{marginBottom:'16px'}}>
                <span style={{display:'inline-block',padding:'4px 12px',background:'#dbeafe',color:'#2563eb',borderRadius:'12px',fontSize:'12px',fontWeight:600,textTransform:'uppercase'}}>{existingRecord.category}</span>
              </div>
              <h3 style={{margin:'0 0 12px 0',fontSize:'18px',fontWeight:'bold',color:'#374151'}}>{existingRecord.name}</h3>
              <div style={{marginBottom:'12px',fontSize:'14px',color:'#6b7280'}}>{existingRecord.address}</div>
              {existingRecord.phone && <div style={{marginBottom:'8px',fontSize:'14px',color:'#374151'}}><strong>Phone:</strong> {existingRecord.phone}</div>}
              {existingRecord.email && <div style={{marginBottom:'8px',fontSize:'14px',color:'#374151'}}><strong>Email:</strong> {existingRecord.email}</div>}
              {existingRecord.notes && <div style={{marginTop:'12px',padding:'12px',background:'#f9fafb',borderRadius:'6px',fontSize:'14px',color:'#374151'}}><strong>Notes:</strong><br/>{existingRecord.notes}</div>}
              <div style={{marginTop:'16px',fontSize:'12px',color:'#9ca3af'}}>Added: {new Date(existingRecord.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={() => setShowSettings(false)}>
          <div style={{background:'white',borderRadius:'8px',width:'90%',maxWidth:'500px',maxHeight:'80vh',overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
            <div style={{padding:'20px',borderBottom:'2px solid #bf0c2c',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{margin:0,fontSize:'20px',fontWeight:'bold'}}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{background:'transparent',border:'none',fontSize:'24px',cursor:'pointer',color:'#6b7280'}}>×</button>
            </div>
            <div style={{padding:'20px'}}>
              <p style={{color:'#6b7280',fontSize:'14px'}}>Settings functionality will be added in Stage 2B</p>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={() => setShowHelp(false)}>
          <div style={{background:'white',borderRadius:'8px',width:'90%',maxWidth:'600px',maxHeight:'80vh',overflow:'auto'}} onClick={(e) => e.stopPropagation()}>
            <div style={{padding:'20px',borderBottom:'2px solid #bf0c2c',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{margin:0,fontSize:'20px',fontWeight:'bold'}}>Help & Guide</h2>
              <button onClick={() => setShowHelp(false)} style={{background:'transparent',border:'none',fontSize:'24px',cursor:'pointer',color:'#6b7280'}}>×</button>
            </div>
            <div style={{padding:'20px'}}>
              <h3 style={{marginTop:0,color:'#bf0c2c'}}>Getting Started</h3>
              <p style={{color:'#374151',lineHeight:'1.6'}}>Welcome to Bainbridge Builder Atlas. This application helps you manage and visualize customer, vendor, and employee locations.</p>
              <h3 style={{color:'#bf0c2c'}}>Quick Tips</h3>
              <ul style={{color:'#374151',lineHeight:'1.8'}}>
                <li>Search for an address using the search bar</li>
                <li>When a NEW address is found, the "+Add" button turns red</li>
                <li>If the address exists, you'll see a "View" button instead</li>
                <li>All saved locations appear as colored markers on the map</li>
                <li>Toggle test data on/off using the sidebar</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
