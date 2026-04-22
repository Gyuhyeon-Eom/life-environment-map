/**
 * 캐릭터 상점 + 꾸미기 화면
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { colors, radius } from "./theme";
import {
  getCoinData,
  spendCoins,
  getEquippedItems,
  equipItem,
  unequipItem,
  getOwnedItems,
  addOwnedItem,
  EquippedItems,
} from "./stores/coinStore";
import { SHOP_ITEMS, ShopItem, SLOT_LABELS } from "./stores/shopData";

const { width } = Dimensions.get("window");

type Props = {
  onBack: () => void;
};

type TabType = "shop" | "closet";

export default function CharacterShop({ onBack }: Props) {
  const [coins, setCoins] = useState(0);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [owned, setOwned] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("shop");
  const [selectedSlot, setSelectedSlot] = useState<string>("hat");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const coinData = await getCoinData();
    setCoins(coinData.coins);
    setEquipped(await getEquippedItems());
    setOwned(await getOwnedItems());
  };

  const handleBuy = async (item: ShopItem) => {
    if (owned.includes(item.id)) {
      // 이미 보유 → 장착/해제
      if (equipped[item.slot] === item.id) {
        await unequipItem(item.slot);
      } else {
        await equipItem(item.slot, item.id);
      }
      setEquipped(await getEquippedItems());
      return;
    }

    if (coins < item.price) {
      Alert.alert("코인 부족", `${item.price - coins}코인이 더 필요해요!\n열심히 걸어볼까?`);
      return;
    }

    Alert.alert(
      "구매 확인",
      `${item.emoji} ${item.name}\n${item.price} 코인을 사용할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "구매",
          onPress: async () => {
            const success = await spendCoins(item.price);
            if (success) {
              await addOwnedItem(item.id);
              await equipItem(item.slot, item.id);
              await loadData();
            }
          },
        },
      ]
    );
  };

  const getItemsBySlot = (slot: string) =>
    SHOP_ITEMS.filter((item) => item.slot === slot);

  const slots = ["hat", "accessory", "outfit", "shoes"];

  // 캐릭터 미리보기에서 장착 아이템 표시
  const equippedItems = Object.values(equipped)
    .map((id) => SHOP_ITEMS.find((item) => item.id === id))
    .filter(Boolean) as ShopItem[];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>곰돌이 꾸미기</Text>
        <View style={styles.coinChip}>
          <Text style={styles.coinIcon}>&#11044;</Text>
          <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* 캐릭터 미리보기 */}
      <View style={styles.previewSection}>
        <View style={styles.previewBg}>
          {/* 장착 아이템 (위에서 아래로) */}
          {equipped.hat && (
            <View style={styles.equippedSlotTop}>
              <Text style={styles.equippedEmoji}>
                {SHOP_ITEMS.find((i) => i.id === equipped.hat)?.emoji}
              </Text>
            </View>
          )}
          <Image
            source={require("./assets/mascot.jpg")}
            style={styles.previewMascot}
          />
          {equipped.accessory && (
            <View style={styles.equippedSlotRight}>
              <Text style={styles.equippedEmoji}>
                {SHOP_ITEMS.find((i) => i.id === equipped.accessory)?.emoji}
              </Text>
            </View>
          )}
          {equipped.outfit && (
            <View style={styles.equippedSlotLeft}>
              <Text style={styles.equippedEmojiSmall}>
                {SHOP_ITEMS.find((i) => i.id === equipped.outfit)?.emoji}
              </Text>
            </View>
          )}
          {equipped.shoes && (
            <View style={styles.equippedSlotBottom}>
              <Text style={styles.equippedEmojiSmall}>
                {SHOP_ITEMS.find((i) => i.id === equipped.shoes)?.emoji}
              </Text>
            </View>
          )}
        </View>

        {/* 장착 아이템 태그 */}
        {equippedItems.length > 0 && (
          <View style={styles.equippedTags}>
            {equippedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.equippedTag}
                onPress={() => {
                  unequipItem(item.slot as keyof EquippedItems).then(() =>
                    loadData()
                  );
                }}
              >
                <Text style={styles.equippedTagText}>
                  {item.emoji} {item.name} ✕
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 탭: 상점 / 옷장 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "shop" && styles.tabActive]}
          onPress={() => setActiveTab("shop")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "shop" && styles.tabTextActive,
            ]}
          >
            상점
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "closet" && styles.tabActive]}
          onPress={() => setActiveTab("closet")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "closet" && styles.tabTextActive,
            ]}
          >
            내 옷장 ({owned.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 슬롯 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotFilter}
      >
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotChip,
              selectedSlot === slot && styles.slotChipActive,
            ]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[
                styles.slotChipText,
                selectedSlot === slot && styles.slotChipTextActive,
              ]}
            >
              {SLOT_LABELS[slot]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 아이템 그리드 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemScrollContent}
      >
        <View style={styles.itemGrid}>
          {(activeTab === "shop"
            ? getItemsBySlot(selectedSlot)
            : getItemsBySlot(selectedSlot).filter((i) => owned.includes(i.id))
          ).map((item) => {
            const isOwned = owned.includes(item.id);
            const isEquipped = equipped[item.slot] === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isEquipped && styles.itemCardEquipped,
                ]}
                onPress={() => handleBuy(item)}
                activeOpacity={0.75}
              >
                {/* 이모지 아이콘 */}
                <View
                  style={[
                    styles.itemEmojiWrap,
                    isEquipped && styles.itemEmojiWrapEquipped,
                  ]}
                >
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                </View>

                {/* 정보 */}
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={1}>
                  {item.description}
                </Text>

                {/* 가격/상태 */}
                {isEquipped ? (
                  <View style={styles.equippedBadge}>
                    <Text style={styles.equippedBadgeText}>착용 중</Text>
                  </View>
                ) : isOwned ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>보유 중</Text>
                  </View>
                ) : (
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceIcon}>&#11044;</Text>
                    <Text
                      style={[
                        styles.priceText,
                        coins < item.price && styles.priceTextDisabled,
                      ]}
                    >
                      {item.price}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "closet" &&
          getItemsBySlot(selectedSlot).filter((i) => owned.includes(i.id))
            .length === 0 && (
            <View style={styles.emptyCloset}>
              <Text style={styles.emptyText}>
                아직 {SLOT_LABELS[selectedSlot]}이 없어요
              </Text>
              <TouchableOpacity onPress={() => setActiveTab("shop")}>
                <Text style={styles.emptyLink}>상점 가기 →</Text>
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const CARD_SIZE = (width - 48 - 16) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  coinChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  coinIcon: {
    fontSize: 12,
    color: "#FFD700",
  },
  coinText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B8860B",
  },
  // 미리보기
  previewSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  previewBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  previewMascot: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  equippedSlotTop: {
    position: "absolute",
    top: -5,
    zIndex: 2,
  },
  equippedSlotRight: {
    position: "absolute",
    right: -10,
    top: "40%",
    zIndex: 2,
  },
  equippedSlotLeft: {
    position: "absolute",
    left: -10,
    top: "40%",
    zIndex: 2,
  },
  equippedSlotBottom: {
    position: "absolute",
    bottom: -5,
    zIndex: 2,
  },
  equippedEmoji: {
    fontSize: 28,
  },
  equippedEmojiSmall: {
    fontSize: 22,
  },
  equippedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  equippedTag: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  equippedTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  // 탭
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // 슬롯 필터
  slotFilter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  slotChipTextActive: {
    color: colors.white,
  },
  // 아이템 스크롤 컨테이너
  itemScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 30,
  },
  // 아이템 그리드
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: CARD_SIZE,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemCardEquipped: {
    borderColor: colors.primary,
    backgroundColor: "#F0FFF4",
  },
  itemEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  itemEmojiWrapEquipped: {
    backgroundColor: colors.primaryBg,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
    textAlign: "center",
  },
  itemDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  // 가격/상태 뱃지
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priceIcon: {
    fontSize: 8,
    color: "#FFD700",
  },
  priceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8860B",
  },
  priceTextDisabled: {
    color: "#CCC",
  },
  ownedBadge: {
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  ownedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  equippedBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  equippedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  // 빈 옷장
  emptyCloset: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});
