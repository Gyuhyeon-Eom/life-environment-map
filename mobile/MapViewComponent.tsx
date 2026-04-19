import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Props = {
  location: { latitude: number; longitude: number };
  weather: any;
};

export default function MapViewComponent({ location, weather }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      <Marker
        coordinate={location}
        title="현재 위치"
        description={
          weather
            ? `${weather.temperature}°C, 습도 ${weather.humidity}%`
            : "날씨 정보 로딩 중"
        }
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
