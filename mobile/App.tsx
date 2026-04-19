import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import MapViewComponent from "./MapViewComponent";
import TrailList from "./TrailList";
import TrailDetail from "./TrailDetail";
import BloomList from "./BloomList";

// 탭 타입
type TabType = "trail" | "bloom";

// 뷰 타입
type ViewType = "map" | "trail-list" | "trail-detail";

// 날씨 데이터 타입
type WeatherData = {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall?: number;
  rain_type?: number;
};

// 백엔드 API URL
const API_BASE = "http://127.0.0.1:9090";

export default function App() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("trail");
  const [currentView, setCurrentView] = useState<ViewType>("map");
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 위치 권한 요청 + 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          setLocation({ latitude: 37.5665, longitude: 126.978 });
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("위치 권한이 필요합니다");
          setLocation({ latitude: 37.5665, longitude: 126.978 });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.log("위치 가져오기 실패:", e);
        setLocation({ latitude: 37.5665, longitude: 126.978 });
      }
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

  // 강수 형태 텍스트
  const getRainTypeText = (type?: number) => {
    switch (type) {
      case 0: return null;
      case 1: return "비";
      case 2: return "비/눈";
      case 3: return "눈";
      default: return null;
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentView("map");
    setSelectedTrailId(null);
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

  // 산책로 상세 화면
  if (currentView === "trail-detail" && selectedTrailId) {
    return (
      <TrailDetail
        contentId={selectedTrailId}
        onBack={() => {
          setCurrentView("trail-list");
          setSelectedTrailId(null);
        }}
      />
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

      {/* 메인 컨텐츠 영역 */}
      {activeTab === "trail" && currentView === "trail-list" ? (
        <TrailList
          latitude={location.latitude}
          longitude={location.longitude}
          onSelectTrail={(trail) => {
            setSelectedTrailId(trail.id);
            setCurrentView("trail-detail");
          }}
        />
      ) : activeTab === "bloom" ? (
        <BloomList
          onSelectSpot={(spot) => {
            console.log("선택:", spot.name);
            // TODO: 상세 화면 연결
          }}
        />
      ) : (
        <>
          <MapViewComponent location={location} weather={weather} />
          {/* 산책로 목록 보기 버튼 */}
          {activeTab === "trail" && (
            <TouchableOpacity
              style={styles.listButton}
              onPress={() => setCurrentView("trail-list")}
            >
              <Text style={styles.listButtonText}>주변 산책로 목록 보기</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* 하단 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "trail" && styles.activeTab]}
          onPress={() => handleTabChange("trail")}
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
          style={[styles.tab, activeTab === "bloom" && styles.activeTab]}
          onPress={() => handleTabChange("bloom")}
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
  weatherBar: {
    backgroundColor: "#fff",
    paddingTop: 50,
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
  // 산책로 목록 보기 버튼
  listButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  listButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  // 커밍순
  comingSoon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFF8E1",
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F57F17",
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  // 탭 바
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: 30,
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
