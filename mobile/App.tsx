import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import MapViewComponent from "./MapViewComponent";
import TrailList from "./TrailList";
import TrailDetail from "./TrailDetail";
import BloomList from "./BloomList";
import FeedScreen from "./FeedScreen";
import { colors } from "./theme";

// 탭 타입
type TabType = "home" | "trail" | "bloom" | "feed";

// 뷰 타입
type ViewType = "main" | "trail-list" | "trail-detail";

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
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          setLocation({ latitude: 37.5665, longitude: 126.978 });
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation({ latitude: 37.5665, longitude: 126.978 });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        setLocation({ latitude: 37.5665, longitude: 126.978 });
      }
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    (async () => {
      try {
        const resp = await fetch(
          `${API_BASE}/api/v1/weather?lat=${location.latitude}&lng=${location.longitude}`
        );
        const data = await resp.json();
        if (data.status === "ok") setWeather(data.data);
      } catch (e) {}
    })();
  }, [location]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentView("main");
    setSelectedTrailId(null);
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🌿</Text>
        <Text style={styles.loadingText}>위치를 불러오는 중...</Text>
      </View>
    );
  }

  // 산책로 상세
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

      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>걸어볼까</Text>
        {weather && (
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherTemp}>
              {weather.temperature?.toFixed(0)}°
            </Text>
            <Text style={styles.weatherInfo}>
              습도 {weather.humidity}%
            </Text>
          </View>
        )}
      </View>

      {/* 메인 컨텐츠 */}
      {activeTab === "home" && (
        <>
          <MapViewComponent location={location} weather={weather} />
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={() => {
              setActiveTab("trail");
              setCurrentView("trail-list");
            }}
          >
            <Text style={styles.floatingBtnText}>주변 산책로 둘러보기</Text>
          </TouchableOpacity>
        </>
      )}

      {activeTab === "trail" && currentView === "trail-list" && (
        <TrailList
          latitude={location.latitude}
          longitude={location.longitude}
          onSelectTrail={(trail) => {
            setSelectedTrailId(trail.id);
            setCurrentView("trail-detail");
          }}
        />
      )}

      {activeTab === "trail" && currentView === "main" && (
        <TrailList
          latitude={location.latitude}
          longitude={location.longitude}
          onSelectTrail={(trail) => {
            setSelectedTrailId(trail.id);
            setCurrentView("trail-detail");
          }}
        />
      )}

      {activeTab === "bloom" && (
        <BloomList onSelectSpot={(spot) => console.log(spot.name)} />
      )}

      {activeTab === "feed" && <FeedScreen />}

      {/* 하단 탭 바 */}
      <View style={styles.tabBar}>
        {[
          { key: "home" as TabType, label: "홈" },
          { key: "trail" as TabType, label: "산책로" },
          { key: "bloom" as TabType, label: "개화" },
          { key: "feed" as TabType, label: "피드" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // 헤더 (인스타 스타일)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  weatherBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  weatherInfo: {
    fontSize: 12,
    color: colors.primary,
  },
  // 플로팅 버튼
  floatingBtn: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  // 탭 바 (인스타 스타일)
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingBottom: 30,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
