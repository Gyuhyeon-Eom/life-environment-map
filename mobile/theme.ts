// 앱 전체 디자인 테마
export const colors = {
  // 메인 컬러 (파스텔 자연톤)
  primary: "#6BAB90",       // 밝은 세이지 그린
  primaryLight: "#B8DFC9",  // 연한 민트
  primaryBg: "#EDF6F0",     // 거의 흰 녹색

  // 서브 컬러 (파스텔)
  cherry: "#F4A4B8",        // 부드러운 핑크
  cherryLight: "#FDF0F3",
  autumn: "#E8A889",        // 부드러운 코랄
  autumnLight: "#FDF3EE",

  // 기본
  white: "#FFFFFF",
  bg: "#F8F9F7",            // 살짝 따뜻한 회색
  card: "#FFFFFF",
  border: "#EBEBEB",

  // 텍스트
  text: "#3D3D3D",          // 부드러운 차콜
  textSecondary: "#9E9E9E",
  textLight: "#CCCCCC",

  // 대기질 (파스텔)
  airGood: "#7BC8A4",
  airNormal: "#7BB8D9",
  airBad: "#F0C078",
  airVeryBad: "#E88B8B",
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
