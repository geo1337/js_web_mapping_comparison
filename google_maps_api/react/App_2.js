import React from 'react';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';

const container_style = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 48.780441979092366,
  lng: 9.172625814438375
};

const MyMap = () => {
  return (
    <LoadScript googleMapsApiKey=" ">
      <GoogleMap
        mapContainerStyle={container_style}
        center={center}
        zoom={10}
      >
      </GoogleMap>
    </LoadScript>
  );
}

export default React.memo(MyMap);