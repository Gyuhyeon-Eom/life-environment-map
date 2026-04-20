import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { colors, radius } from "./theme";

const API_BASE = "http://127.0.0.1:9090";

type WalkScoreData = {
  current: {
    score: number;
    grade: string;
    message: string;
    breakdown: Record<
      string,
      { value: number; score: number }
    >;
  };
  best_time: {
    best_time: string;
    best_score: number;
    best_grade: string;
    hourly_scores: Array<{
      time: string;
      score: number;
      grade: string;
      temperature: number;
    }>;
  } | null;
};

type Props = {
  latitude: number;
  longitude: number;
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "최고": { color: "#2D6A4F", bg: "#D8F3DC", icon: "+++" },
  "좋음": { color: "#4CAF50", bg: "#E8F5E9", icon: "++" },
  "보통": { color: "#FF9800", bg: "#FFF3E0", icon: "+-" },
  "나쁨": { color: "#F44336", bg: "#FFEBEE", icon: "--" },
  "매우나쁨": { color: "#9C27B0", bg: "#F3E5F5", icon: "---" },
};

function formatTime(t: string): string {
  const h = parseInt(t.substring(0, 2), 10);
  if (h === 0) return "오전 12시";
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return "오후 12시";
  return `오후 ${h - 12}시`;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  temperature: "기온",
  humidity: "습도",
  wind_speed: "풍속",
  pm25: "미세먼지",
  uv: "자외선",
};

const BREAKDOWN_UNITS: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  wind_speed: "m/s",
  pm25: "ug/m3",
  uv: "",
};

