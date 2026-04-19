// 앱 전체 디자인 테마
export const colors = {
  // 메인 컬러
  primary: "#2D6A4F",       // 자연 녹색 (진한)
  primaryLight: "#95D5B2",  // 연한 녹색
  primaryBg: "#D8F3DC",     // 배경 녹색

  // 서브 컬러
  cherry: "#FF6B8A",        // 벚꽃 핑크
  cherryLight: "#FFE0E6",
  autumn: "#E76F51",        // 단풍 오렌지
  autumnLight: "#FFEEE8",

  // 기본
  white: "#FFFFFF",
  bg: "#FAFAFA",            // 앱 배경
  card: "#FFFFFF",
  border: "#F0F0F0",

  // 텍스트
  text: "#262626",          // 인스타 스타일 진한 검정
  textSecondary: "#8E8E8E",
  textLight: "#C7C7C7",

  // 대기질
  airGood: "#4CAF50",
  airNormal: "#2196F3",
  airBad: "#FF9800",
  airVeryBad: "#F44336",
};

export const fonts = {
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
  tag: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
};
