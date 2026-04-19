import { View, Text, StyleSheet, Dimensions } from "react-native";
import { colors } from "./theme";

const { width, height } = Dimensions.get("window");

type Props = {
  location: { latitude: number; longitude: number };
  weather: any;
};

export default function MapViewComponent({ location, weather }: Props) {
  return (
    <View style={styles.container}>
      {/* 격자 패턴 배경으로 지도 느낌 */}
      <View style={styles.gridBg}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12}%` }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 15}%` }]} />
        ))}
      </View>

      {/* 중앙 핀 */}
      <View style={styles.pinContainer}>
        <Text style={styles.pin}>📍</Text>
        <View style={styles.pinInfo}>
          <Text style={styles.pinTitle}>현재 위치</Text>
          <Text style={styles.pinCoord}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* 날씨 오버레이 */}
      {weather && (
        <View style={styles.weatherOverlay}>
          <Text style={styles.weatherTemp}>{weather.temperature?.toFixed(0)}°C</Text>
          <Text style={styles.weatherDetail}>습도 {weather.humidity}% · 풍속 {weather.wind_speed}m/s</Text>
        </View>
      )}

      {/* 더미 핀들 */}
      <Text style={[styles.dummyPin, { top: "25%", left: "30%" }]}>📸</Text>
      <Text style={[styles.dummyPin, { top: "35%", left: "65%" }]}>📸</Text>
      <Text style={[styles.dummyPin, { top: "55%", left: "45%" }]}>📸</Text>

      {/* 웹 안내 */}
      <View style={styles.webNotice}>
        <Text style={styles.webNoticeText}>실제 지도는 모바일 앱에서 확인하세요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0E8",
    position: "relative",
  },
  // 격자 배경
  gridBg: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(45,106,79,0.08)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(45,106,79,0.08)",
  },
  // 중앙 핀
  pinContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
  },
  pin: {
    fontSize: 36,
  },
  pinInfo: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  pinTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  pinCoord: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // 날씨
  weatherOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  weatherDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // 더미 핀
  dummyPin: {
    position: "absolute",
    fontSize: 24,
  },
  // 웹 안내
  webNotice: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  webNoticeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
});
