/**
 * 코인 & 걸음수 스토어
 * AsyncStorage 기반 영구 저장
 */
import { Platform } from "react-native";

// AsyncStorage 대체: 웹에서는 localStorage, 네이티브에서는 AsyncStorage
let AsyncStorage: any;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  // 웹 폴백
  AsyncStorage = {
    getItem: async (key: string) => {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem: async (key: string, value: string) => {
      try { localStorage.setItem(key, value); } catch {}
    },
  };
}

const STORAGE_KEYS = {
  COINS: "@walkbear_coins",
  TOTAL_STEPS: "@walkbear_total_steps",
  TODAY_STEPS: "@walkbear_today_steps",
  LAST_DATE: "@walkbear_last_date",
  EQUIPPED_ITEMS: "@walkbear_equipped",
  OWNED_ITEMS: "@walkbear_owned",
};

export type CoinData = {
  coins: number;
  totalSteps: number;
  todaySteps: number;
};

// 100걸음 = 1코인
const STEPS_PER_COIN = 100;

export async function getCoinData(): Promise<CoinData> {
  try {
    const [coins, totalSteps, todaySteps, lastDate] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.COINS),
      AsyncStorage.getItem(STORAGE_KEYS.TOTAL_STEPS),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_STEPS),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE),
    ]);

    // 날짜 변경 시 오늘 걸음수 리셋
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate !== today) {
      await AsyncStorage.setItem(STORAGE_KEYS.TODAY_STEPS, "0");
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
      return {
        coins: parseInt(coins || "0", 10),
        totalSteps: parseInt(totalSteps || "0", 10),
        todaySteps: 0,
      };
    }

    return {
      coins: parseInt(coins || "0", 10),
      totalSteps: parseInt(totalSteps || "0", 10),
      todaySteps: parseInt(todaySteps || "0", 10),
    };
  } catch {
    return { coins: 0, totalSteps: 0, todaySteps: 0 };
  }
}

export async function addSteps(newSteps: number): Promise<{ coins: number; coinsEarned: number; todaySteps: number; totalSteps: number }> {
  const data = await getCoinData();
  const updatedToday = data.todaySteps + newSteps;
  const updatedTotal = data.totalSteps + newSteps;

  // 코인 계산: 이전 걸음수 기준 코인 vs 업데이트 후 코인
  const prevCoins = Math.floor(data.totalSteps / STEPS_PER_COIN);
  const newCoins = Math.floor(updatedTotal / STEPS_PER_COIN);
  const coinsEarned = newCoins - prevCoins;

  const updatedCoinBalance = data.coins + coinsEarned;

  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.COINS, String(updatedCoinBalance)),
    AsyncStorage.setItem(STORAGE_KEYS.TOTAL_STEPS, String(updatedTotal)),
    AsyncStorage.setItem(STORAGE_KEYS.TODAY_STEPS, String(updatedToday)),
  ]);

  return {
    coins: updatedCoinBalance,
    coinsEarned,
    todaySteps: updatedToday,
    totalSteps: updatedTotal,
  };
}

export async function spendCoins(amount: number): Promise<boolean> {
  const data = await getCoinData();
  if (data.coins < amount) return false;
  await AsyncStorage.setItem(STORAGE_KEYS.COINS, String(data.coins - amount));
  return true;
}

export async function addCoins(amount: number): Promise<number> {
  const data = await getCoinData();
  const newBalance = data.coins + amount;
  await AsyncStorage.setItem(STORAGE_KEYS.COINS, String(newBalance));
  return newBalance;
}

// 장착 아이템 관리
export type EquippedItems = {
  hat?: string;
  accessory?: string;
  outfit?: string;
  shoes?: string;
};

export async function getEquippedItems(): Promise<EquippedItems> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPPED_ITEMS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function equipItem(slot: keyof EquippedItems, itemId: string): Promise<void> {
  const equipped = await getEquippedItems();
  equipped[slot] = itemId;
  await AsyncStorage.setItem(STORAGE_KEYS.EQUIPPED_ITEMS, JSON.stringify(equipped));
}

export async function unequipItem(slot: keyof EquippedItems): Promise<void> {
  const equipped = await getEquippedItems();
  delete equipped[slot];
  await AsyncStorage.setItem(STORAGE_KEYS.EQUIPPED_ITEMS, JSON.stringify(equipped));
}

// 보유 아이템
export async function getOwnedItems(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OWNED_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addOwnedItem(itemId: string): Promise<void> {
  const owned = await getOwnedItems();
  if (!owned.includes(itemId)) {
    owned.push(itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(owned));
  }
}
