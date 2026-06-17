import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'meeting_room_booking_';

export const storage = {
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      const fullKey = STORAGE_PREFIX + key;
      await Taro.setStorage({
        key: fullKey,
        data: JSON.stringify(value)
      });
      console.log('[Storage] 保存成功:', fullKey);
    } catch (error) {
      console.error('[Storage] 保存失败:', key, error);
    }
  },

  get: async <T>(key: string, defaultValue?: T): Promise<T | null> => {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const res = await Taro.getStorage({ key: fullKey });
      if (res.data) {
        const value = JSON.parse(res.data);
        console.log('[Storage] 读取成功:', fullKey);
        return value;
      }
      return defaultValue ?? null;
    } catch (error) {
      console.log('[Storage] 读取失败或无数据:', key);
      return defaultValue ?? null;
    }
  },

  getSync: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const data = Taro.getStorageSync(fullKey);
      if (data) {
        return JSON.parse(data);
      }
      return defaultValue ?? null;
    } catch (error) {
      return defaultValue ?? null;
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      const fullKey = STORAGE_PREFIX + key;
      await Taro.removeStorage({ key: fullKey });
      console.log('[Storage] 删除成功:', fullKey);
    } catch (error) {
      console.error('[Storage] 删除失败:', key, error);
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      const info = await Taro.getStorageInfo();
      const keys = info.keys.filter(k => k.startsWith(STORAGE_PREFIX));
      for (const key of keys) {
        await Taro.removeStorage({ key });
      }
      console.log('[Storage] 清除所有数据成功');
    } catch (error) {
      console.error('[Storage] 清除失败:', error);
    }
  }
};

export const STORAGE_KEYS = {
  BOOKINGS: 'bookings',
  APPROVAL_RECORDS: 'approval_records',
  APPROVAL_RULES: 'approval_rules',
  APPROVAL_FLOWS: 'approval_flows',
  RECURRENCES: 'recurrences',
  ROOMS: 'rooms',
  INITIALIZED: 'initialized'
};
