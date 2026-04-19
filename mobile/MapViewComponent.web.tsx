import { View, Text, StyleSheet } from "react-native";

type Props = {
  location: { latitude: number; longitude: number };
  weather: any;
};

export default function MapViewComponent({ location, weather }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>지도 (웹 미리보기)</Text>
      <Text style={styles.coord}>
        위도: {location.latitude.toFixed(4)}, 경도: {location.longitude.toFixed(4)}
      </Text>
      {weather && (
        <Text style={styles.weather}>
          {weather.temperature}°C | 습도 {weather.humidity}% | 풍속 {weather.wind_speed}m/s
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  coord: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  weather: {
    fontSize: 16,
    color: "#333",
    marginTop: 8,
  },
});
