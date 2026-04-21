/**
 * 걸음수 트래커 + 코인 HUD
 * 지도 위에 오버레이로 표시
 */
import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { colors, radius } from "./theme";
import { getCoinData, addSteps } from "./stores/coinStore";

// Expo Pedometer (네이티브 전용)
let Pedometer: any = null;
try {
  Pedometer = require("expo-sensors").Pedometer;
} catch {}

type Props = {
  visible?: boolean;
  layout?: "floating" | "header";
};

export default function StepTracker({ visible = true, layout = "floating" }: Props) {
  const [coins, setCoins] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [coinPop, setCoinPop] = useState(false);
  const popAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    startPedometer();
  }, []);

  const loadData = async () => {
    const data = await getCoinData();
    setCoins(data.coins);
    setTodaySteps(data.todaySteps);
  };

  const startPedometer = () => {
    if (Platform.OS === "web" || !Pedometer) {
      // 웹에서는 10초마다 더미 걸음수 (데모용)
      const interval = setInterval(async () => {
        const fakeSteps = Math.floor(Math.random() * 30) + 10;
        const result = await addSteps(fakeSteps);
        setCoins(result.coins);
        setTodaySteps(result.todaySteps);
        if (result.coinsEarned > 0) {
          showCoinPop();
        }
      }, 10000);
      return () => clearInterval(interval);
    }

    // 네이티브 만보기
    const subscription = Pedometer.watchStepCount((result: { steps: number }) => {
      handleNewSteps(result.steps);
    });

    return () => subscription?.remove?.();
  };

  const handleNewSteps = async (steps: number) => {
    const result = await addSteps(steps);
    setCoins(result.coins);
    setTodaySteps(result.todaySteps);
    if (result.coinsEarned > 0) {
      showCoinPop();
    }
  };

  const showCoinPop = () => {
    setCoinPop(true);
    popAnim.setValue(0);
    Animated.sequence([
      Animated.timing(popAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(popAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setCoinPop(false));
  };

  if (!visible) return null;

  const stepsToNextCoin = 100 - (todaySteps % 100);
  const progressPercent = ((todaySteps % 100) / 100) * 100;

  // 헤더 인라인 모드
  if (layout === "header") {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerChip}>
          <Text style={styles.headerCoinIcon}>&#11044;</Text>
          <Text style={styles.headerCoinText}>{coins.toLocaleString()}</Text>
        </View>
        <View style={styles.headerChip}>
          <Text style={styles.headerStepIcon}>&#128099;</Text>
          <Text style={styles.headerStepText}>{todaySteps.toLocaleString()}</Text>
        </View>
      </View>
    );
  }

  // 플로팅 모드 (기존)
  return (
    <View style={styles.container}>
      <View style={styles.coinBadge}>
        <Text style={styles.coinIcon}>&#11044;</Text>
        <Text style={styles.coinCount}>{coins.toLocaleString()}</Text>
      </View>
      <View style={styles.stepBadge}>
        <Text style={styles.stepIcon}>&#128099;</Text>
        <View style={styles.stepInfo}>
          <Text style={styles.stepCount}>{todaySteps.toLocaleString()}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.stepHint}>다음 코인까지 {stepsToNextCoin}걸음</Text>
        </View>
      </View>
      {coinPop && (
        <Animated.View
          style={[
            styles.coinPopup,
            {
              opacity: popAnim,
              transform: [
                {
                  translateY: popAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, -5],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.coinPopupText}>+1 Coin!</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 헤더 인라인 모드
  headerContainer: {
    flexDirection: "row",
    gap: 6,
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  headerCoinIcon: {
    fontSize: 10,
    color: "#FFD700",
  },
  headerCoinText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B8860B",
  },
  headerStepIcon: {
    fontSize: 12,
  },
  headerStepText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#262626",
  },
  // 플로팅 모드
  container: {
    position: "absolute",
    bottom: 90,
    right: 12,
    zIndex: 12,
    alignItems: "flex-end",
    gap: 6,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 5,
  },
  coinIcon: {
    fontSize: 14,
    color: "#FFD700",
  },
  coinCount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B8860B",
  },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepInfo: {
    alignItems: "flex-start",
  },
  stepCount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  progressTrack: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  stepHint: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
  },
  coinPopup: {
    position: "absolute",
    top: -30,
    right: 0,
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  coinPopupText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5C4300",
  },
});
