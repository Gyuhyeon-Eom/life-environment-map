import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { colors, radius } from "./theme";

const API_BASE = "http://127.0.0.1:9090";
const { width } = Dimensions.get("window");

type BloomSpot = {
  id: string;
  name: string;
  type: string;
  type_label: string;
  region: string;
  progress_pct: number;
  status: string;
  estimated_bloom_date?: string;
  estimated_peak_date?: string;
};

type Props = {
  onSelectSpot: (spot: BloomSpot) => void;
};

export default function BloomList({ onSelectSpot }: Props) {
  const [spots, setSpots] = useState<BloomSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "cherry" | "autumn">("all");

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/bloom/spots`);
      const data = await resp.json();
      if (data.status === "ok") {
        setSpots(data.data);
      }
    } catch (e) {
      console.log("벚꽃/단풍 데이터 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? spots : spots.filter((s) => s.type === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "만개":
      case "절정":
        return colors.cherry;
      case "개화":
      case "단풍 진행 중":
        return "#FF5722";
      case "개화 임박":
      case "부분 변색":
        return "#FF9800";
      case "꽃봉오리":
      case "첫 단풍":
        return "#FFC107";
      default:
        return colors.textLight;
    }
  };

  const getTypeColor = (type: string) => {
    return type === "cherry" ? colors.cherry : colors.autumn;
  };

  const getTypeBg = (type: string) => {
    return type === "cherry" ? colors.cherryLight : colors.autumnLight;
  };

  const getProgressEmoji = (type: string, progress: number) => {
    if (type === "cherry") {
      if (progress >= 90) return "🌸";
      if (progress >= 50) return "🌷";
      return "🌱";
    } else {
      if (progress >= 90) return "🍁";
      if (progress >= 50) return "🍂";
      return "🌿";
    }
  };

  const renderSpot = ({ item }: { item: BloomSpot }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectSpot(item)}
      activeOpacity={0.85}
    >
      {/* 상단: 이모지 + 진행률 */}
      <View style={[styles.cardTop, { backgroundColor: getTypeBg(item.type) }]}>
        <Text style={styles.emoji}>
          {getProgressEmoji(item.type, item.progress_pct)}
        </Text>
        <Text style={[styles.progressBig, { color: getTypeColor(item.type) }]}>
          {item.progress_pct}%
        </Text>
      </View>

      {/* 하단: 정보 */}
      <View style={styles.cardBottom}>
        <View style={styles.nameRow}>
          <Text style={styles.spotName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.typePill, { backgroundColor: getTypeBg(item.type) }]}>
            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
              {item.type_label}
            </Text>
          </View>
        </View>

        <Text style={styles.regionText}>📍 {item.region}</Text>

        {/* 진행률 바 */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress_pct}%`,
                backgroundColor: getTypeColor(item.type),
              },
            ]}
          />
        </View>

        {/* 상태 */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.statusText}>{item.status}</Text>
          {item.estimated_bloom_date && (
            <Text style={styles.dateText}>{item.estimated_bloom_date}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.cherry} />
        <Text style={styles.loadingText}>개화 예측 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 필터 */}
      <View style={styles.filterRow}>
        {(["all", "cherry", "autumn"] as const).map((f) => {
          const isActive = filter === f;
          const label = f === "all" ? "전체" : f === "cherry" ? "🌸 벚꽃" : "🍁 단풍";
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                isActive && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderSpot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // 필터
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.white,
  },
  // 리스트
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  progressBig: {
    fontSize: 28,
    fontWeight: "800",
  },
  cardBottom: {
    padding: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  spotName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  regionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: "auto",
  },
});
