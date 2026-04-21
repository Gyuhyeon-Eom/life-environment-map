import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { colors, spacing, radius } from "./theme";

const API_BASE = "http://127.0.0.1:9090";
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2열 그리드

type Trail = {
  id: string;
  title: string;
  address: string;
  image: string | null;
  latitude: number;
  longitude: number;
  distance?: number;
};

type Props = {
  latitude: number;
  longitude: number;
  onSelectTrail: (trail: Trail) => void;
};

export default function TrailList({ latitude, longitude, onSelectTrail }: Props) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyTrails();
  }, [latitude, longitude]);

  const fetchNearbyTrails = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${API_BASE}/api/v1/trails?lat=${latitude}&lng=${longitude}&radius=10000`
      );
      const data = await resp.json();
      if (data.status === "ok") {
        setTrails(data.data);
      } else {
        setError("산책로를 불러올 수 없습니다");
      }
    } catch (e) {
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const searchTrails = async () => {
    if (!searchQuery.trim()) {
      fetchNearbyTrails();
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const resp = await fetch(
        `${API_BASE}/api/v1/trails/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await resp.json();
      if (data.status === "ok") {
        setTrails(data.data);
      }
    } catch (e) {
      setError("검색에 실패했습니다");
    } finally {
      setSearching(false);
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderTrail = ({ item, index }: { item: Trail; index: number }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { marginLeft: index % 2 === 0 ? 0 : 8 },
      ]}
      onPress={() => onSelectTrail(item)}
      activeOpacity={0.85}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={styles.noImageText}>🌿</Text>
        </View>
      )}

      {/* 거리 뱃지 */}
      {item.distance ? (
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {formatDistance(item.distance)}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="산책로, 둘레길, 등산로 검색"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchTrails}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSearchQuery("");
              fetchNearbyTrails();
            }}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading || searching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {searching ? "검색 중..." : "주변 산책로 찾는 중..."}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNearbyTrails}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : trails.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🏞️</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? "검색 결과가 없습니다" : "주변에 산책로가 없습니다"}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>
            {searchQuery ? `"${searchQuery}" 검색 결과` : "내 주변 산책로"} ({trails.length})
          </Text>
          <FlatList
            data={trails}
            renderItem={renderTrail}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
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
  // 검색
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  clearBtn: {
    marginLeft: 8,
    padding: 8,
  },
  clearBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  // 그리드
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH * 0.6,
  },
  noImage: {
    backgroundColor: colors.primaryBg,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 32,
  },
  distanceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
    lineHeight: 17,
  },
  cardAddress: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // 상태
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 15,
    color: colors.airBad,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.xl,
  },
  retryText: {
    color: colors.white,
    fontWeight: "600",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
