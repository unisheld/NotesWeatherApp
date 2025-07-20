import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, {
  Marker,
  MapPressEvent,
  LatLng,
  Region,
} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { requestLocationPermission } from '../utils/permissions';

export type WeatherMapProps = {
  selectedCoords: LatLng | null;
  onPress?: (event: MapPressEvent) => void;
  onMarkerDragEnd?: (coords: LatLng) => void;
};

export default function WeatherMap({
  selectedCoords,
  onPress,
  onMarkerDragEnd,
}: WeatherMapProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 52.3676, //Amsterdam
    longitude: 4.9041,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const centerOnCurrentLocation = async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;

      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
        },
        (error) => {
          console.warn('Error getting current position:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    };

    centerOnCurrentLocation();
  }, []);

  useEffect(() => {
    if (selectedCoords) {
      const newRegion = {
        ...selectedCoords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  }, [selectedCoords]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      region={region}
      onPress={onPress}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {selectedCoords && (
        <Marker
          coordinate={selectedCoords}
          draggable
          onDragEnd={(e) => {
            onMarkerDragEnd?.(e.nativeEvent.coordinate);
          }}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
});
