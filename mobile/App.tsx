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
  PanResponder,
  TextInput,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import MapViewComponent from "./MapViewComponent";
import TrailList from "./TrailList";
import TrailDetail from "./TrailDetail";
import BloomList from "./BloomList";
import WalkScoreCard from "./WalkScoreCard";
import StepTracker from "./StepTracker";
import CharacterShop from "./CharacterShop";
import { colors, radius } from "./theme";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 바텀시트 높이 설정
const TAB_BAR_HEIGHT = 70;
const SHEET_PEEK = 160;       // 쾌적도만 살짝 보이는 높이
const SHEET_MID = SCREEN_HEIGHT * 0.5;  // 중간
const SHEET_FULL = SCREEN_HEIGHT * 0.85 - TAB_BAR_HEIGHT; // 탭바 위까지만

type TabType = "home" | "trail" | "bloom" | "bear" | "friends";
type ViewType = "main" | "trail-list" | "trail-detail";

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type WeatherData = {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rain_type?: number;
};

const API_BASE = "http://127.0.0.1:9090";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPoiFilter, setShowPoiFilter] = useState(false);
  const [poiVisible, setPoiVisible] = useState<Record<string, boolean>>({
    cafe: true, toilet: true, convenience: true, bench: true,
    drinking_water: true, parking: true, restaurant: true, pharmacy: true,
  });
  const mapIframeRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          // 브라우저 Geolocation API 사용
          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setLocation({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                });
              },
              () => {
                // 거부 시 기본값
                setLocation({ latitude: 37.5665, longitude: 126.978 });
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          } else {
            setLocation({ latitude: 37.5665, longitude: 126.978 });
          }
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

  // 드래그 바텀시트
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT - SHEET_PEEK - TAB_BAR_HEIGHT)).current;
  const lastSheetY = useRef(SCREEN_HEIGHT - SHEET_PEEK - TAB_BAR_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        sheetY.setOffset(lastSheetY.current);
        sheetY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        sheetY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        sheetY.flattenOffset();
        const currentY = lastSheetY.current + g.dy;

        // 스냅 포인트 결정 (탭바 위)
        const peekY = SCREEN_HEIGHT - SHEET_PEEK - TAB_BAR_HEIGHT;
        const midY = SCREEN_HEIGHT - SHEET_MID - TAB_BAR_HEIGHT;
        const fullY = SCREEN_HEIGHT - SHEET_FULL - TAB_BAR_HEIGHT;

        let snapTo: number;
        if (g.vy > 0.5) {
          snapTo = peekY;
        } else if (g.vy < -0.5) {
          snapTo = fullY;
        } else if (currentY < (fullY + midY) / 2) {
          snapTo = fullY;
        } else if (currentY < (midY + peekY) / 2) {
          snapTo = midY;
        } else {
          snapTo = peekY;
        }

        lastSheetY.current = snapTo;
        Animated.spring(sheetY, {
          toValue: snapTo,
          friction: 8,
          tension: 65,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const togglePoi = (category: string) => {
    setPoiVisible((prev) => {
      const next = { ...prev, [category]: !prev[category] };
      // iframe에 메시지 전송
      if (mapIframeRef.current) {
        try {
          const iframe = mapIframeRef.current;
          const contentWindow = iframe.contentWindow || iframe;
          contentWindow.postMessage(
            JSON.stringify({ type: "togglePoi", category }),
            "*"
          );
        } catch (e) {}
      }
      return next;
    });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (text.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=kr&limit=5&accept-language=ko`,
          { headers: { "User-Agent": "LifeEnvMap/1.0" } }
        );
        const data = await resp.json();
        setSearchResults(data || []);
        setShowSearchResults(data && data.length > 0);
      } catch (e) {
        console.log("Search error:", e);
      }
    }, 400);
  };

  const handleSelectPlace = (result: SearchResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setLocation({ latitude: newLat, longitude: newLng });
    setSearchQuery(result.display_name.split(",")[0]);
    setShowSearchResults(false);
    setSearchResults([]);
  };

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

      {/* ===== 홈 ===== */}
      {activeTab === "home" && (
        <View style={styles.homeContainer}>
          {/* 헤더 — 지도 위 오버레이 */}
          <View style={styles.mapHeader}>
            <View style={styles.logoRow}>
              <Image
                source={require("./assets/mascot.jpg")}
                style={styles.logoMascot}
              />
              <View>
                <Text style={styles.logo}>걸어볼까</Text>
                <Text style={styles.logoSub}>오늘도 한 걸음</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <StepTracker layout="header" />
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
          </View>

          {/* 검색바 + 편의시설 버튼 — 헤더 바로 아래 */}
          <View style={styles.searchRow}>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBarInner}>
                <Text style={styles.searchIcon}>&#128269;</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="장소 검색 (한강, 여의도...)"
                  placeholderTextColor="#C7C7C7"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    style={styles.searchClear}
                  >
                    <Text style={styles.searchClearText}>&#10005;</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showSearchResults && searchResults.length > 0 && (
                <View style={styles.searchResultsBox}>
                  {searchResults.map((r, i) => {
                    const parts = r.display_name.split(",");
                    const name = parts[0].trim();
                    const addr = parts.slice(1, 3).join(",").trim();
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.searchResultItem}
                        onPress={() => handleSelectPlace(r)}
                      >
                        <Text style={styles.searchResultName}>{name}</Text>
                        <Text style={styles.searchResultAddr} numberOfLines={1}>{addr}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            {/* 편의시설 필터 버튼 */}
            <TouchableOpacity
              style={styles.poiFilterBtn}
              onPress={() => setShowPoiFilter(!showPoiFilter)}
              activeOpacity={0.7}
            >
              <Text style={styles.poiFilterBtnText}>&#9881;</Text>
            </TouchableOpacity>
          </View>

          {/* 편의시설 필터 드롭다운 */}
          {showPoiFilter && (
            <View style={styles.poiFilterDropdown}>
              <Text style={styles.poiFilterTitle}>편의시설 필터</Text>
              {[
                { cat: "cafe", emoji: "\u2615", label: "카페" },
                { cat: "toilet", emoji: "\uD83D\uDEBD", label: "화장실" },
                { cat: "convenience", emoji: "\uD83C\uDFEB", label: "편의점" },
                { cat: "bench", emoji: "\uD83E\uDE91", label: "벤치" },
                { cat: "drinking_water", emoji: "\uD83D\uDCA7", label: "음수대" },
                { cat: "parking", emoji: "\uD83C\uDD7F\uFE0F", label: "주차장" },
                { cat: "restaurant", emoji: "\uD83C\uDF74", label: "음식점" },
                { cat: "pharmacy", emoji: "\u2695\uFE0F", label: "약국" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.cat}
                  style={[
                    styles.poiFilterRow,
                    !poiVisible[item.cat] && styles.poiFilterRowOff,
                  ]}
                  onPress={() => togglePoi(item.cat)}
                >
                  <Text style={[
                    styles.poiFilterEmoji,
                    !poiVisible[item.cat] && { opacity: 0.3 },
                  ]}>{item.emoji}</Text>
                  <Text style={[
                    styles.poiFilterLabel,
                    !poiVisible[item.cat] && { color: colors.textLight, textDecorationLine: "line-through" },
                  ]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 지도 풀스크린 */}
          <MapViewComponent location={location} weather={weather} ref={mapIframeRef} />



          {/* 사진 촬영 FAB (좌측 하단) */}
          <TouchableOpacity
            style={styles.cameraFab}
            onPress={() => Alert.alert("사진 공유", "산책 사진을 찍어서 지도에 공유하세요!\n(곧 출시 예정)")}
            activeOpacity={0.8}
          >
            <Text style={styles.cameraFabIcon}>&#128247;</Text>
          </TouchableOpacity>

          {/* 드래그 바텀시트 */}
          <Animated.View
            style={[styles.bottomSheet, { top: sheetY }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.bottomSheetHandle} />

            {/* 쾌적도 카드 (항상 보임) */}
            <WalkScoreCard
              latitude={location.latitude}
              longitude={location.longitude}
            />

            {/* 위로 드래그하면 보이는 영역 */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetScrollArea}
              nestedScrollEnabled
            >
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>친구들의 산책</Text>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>전체보기</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardScroll}
              >
                {COMMUNITY_POSTS.map((post) => (
                  <TouchableOpacity key={post.id} style={styles.communityCard} activeOpacity={0.85}>
                    <Image source={{ uri: post.image }} style={styles.communityCardImage} />
                    <View style={styles.communityOverlay}>
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
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* ===== 산책로 ===== */}
      {activeTab === "trail" && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => handleTabChange("home")} style={styles.headerBackBtn}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>산책로</Text>
            <View style={{ width: 44 }} />
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

      {/* ===== 개화 ===== */}
      {activeTab === "bloom" && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => handleTabChange("home")} style={styles.headerBackBtn}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>개화 현황</Text>
            <View style={{ width: 44 }} />
          </View>
          <BloomList onSelectSpot={(spot) => console.log(spot.name)} />
        </>
      )}

      {/* ===== 곰돌이 꾸미기 (상점) ===== */}
      {activeTab === "bear" && (
        <CharacterShop onBack={() => handleTabChange("home")} />
      )}

      {/* ===== 친구 (준비중) ===== */}
      {activeTab === "friends" && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => handleTabChange("home")} style={styles.headerBackBtn}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>친구</Text>
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.comingSoonContainer}>
            <Image source={require("./assets/icons/friends.jpg")} style={styles.comingSoonIcon} />
            <Text style={styles.comingSoonTitle}>친구</Text>
            <Text style={styles.comingSoonText}>
              친구와 산책을 공유하고 서로의 발자취를 확인하세요
            </Text>
            <View style={styles.comingSoonFeatures}>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>+</Text>
                <Text style={styles.featureText}>친구 검색 및 추가</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>+</Text>
                <Text style={styles.featureText}>친구의 산책 사진 지도에서 보기</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>+</Text>
                <Text style={styles.featureText}>산책 코스 추천해주기</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureDot}>+</Text>
                <Text style={styles.featureText}>함께 걷기 약속</Text>
              </View>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>곧 출시 예정</Text>
            </View>
          </View>
        </>
      )}

      {/* ===== 하단 고정 탭바 ===== */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabChange("home")}
        >
          <View style={[styles.tabIconWrap, activeTab === "home" && styles.tabIconActive]}>
            <Text style={[styles.tabIcon, activeTab === "home" && styles.tabIconTextActive]}>~</Text>
          </View>
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabChange("trail")}
        >
          <Image source={require("./assets/icons/trail.jpg")} style={styles.tabIconImg} />
          <Text style={[styles.tabLabel, activeTab === "trail" && styles.tabLabelActive]}>산책로</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabChange("bloom")}
        >
          <Image source={require("./assets/icons/bloom.jpg")} style={styles.tabIconImg} />
          <Text style={[styles.tabLabel, activeTab === "bloom" && styles.tabLabelActive]}>개화현황</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabChange("bear")}
        >
          <Image source={require("./assets/mascot.jpg")} style={styles.tabIconImg} />
          <Text style={[styles.tabLabel, activeTab === "bear" && styles.tabLabelActive]}>곰돌이</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabChange("friends")}
        >
          <Image source={require("./assets/icons/friends.jpg")} style={styles.tabIconImg} />
          <Text style={[styles.tabLabel, activeTab === "friends" && styles.tabLabelActive]}>친구</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingBottom: 70,  // 탭바 높이만큼
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMascot: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  logo: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weatherChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
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
  // 검색바
  searchRow: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    zIndex: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  searchClear: {
    padding: 4,
    marginLeft: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchResultsBox: {
    marginTop: 6,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  searchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  searchResultAddr: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // 편의시설 필터
  poiFilterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  poiFilterBtnText: {
    fontSize: 18,
  },
  poiFilterDropdown: {
    position: "absolute",
    top: 148,
    right: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 12,
    minWidth: 140,
  },
  poiFilterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  poiFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  poiFilterRowOff: {
    opacity: 0.6,
  },
  poiFilterEmoji: {
    fontSize: 16,
  },
  poiFilterLabel: {
    fontSize: 13,
    color: colors.text,
  },
  // 카메라 FAB
  cameraFab: {
    position: "absolute",
    bottom: 240,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cameraFabIcon: {
    fontSize: 22,
  },
  // 드래그 바텀시트
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 8,
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetScrollArea: {
    flex: 1,
    paddingBottom: 40,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primaryBg,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  // 커뮤니티 카드
  cardScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  communityCard: {
    width: width * 0.36,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityCardImage: {
    width: "100%",
    height: width * 0.28,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  communityOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  airBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  airBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
  communityInfo: {
    padding: 12,
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
    gap: 6,
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
    marginTop: 16,
  },
  actionBtn: {
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBackText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: "600",
  },
  subHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  // 커밍순
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: colors.bg,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  comingSoonFeatures: {
    alignSelf: "stretch",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureDot: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    width: 24,
    textAlign: "center",
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
  },
  comingSoonBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  comingSoonBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  // 하단 고정 탭바
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingBottom: 10,
    paddingTop: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconActive: {
    backgroundColor: colors.primaryBg,
  },
  tabIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  tabIconTextActive: {
    color: colors.primary,
  },
  tabIconImg: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
