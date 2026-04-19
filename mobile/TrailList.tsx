import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:9090";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrails();
  }, [latitude, longitude]);

  const fetchTrails = async () => {
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
      console.log("산책로 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderTrail = ({ item }: { item: Trail }) => (
    <TouchableOpacity
      style={styles.trailCard}
      onPress={() => onSelectTrail(item)}
      activeOpacity={0.7}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.trailImage} />
      ) : (
        <View style={[styles.trailImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.trailInfo}>
        <Text style={styles.trailTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.trailAddress} numberOfLines={1}>
          {item.address}
        </Text>
        {item.distance ? (
          <Text style={styles.trailDistance}>
            {formatDistance(item.distance)} 거리
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>주변 산책로 검색 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTrails}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (trails.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>주변에 산책로가 없습니다</Text>
        <Text style={styles.emptySubtext}>검색 범위를 넓혀보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        주변 산책로 ({trails.length}개)
      </Text>
      <FlatList
        data={trails}
        renderItem={renderTrail}
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
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  trailCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  trailImage: {
    width: 100,
    height: 100,
  },
  noImage: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#999",
    fontSize: 12,
  },
  trailInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  trailTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  trailAddress: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  trailDistance: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 15,
    color: "#F44336",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
  },
});
