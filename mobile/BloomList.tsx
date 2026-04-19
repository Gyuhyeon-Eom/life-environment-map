import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:9090";

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
        return "#E91E63";
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
        return "#9E9E9E";
    }
  };

  const getProgressBarColor = (type: string) => {
    return type === "cherry" ? "#FFB6C1" : "#FF8C00";
  };

  const renderSpot = ({ item }: { item: BloomSpot }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectSpot(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{item.type_label}</Text>
        </View>
        <Text style={styles.region}>{item.region}</Text>
      </View>

      <Text style={styles.spotName}>{item.name}</Text>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress_pct}%`,
                backgroundColor: getProgressBarColor(item.type),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{item.progress_pct}%</Text>
      </View>

      {/* 상태 */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <Text style={styles.statusText}>{item.status}</Text>
        {item.estimated_bloom_date && (
          <Text style={styles.dateText}>
            예상 개화일: {item.estimated_bloom_date}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>예측 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 필터 탭 */}
      <View style={styles.filterRow}>
        {(["all", "cherry", "autumn"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "전체" : f === "cherry" ? "벚꽃" : "단풍"}
            </Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: "#FFF8F0",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  // 필터
  filterRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterBtnActive: {
    backgroundColor: "#E91E63",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  // 카드
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTagText: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "600",
  },
  region: {
    fontSize: 13,
    color: "#888",
  },
  spotName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  // 진행률
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    width: 45,
    textAlign: "right",
  },
  // 상태
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginLeft: "auto",
  },
});
