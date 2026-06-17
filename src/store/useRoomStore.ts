import { create } from 'zustand';
import type { Room } from '@/types';
import { mockRooms } from '@/data/rooms';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
  loading: boolean;
  error: string | null;
  selectedLevel: string;
  searchKeyword: string;
}

interface RoomActions {
  fetchRooms: () => Promise<void>;
  saveRooms: () => Promise<void>;
  setSelectedRoom: (room: Room | null) => void;
  setSelectedLevel: (level: string) => void;
  setSearchKeyword: (keyword: string) => void;
  getRoomById: (id: string) => Room | undefined;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
}

export const useRoomStore = create<RoomState & RoomActions>((set, get) => ({
  rooms: [],
  selectedRoom: null,
  loading: false,
  error: null,
  selectedLevel: 'all',
  searchKeyword: '',

  saveRooms: async () => {
    await storage.set(STORAGE_KEYS.ROOMS, get().rooms);
  },

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const saved = await storage.get<Room[]>(STORAGE_KEYS.ROOMS);
      if (saved && saved.length > 0) {
        set({ rooms: saved, loading: false });
        console.log('[RoomStore] 从本地存储加载，共', saved.length, '个会议室');
      } else {
        set({ rooms: mockRooms, loading: false });
        await storage.set(STORAGE_KEYS.ROOMS, mockRooms);
        console.log('[RoomStore] 首次加载使用Mock数据，共', mockRooms.length, '个会议室');
      }
    } catch (error) {
      console.error('[RoomStore] 加载失败:', error);
      set({ rooms: mockRooms, loading: false });
    }
  },

  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setSelectedLevel: (level) => set({ selectedLevel: level }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  getRoomById: (id) => get().rooms.find(r => r.id === id),

  addRoom: (room) => {
    const newRoom: Room = {
      ...room,
      id: `room_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set(state => ({ rooms: [...state.rooms, newRoom] }));
    get().saveRooms();
    console.log('[RoomStore] 新增会议室:', newRoom.name);
  },

  updateRoom: (id, updates) => {
    set(state => ({
      rooms: state.rooms.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    get().saveRooms();
    console.log('[RoomStore] 更新会议室:', id);
  },

  deleteRoom: (id) => {
    set(state => ({
      rooms: state.rooms.filter(r => r.id !== id)
    }));
    get().saveRooms();
    console.log('[RoomStore] 删除会议室:', id);
  }
}));
