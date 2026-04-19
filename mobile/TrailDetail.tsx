import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:9090";

type TrailDetailData = {
  id: string;
  title: string;
  address: string;
  overview: string;
  image: string | null;
  tel: string | null;
  latitude: number;
  longitude: number;
  weather?: {
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    rain_type?: number;
  };
  courses?: Array<{
    number: string;
    name: string;
    overview: string;
    image: string | null;
  }>;
};

type Props = {
  contentId: string;
  onBack: () => void;
};

export default function TrailDetail({ contentId, onBack }: Props) {
  const [detail, setDetail] = useState<TrailDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [contentId]);

  const fetchDetail = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/trails/${contentId}`);
      const data = await resp.json();
      if (data.status === "ok") {
        setDetail(data.data);
      }
    } catch (e) {
      console.log("상세 정보 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const getRainTypeText = (type?: number) => {
    switch (type) {
      case 1: return "비";
      case 2: return "비/눈";
      case 3: return "눈";
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>정보를 찾을 수 없습니다</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail.title}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 이미지 */}
        {detail.image && (
          <Image source={{ uri: detail.image }} style={styles.heroImage} />
        )}

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.title}>{detail.title}</Text>
          <Text style={styles.address}>{detail.address}</Text>
        </View>

        {/* 현재 날씨 */}
        {detail.weather && (
          <View style={styles.weatherCard}>
            <Text style={styles.sectionTitle}>현재 날씨</Text>
            <View style={styles.weatherRow}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.temperature?.toFixed(1)}°C
                </Text>
                <Text style={styles.weatherLabel}>기온</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.humidity}%
                </Text>
                <Text style={styles.weatherLabel}>습도</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.wind_speed}m/s
                </Text>
                <Text style={styles.weatherLabel}>풍속</Text>
              </View>
            </View>
            {getRainTypeText(detail.weather.rain_type) && (
              <Text style={styles.rainInfo}>
                현재 {getRainTypeText(detail.weather.rain_type)} 내리는 중
              </Text>
            )}
          </View>
        )}

        {/* 소개 */}
        {detail.overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소개</Text>
            <Text style={styles.overview}>{detail.overview}</Text>
          </View>
        )}

        {/* 코스 정보 */}
        {detail.courses && detail.courses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              코스 ({detail.courses.length}구간)
            </Text>
            {detail.courses.map((course, idx) => (
              <View key={idx} style={styles.courseCard}>
                <View style={styles.courseNumber}>
                  <Text style={styles.courseNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>
                    {course.name || `구간 ${idx + 1}`}
                  </Text>
                  {course.overview && (
                    <Text style={styles.courseOverview} numberOfLines={3}>
                      {course.overview}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 연락처 */}
        {detail.tel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>연락처</Text>
            <Text style={styles.tel}>{detail.tel}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  backLink: {
    marginTop: 12,
    color: "#4CAF50",
    fontSize: 15,
  },
  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 220,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    color: "#888",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  overview: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  // 날씨 카드
  weatherCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f0f9f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weatherItem: {
    alignItems: "center",
  },
  weatherValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  weatherLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  rainInfo: {
    textAlign: "center",
    marginTop: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  // 코스
  courseCard: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  courseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  courseNumberText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  courseOverview: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  tel: {
    fontSize: 15,
    color: "#4CAF50",
  },
});
