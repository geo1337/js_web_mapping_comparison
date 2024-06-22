
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const center = [48.82028377660814, 9.156748580239588];
const position =[48.82028377660814, 9.156748580239588];
const defaultMarkerIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41],
});
function App() {
  return (
  <MapContainer center={center} zoom={10} style={{width: '100vw', height: '100vh'}}>
    <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}>

    </TileLayer>
    <Marker position={position} icon={defaultMarkerIcon}>
      <Popup>
      Hello world! <br /> 
      </Popup>
    </Marker>
  </MapContainer>
  );
}

export default App;