export default function WalkScoreCard({ latitude, longitude }: Props) {
  const [data, setData] = useState<WalkScoreData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    fetchScore();
  }, [latitude, longitude]);

  const fetchScore = async () => {
    try {
      setLoading(true);
      const resp = await fetch(
        `${API_BASE}/api/v1/walk-score?lat=${latitude}&lng=${longitude}`
      );
      const json = await resp.json();
      if (json.status === "ok") {
        setData(json);
        animateIn(json.current.score, json.current.breakdown);
      }
    } catch (e) {
      console.log("walk-score fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const animateIn = (
    score: number,
    breakdown: Record<string, { value: number; score: number }>
  ) => {
    // 점수 카운트업
    scoreAnim.setValue(0);
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 페이드인
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // 바 애니메이션
    Object.keys(breakdown).forEach((key, i) => {
      if (!barAnims.current[key]) {
        barAnims.current[key] = new Animated.Value(0);
      }
      barAnims.current[key].setValue(0);
      Animated.timing(barAnims.current[key], {
        toValue: breakdown[key].score,
        duration: 800,
        delay: 200 + i * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(expandAnim, {
      toValue: next ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingPulse}>
          <Text style={styles.loadingText}>쾌적도 분석 중...</Text>
        </View>
      </View>
    );
  }

  if (!data) return null;

  const { current, best_time } = data;
  const config = GRADE_CONFIG[current.grade] || GRADE_CONFIG["보통"];

  const scoreDisplay = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
  });

  // 원형 게이지 (SVG 없이 간단한 바 형태)
  const gaugeWidth = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // 시간별 미니 차트 (상위 6개만)
  const hourlySlice = best_time?.hourly_scores
    ?.filter((h) => "0600" <= h.time && h.time <= "2200")
    .slice(0, 8) || [];

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>산책 쾌적도</Text>
            <Text style={[styles.message, { color: config.color }]}>
              {current.message}
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: config.bg }]}>
            <Animated.Text
              style={[styles.scoreText, { color: config.color }]}
            >
              {scoreAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0", "100"],
                extrapolate: "clamp",
              })}
            </Animated.Text>
            <Text style={[styles.scoreUnit, { color: config.color }]}>점</Text>
          </View>
        </View>

        {/* 게이지 바 */}
        <View style={styles.gaugeTrack}>
          <Animated.View
            style={[
              styles.gaugeFill,
              {
                width: gaugeWidth,
                backgroundColor: config.color,
              },
            ]}
          />
        </View>

        {/* 등급 배지 */}
        <View style={styles.gradeRow}>
          <View style={[styles.gradeBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.gradeText, { color: config.color }]}>
              {config.icon} {current.grade}
            </Text>
          </View>
          {best_time?.best_time && (
            <View style={styles.bestTimeChip}>
              <Text style={styles.bestTimeLabel}>오늘 베스트</Text>
              <Text style={styles.bestTimeValue}>
                {formatTime(best_time.best_time)}
              </Text>
              <Text style={styles.bestTimeScore}>
                {best_time.best_score}점
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* 펼침 영역: 요소별 상세 + 시간 차트 */}
      {expanded && (
        <Animated.View style={styles.expandedSection}>
          {/* 요소별 점수 바 */}
          <Text style={styles.sectionTitle}>요소별 점수</Text>
          {Object.entries(current.breakdown).map(([key, info]) => {
            const barAnim = barAnims.current[key];
            const barWidth = barAnim
              ? barAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                })
              : "0%";
            const barColor =
              info.score >= 70
                ? colors.airGood
                : info.score >= 40
                ? colors.airNormal
                : colors.airBad;

            return (
              <View key={key} style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <Text style={styles.breakdownName}>
                    {BREAKDOWN_LABELS[key] || key}
                  </Text>
                  <Text style={styles.breakdownValue}>
                    {info.value}
                    {BREAKDOWN_UNITS[key]}
                  </Text>
                </View>
                <View style={styles.breakdownBarTrack}>
                  <Animated.View
                    style={[
                      styles.breakdownBarFill,
                      { width: barWidth, backgroundColor: barColor },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownScore}>{info.score}</Text>
              </View>
            );
          })}

          {/* 시간별 미니 차트 */}
          {hourlySlice.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                시간별 쾌적도
              </Text>
              <View style={styles.hourlyChart}>
                {hourlySlice.map((h, i) => {
                  const barH = Math.max(8, (h.score / 100) * 60);
                  const isBest =
                    best_time?.best_time === h.time;
                  const barBg = isBest
                    ? colors.primary
                    : h.score >= 60
                    ? colors.primaryLight
                    : colors.border;

                  return (
                    <View key={i} style={styles.hourlyItem}>
                      <Text
                        style={[
                          styles.hourlyScore,
                          isBest && { color: colors.primary, fontWeight: "700" },
                        ]}
                      >
                        {Math.round(h.score)}
                      </Text>
                      <View
                        style={[
                          styles.hourlyBar,
                          { height: barH, backgroundColor: barBg },
                        ]}
                      />
                      <Text style={styles.hourlyTime}>
                        {h.time.substring(0, 2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      )}

      {/* 펼침 힌트 */}
      <View style={styles.expandHint}>
        <Text style={styles.expandHintText}>
          {expanded ? "접기" : "상세보기"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingPulse: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontWeight: "600",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: "800",
  },
  scoreUnit: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 2,
  },
  // 게이지
  gaugeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg,
    overflow: "hidden",
    marginBottom: 12,
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 3,
  },
  // 등급 + 베스트 타임
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bestTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  bestTimeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bestTimeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  bestTimeScore: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // 펼침 영역
  expandedSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  // 요소별 바
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  breakdownLabel: {
    width: 80,
  },
  breakdownName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  breakdownValue: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  breakdownScore: {
    width: 28,
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  // 시간별 차트
  hourlyChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 10,
  },
  hourlyItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  hourlyScore: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  hourlyBar: {
    width: 16,
    borderRadius: 4,
    minHeight: 8,
  },
  hourlyTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // 힌트
  expandHint: {
    alignItems: "center",
    marginTop: 8,
  },
  expandHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
