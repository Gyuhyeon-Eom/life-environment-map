import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

// 탭 타입
type TabType = "trail" | "noise" | "bloom";

// 날씨 데이터 타입
type WeatherData = {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall?: number;
  rain_type?: number;
};

// 대기질 데이터 타입
type AirQualityData = {
  pm10?: number | null;
  pm25?: number | null;
  pm10_grade?: string;
  pm25_grade?: string;
  khai_grade?: string;
};

// 백엔드 API URL (개발 시 본인 PC IP로 변경)
const API_BASE = "http://10.0.2.2:9090"; // Android 에뮬레이터용
// const API_BASE = "http://localhost:9090"; // iOS 시뮬레이터용
// const API_BASE = "http://192.168.x.x:9090"; // 실기기 테스트 시 PC의 로컬 IP

export default function App() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("trail");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 위치 권한 요청 + 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 권한이 필요합니다");
        // 권한 없으면 서울 시청 기본값
        setLocation({ latitude: 37.5665, longitude: 126.978 });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // 날씨 데이터 가져오기
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        const resp = await fetch(
          `${API_BASE}/api/v1/weather?lat=${location.latitude}&lng=${location.longitude}`
        );
        const data = await resp.json();
        if (data.status === "ok") {
          setWeather(data.data);
        }
      } catch (e) {
        console.log("날씨 데이터 로드 실패:", e);
      }
    };

    fetchWeather();
  }, [location]);

  // 미세먼지 등급별 색상
  const getAirQualityColor = (grade?: string) => {
    switch (grade) {
      case "좋음":
        return "#4CAF50";
      case "보통":
        return "#2196F3";
      case "나쁨":
        return "#FF9800";
      case "매우나쁨":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  // 강수 형태 텍스트
  const getRainTypeText = (type?: number) => {
    switch (type) {
      case 0:
        return null;
      case 1:
        return "비";
      case 2:
        return "비/눈";
      case 3:
        return "눈";
      case 5:
        return "빗방울";
      case 6:
        return "빗방울눈날림";
      case 7:
        return "눈날림";
      default:
        return null;
    }
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {errorMsg || "위치를 불러오는 중..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 상단 날씨 정보 바 */}
      <View style={styles.weatherBar}>
        {weather ? (
          <View style={styles.weatherContent}>
            <Text style={styles.weatherTemp}>
              {weather.temperature?.toFixed(1)}°C
            </Text>
            <Text style={styles.weatherDetail}>
              습도 {weather.humidity}%
            </Text>
            <Text style={styles.weatherDetail}>
              풍속 {weather.wind_speed}m/s
            </Text>
            {getRainTypeText(weather.rain_type) && (
              <Text style={styles.weatherRain}>
                {getRainTypeText(weather.rain_type)}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.weatherDetail}>날씨 로딩 중...</Text>
        )}
      </View>

      {/* 지도 */}
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

      {/* 하단 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "trail" && styles.activeTab]}
          onPress={() => setActiveTab("trail")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "trail" && styles.activeTabText,
            ]}
          >
            산책로
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "noise" && styles.activeTab]}
          onPress={() => setActiveTab("noise")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "noise" && styles.activeTabText,
            ]}
          >
            소음
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "bloom" && styles.activeTab]}
          onPress={() => setActiveTab("bloom")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "bloom" && styles.activeTabText,
            ]}
          >
            벚꽃/단풍
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  // 상단 날씨 바
  weatherBar: {
    backgroundColor: "#fff",
    paddingTop: 50, // 상태바 높이
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  weatherDetail: {
    fontSize: 14,
    color: "#666",
  },
  weatherRain: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
  // 지도
  map: {
    flex: 1,
  },
  // 하단 탭 바
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: 30, // 하단 안전 영역
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4CAF50",
    fontWeight: "700",
  },
});
