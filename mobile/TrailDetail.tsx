import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { colors, radius } from "./theme";

const API_BASE = "http://127.0.0.1:9090";
const { width } = Dimensions.get("window");

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
        <Text style={styles.emptyEmoji}>😢</Text>
        <Text style={styles.loadingText}>정보를 찾을 수 없습니다</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail.title}
        </Text>
        <View style={styles.headerBack} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 히어로 이미지 */}
        {detail.image ? (
          <Image source={{ uri: detail.image }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.noImage]}>
            <Text style={styles.noImageEmoji}>🏞️</Text>
          </View>
        )}

        {/* 제목 + 위치 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{detail.title}</Text>
          <Text style={styles.address}>📍 {detail.address}</Text>
        </View>

        {/* 날씨 카드 */}
        {detail.weather && (
          <View style={styles.weatherCard}>
            <Text style={styles.sectionLabel}>지금 이곳 날씨</Text>
            <View style={styles.weatherGrid}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.temperature?.toFixed(0)}°
                </Text>
                <Text style={styles.weatherLabel}>기온</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.humidity}%
                </Text>
                <Text style={styles.weatherLabel}>습도</Text>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {detail.weather.wind_speed}
                </Text>
                <Text style={styles.weatherLabel}>풍속(m/s)</Text>
              </View>
            </View>
          </View>
        )}

        {/* 소개 */}
        {detail.overview && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>소개</Text>
            <Text style={styles.overview}>{detail.overview}</Text>
          </View>
        )}

        {/* 코스 */}
        {detail.courses && detail.courses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              코스 ({detail.courses.length}구간)
            </Text>
            {detail.courses.map((course, idx) => (
              <View key={idx} style={styles.courseItem}>
                <View style={styles.courseTimeline}>
                  <View style={styles.courseDot} />
                  {idx < (detail.courses?.length ?? 0) - 1 && (
                    <View style={styles.courseLine} />
                  )}
                </View>
                <View style={styles.courseContent}>
                  <Text style={styles.courseName}>
                    {course.name || `구간 ${idx + 1}`}
                  </Text>
                  {course.overview && (
                    <Text style={styles.courseDesc} numberOfLines={3}>
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
            <Text style={styles.sectionLabel}>연락처</Text>
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
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.xl,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: "600",
  },
  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerBack: {
    width: 40,
  },
  headerBackText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  // 히어로
  heroImage: {
    width: width,
    height: width * 0.65,
    backgroundColor: "#f0f0f0",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryBg,
  },
  noImageEmoji: {
    fontSize: 64,
  },
  // 제목
  titleSection: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // 날씨
  weatherCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.lg,
  },
  weatherGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  weatherItem: {
    alignItems: "center",
    flex: 1,
  },
  weatherValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  weatherLabel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  weatherDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.primaryLight,
  },
  // 섹션
  section: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  overview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // 코스 (타임라인)
  courseItem: {
    flexDirection: "row",
    minHeight: 60,
  },
  courseTimeline: {
    width: 24,
    alignItems: "center",
  },
  courseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  courseLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primaryLight,
    marginVertical: 4,
  },
  courseContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  courseName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  courseDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tel: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
});
