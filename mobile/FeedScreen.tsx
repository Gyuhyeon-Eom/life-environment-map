import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { colors, spacing, radius } from "./theme";

const { width } = Dimensions.get("window");

// 더미 피드 데이터 (나중에 백엔드 연동)
const DUMMY_FEEDS = [
  {
    id: "1",
    user: "산책러버",
    userAvatar: null,
    image: "https://picsum.photos/seed/trail1/600/600",
    location: "북한산 둘레길",
    locationTag: "서울 강북구",
    caption: "오늘 공기 좋아서 한 바퀴",
    tags: ["북한산", "둘레길", "산책"],
    likes: 24,
    comments: 3,
    timeAgo: "2시간 전",
    airQuality: "좋음",
  },
  {
    id: "2",
    user: "벚꽃구경",
    userAvatar: null,
    image: "https://picsum.photos/seed/cherry1/600/600",
    location: "여의도 윤중로",
    locationTag: "서울 영등포구",
    caption: "아직 조금 이른 느낌",
    tags: ["여의도", "벚꽃", "봄"],
    likes: 58,
    comments: 12,
    timeAgo: "5시간 전",
    airQuality: "보통",
  },
  {
    id: "3",
    user: "주말등산",
    userAvatar: null,
    image: "https://picsum.photos/seed/mountain1/600/600",
    location: "관악산 등산로",
    locationTag: "서울 관악구",
    caption: "",
    tags: ["관악산", "등산", "주말"],
    likes: 15,
    comments: 1,
    timeAgo: "어제",
    airQuality: "좋음",
  },
  {
    id: "4",
    user: "산책일기",
    userAvatar: null,
    image: "https://picsum.photos/seed/park1/600/600",
    location: "서울숲",
    locationTag: "서울 성동구",
    caption: "강아지랑 산책 중",
    tags: ["서울숲", "강아지", "산책"],
    likes: 42,
    comments: 7,
    timeAgo: "어제",
    airQuality: "보통",
  },
  {
    id: "5",
    user: "자연사랑",
    userAvatar: null,
    image: "https://picsum.photos/seed/river1/600/600",
    location: "양재천",
    locationTag: "서울 서초구",
    caption: "물소리 들으면서 걷기",
    tags: ["양재천", "산책로", "힐링"],
    likes: 31,
    comments: 4,
    timeAgo: "2일 전",
    airQuality: "좋음",
  },
];

const getAirColor = (grade: string) => {
  switch (grade) {
    case "좋음": return colors.airGood;
    case "보통": return colors.airNormal;
    case "나쁨": return colors.airBad;
    default: return colors.textSecondary;
  }
};

type FeedItem = (typeof DUMMY_FEEDS)[0];

export default function FeedScreen() {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFeed = ({ item }: { item: FeedItem }) => (
    <View style={styles.feedCard}>
      {/* 유저 헤더 */}
      <View style={styles.feedHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.locationTag}>{item.location}</Text>
        </View>
        <Text style={styles.timeAgo}>{item.timeAgo}</Text>
      </View>

      {/* 사진 */}
      <Image source={{ uri: item.image }} style={styles.feedImage} />

      {/* 액션 바 */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Text style={[styles.actionIcon, liked.has(item.id) && styles.liked]}>
            {liked.has(item.id) ? "♥" : "♡"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.actionIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.actionIcon}>📍</Text>
        </TouchableOpacity>

        {/* 대기질 태그 */}
        <View style={[styles.airTag, { borderColor: getAirColor(item.airQuality) }]}>
          <View style={[styles.airDot, { backgroundColor: getAirColor(item.airQuality) }]} />
          <Text style={[styles.airText, { color: getAirColor(item.airQuality) }]}>
            공기 {item.airQuality}
          </Text>
        </View>
      </View>

      {/* 좋아요 수 */}
      <Text style={styles.likeCount}>
        좋아요 {item.likes + (liked.has(item.id) ? 1 : 0)}개
      </Text>

      {/* 캡션 + 태그 */}
      {item.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{item.user} </Text>
          {item.caption}
        </Text>
      ) : null}

      <View style={styles.tagsRow}>
        {item.tags.map((tag) => (
          <Text key={tag} style={styles.hashTag}>
            #{tag}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={DUMMY_FEEDS}
      renderItem={renderFeed}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
  },
  feedCard: {
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  // 헤더
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  locationTag: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textLight,
  },
  // 이미지
  feedImage: {
    width: width,
    height: width,
    backgroundColor: "#f0f0f0",
  },
  // 액션
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
  },
  actionIcon: {
    fontSize: 22,
  },
  liked: {
    color: "#ED4956",
  },
  airTag: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  airDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  airText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // 좋아요
  likeCount: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  // 캡션
  caption: {
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 14,
    lineHeight: 20,
  },
  captionUser: {
    fontWeight: "700",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6,
  },
  hashTag: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
});
