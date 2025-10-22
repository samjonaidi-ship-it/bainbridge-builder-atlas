import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const BainbridgeLogo = () => (
  <svg width="52" height="52" viewBox="0 0 53.75 52.52">
    <path fill="#bf0c2c" fillRule="evenodd" d="M12.8,5.86v2.96l-2.56,1.48v1.48l2.56-1.48v2.96l-2.56,1.48v1.48l2.56-1.48v11.77l-5.12,2.96v-2.96l-1.28.74v2.96l-2.56,1.48v-2.96l-1.28.74v2.96l-2.56,1.48v1.48l2.56-1.48v2.96l-2.56,1.48v1.48l2.56-1.48v6.49H0v1.28h2.56v2.56H0v1.28h2.56v2.56h1.28v-2.56h2.56v2.56h1.28v-2.56h46.07v-17.52l-10.24-5.91V9.01L28.18,0l-.03.02v-.02l-10.22,5.9v-2.96l-1.28.74v2.96l-2.56,1.48v-2.96l-1.28.74h0v-.04ZM6.4,31.67v2.96l-2.56,1.48v-2.96l2.56-1.48h0ZM6.4,36.11v8.71h-2.56v-7.23l2.56-1.48h0ZM6.4,46.1v2.56h-2.56v-2.56h2.56ZM7.68,48.66v-2.56h17.92v2.56H7.68ZM7.68,44.82v-9.45l5.12-2.96v2.96l1.28-.74v-2.96l2.56-1.48v2.96l1.28-.74v-2.96l7.68-4.43v19.79H7.68ZM7.68,33.89v-2.96l5.12-2.96v2.96l-5.12,2.96h0ZM25.6,23.55l-7.68,4.43v-2.96l7.68-4.43v2.96h0ZM25.6,19.11l-7.68,4.43v-11.77l7.68-4.43v11.77h0ZM25.6,5.86l-7.68,4.43v-2.96l7.68-4.43v2.96h0ZM30.71,7.31l7.68,4.43v11.8l-7.68-4.43V7.31h0ZM30.71,25.02l17.92,10.35v9.45h-17.92v-19.79h0ZM14.08,30.2v-2.96l2.56-1.48v2.96l-2.56,1.48h0ZM14.08,25.76v-11.77l2.56-1.48v11.77l-2.56,1.48h0ZM16.64,8.08v2.96l-2.56,1.48v-2.96l2.56-1.48Z"/>
  </svg>
);

export default function App() {
  const [userLocation, setUserLocation] = useState({ lat: 37.2394, lng: -121.8863 });
  const [centerOfInterest, setCenterOfInterest] = useState({ lat: 37.2394, lng: -121.8863 });
  const [map, setMap] = useState(null);
  const [showMarker, setShowMarker] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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

  if (!isLoaded) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Loading...</div>;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'20px',background:'white',borderBottom:'2px solid #bf0c2c',display:'flex',alignItems:'center',gap:'12px'}}>
        <BainbridgeLogo />
        <h1 style={{fontSize:'24px',fontWeight:'bold',color:'#bf0c2c',margin:0}}>
          Bainbridge Builders Inc. <span style={{color:'black'}}>Mapping</span>
        </h1>
      </header>
      <div style={{flex:1,position:'relative'}}>
        <GoogleMap
          mapContainerStyle={{width:'100%',height:'100%'}}
          center={userLocation}
          zoom={13}
          onLoad={onMapLoad}
        >
          {showMarker && <Marker position={userLocation} />}
        </GoogleMap>
        <div style={{position:'absolute',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:'8px',boxShadow:'0 4px 6px rgba(0,0,0,0.1)',padding:'12px 16px'}}>
          <p style={{fontSize:'11px',fontWeight:'600',color:'#374151',textAlign:'center',margin:'0 0 8px 0'}}>Preset Zoom</p>
          <div style={{display:'flex',gap:'8px'}}>
            {[1,5,10,15].map(m => (
              <button key={m} onClick={() => handleZoom(m)} style={{padding:'6px 12px',background:'#bf0c2c',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',cursor:'pointer'}}>{m}mi</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}