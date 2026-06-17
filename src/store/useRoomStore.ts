import { create } from 'zustand';
import type { Room } from '@/types';
import { mockRooms } from '@/data/rooms';

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

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ rooms: mockRooms, loading: false });
      console.log('[RoomStore] 加载会议室数据成功，共', mockRooms.length, '个会议室');
    } catch (error) {
      console.error('[RoomStore] 加载会议室数据失败:', error);
      set({ error: '加载失败', loading: false });
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
    console.log('[RoomStore] 新增会议室:', newRoom.name);
  },

  updateRoom: (id, updates) => {
    set(state => ({
      rooms: state.rooms.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    console.log('[RoomStore] 更新会议室:', id);
  },

  deleteRoom: (id) => {
    set(state => ({
      rooms: state.rooms.filter(r => r.id !== id)
    }));
    console.log('[RoomStore] 删除会议室:', id);
  }
}));
