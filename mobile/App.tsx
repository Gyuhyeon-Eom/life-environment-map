import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import MapViewComponent from "./MapViewComponent";
import TrailList from "./TrailList";
import TrailDetail from "./TrailDetail";
import BloomList from "./BloomList";
import { colors, radius } from "./theme";

const { width, height } = Dimensions.get("window");

type TabType = "home" | "trail" | "bloom";
type ViewType = "main" | "trail-list" | "trail-detail";

type WeatherData = {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rain_type?: number;
};

const API_BASE = "http://127.0.0.1:9090";

// 더미 커뮤니티 데이터 (지도 핀용)
const COMMUNITY_POSTS = [
  {
    id: "1",
    user: "산책러",
    image: "https://picsum.photos/seed/walk1/400/400",
    location: "북한산 둘레길",
    lat: 37.658,
    lng: 126.987,
    tags: ["둘레길", "산책"],
    likes: 24,
    timeAgo: "2시간 전",
    airQuality: "좋음",
  },
  {
    id: "2",
    user: "꽃구경",
    image: "https://picsum.photos/seed/flower2/400/400",
    location: "여의도 윤중로",
    lat: 37.528,
    lng: 126.932,
    tags: ["벚꽃", "봄"],
    likes: 58,
    timeAgo: "5시간 전",
    airQuality: "보통",
  },
  {
    id: "3",
    user: "등산왕",
    image: "https://picsum.photos/seed/mt3/400/400",
    location: "관악산",
    lat: 37.443,
    lng: 126.964,
    tags: ["등산", "주말"],
    likes: 15,
    timeAgo: "어제",
    airQuality: "좋음",
  },
];

const getAirColor = (grade: string) => {
  switch (grade) {
    case "좋음": return colors.airGood;
    case "보통": return colors.airNormal;
    case "나쁨": return colors.airBad;
    default: return colors.textSecondary;
  }
};

export default function App() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(true);

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
        <Image
          source={require("./assets/mascot.jpg")}
          style={styles.loadingMascot}
        />
        <Text style={styles.loadingTitle}>걸어볼까</Text>
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

      {/* ===== 홈: 지도 + 커뮤니티 바텀시트 ===== */}
      {activeTab === "home" && (
        <View style={styles.homeContainer}>
          {/* 상단 오버레이 헤더 */}
          <View style={styles.mapHeader}>
            <Text style={styles.logo}>걸어볼까</Text>
            {weather && (
              <View style={styles.weatherChip}>
                <Text style={styles.weatherChipTemp}>
                  {weather.temperature?.toFixed(0)}°
                </Text>
                <View style={styles.weatherChipDivider} />
                <Text style={styles.weatherChipInfo}>
                  {weather.humidity}%
                </Text>
              </View>
            )}
          </View>

          {/* 지도 */}
          <MapViewComponent location={location} weather={weather} />

          {/* 바텀 시트 - 커뮤니티 카드 */}
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>친구들의 산책</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>전체보기</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardScroll}
            >
              {COMMUNITY_POSTS.map((post) => (
                <TouchableOpacity key={post.id} style={styles.communityCard} activeOpacity={0.9}>
                  <Image source={{ uri: post.image }} style={styles.communityImage} />
                  <View style={styles.communityOverlay}>
                    {/* 대기질 뱃지 */}
                    <View style={[styles.airBadge, { backgroundColor: getAirColor(post.airQuality) }]}>
                      <Text style={styles.airBadgeText}>{post.airQuality}</Text>
                    </View>
                  </View>
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityLocation}>{post.location}</Text>
                    <View style={styles.communityMeta}>
                      <Text style={styles.communityUser}>{post.user}</Text>
                      <Text style={styles.communityTime}>{post.timeAgo}</Text>
                    </View>
                    <View style={styles.communityTags}>
                      {post.tags.map((tag) => (
                        <Text key={tag} style={styles.communityTag}>#{tag}</Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 빠른 액션 */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setActiveTab("trail");
                  setCurrentView("trail-list");
                }}
              >
                <Image source={require("./assets/icons/trail.jpg")} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>산책로</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setActiveTab("bloom")}
              >
                <Image source={require("./assets/icons/bloom.jpg")} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>개화현황</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={require("./assets/icons/camera.jpg")} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>사진공유</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={require("./assets/icons/friends.jpg")} style={styles.actionIcon} />
                <Text style={styles.actionLabel}>친구</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ===== 산책로 탭 ===== */}
      {activeTab === "trail" && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => handleTabChange("home")}>
              <Text style={styles.subHeaderBack}>←</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>산책로</Text>
            <View style={{ width: 40 }} />
          </View>
          <TrailList
            latitude={location.latitude}
            longitude={location.longitude}
            onSelectTrail={(trail) => {
              setSelectedTrailId(trail.id);
              setCurrentView("trail-detail");
            }}
          />
        </>
      )}

      {/* ===== 개화 탭 ===== */}
      {activeTab === "bloom" && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => handleTabChange("home")}>
              <Text style={styles.subHeaderBack}>←</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>개화 현황</Text>
            <View style={{ width: 40 }} />
          </View>
          <BloomList onSelectSpot={(spot) => console.log(spot.name)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryBg,
  },
  loadingMascot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  // 홈
  homeContainer: {
    flex: 1,
  },
  // 지도 위 헤더
  mapHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  weatherChipTemp: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  weatherChipDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  weatherChipInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // 바텀 시트
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  // 커뮤니티 카드 (가로 스크롤)
  cardScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  communityCard: {
    width: width * 0.42,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityImage: {
    width: "100%",
    height: width * 0.42,
  },
  communityOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  airBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  airBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
  communityInfo: {
    padding: 10,
  },
  communityLocation: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  communityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  communityUser: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  communityTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  communityTags: {
    flexDirection: "row",
    gap: 4,
  },
  communityTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "500",
  },
  // 빠른 액션
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    marginTop: 14,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  // 서브 헤더
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  subHeaderBack: {
    fontSize: 24,
    color: colors.text,
    width: 40,
  },
  subHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
});
