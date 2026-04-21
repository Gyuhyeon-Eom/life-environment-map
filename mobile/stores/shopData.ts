/**
 * 캐릭터 상점 아이템 데이터
 */

export type ShopItem = {
  id: string;
  name: string;
  slot: "hat" | "accessory" | "outfit" | "shoes";
  price: number;
  emoji: string; // 임시 아이콘 (나중에 이미지로 교체)
  description: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  // 모자
  { id: "hat_beanie", name: "비니", slot: "hat", price: 50, emoji: "🧢", description: "따뜻한 겨울 비니" },
  { id: "hat_flower", name: "꽃 화관", slot: "hat", price: 80, emoji: "🌸", description: "봄 산책 필수템" },
  { id: "hat_sunhat", name: "밀짚모자", slot: "hat", price: 60, emoji: "👒", description: "여름 자외선 차단" },
  { id: "hat_crown", name: "왕관", slot: "hat", price: 300, emoji: "👑", description: "산책왕의 증거" },
  { id: "hat_leaf", name: "나뭇잎", slot: "hat", price: 30, emoji: "🍃", description: "자연에서 온 선물" },

  // 악세사리
  { id: "acc_scarf", name: "목도리", slot: "accessory", price: 40, emoji: "🧣", description: "포근한 목도리" },
  { id: "acc_glasses", name: "선글라스", slot: "accessory", price: 70, emoji: "🕶️", description: "쿨한 선글라스" },
  { id: "acc_camera", name: "카메라", slot: "accessory", price: 100, emoji: "📷", description: "사진 찍기 좋아하는 곰" },
  { id: "acc_balloon", name: "풍선", slot: "accessory", price: 45, emoji: "🎈", description: "둥둥 떠다니는 풍선" },
  { id: "acc_umbrella", name: "우산", slot: "accessory", price: 55, emoji: "☂️", description: "비 오는 날도 산책" },

  // 옷
  { id: "outfit_raincoat", name: "레인코트", slot: "outfit", price: 90, emoji: "🧥", description: "비가 와도 걱정 없어" },
  { id: "outfit_hanbok", name: "한복", slot: "outfit", price: 200, emoji: "👘", description: "명절 특별 의상" },
  { id: "outfit_jersey", name: "운동복", slot: "outfit", price: 60, emoji: "🏃", description: "활동적인 곰돌이" },
  { id: "outfit_tux", name: "턱시도", slot: "outfit", price: 250, emoji: "🤵", description: "데이트 코스용" },

  // 신발
  { id: "shoes_hiking", name: "등산화", slot: "shoes", price: 80, emoji: "🥾", description: "등산로 전용" },
  { id: "shoes_sneakers", name: "운동화", slot: "shoes", price: 50, emoji: "👟", description: "편한 산책 필수" },
  { id: "shoes_sandal", name: "샌들", slot: "shoes", price: 35, emoji: "🩴", description: "시원한 여름 산책" },
];

export const SLOT_LABELS: Record<string, string> = {
  hat: "모자",
  accessory: "악세사리",
  outfit: "옷",
  shoes: "신발",
};
