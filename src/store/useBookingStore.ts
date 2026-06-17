import { create } from 'zustand';
import type { Booking, BookingFormData, BookingStatus } from '@/types';
import { mockBookings } from '@/data/bookings';
import { calculateDuration, calculateDurationMinutes } from '@/utils/dateUtils';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
  filterStatus: BookingStatus | 'all';
  filterDate: string;
  filterRoomId: string;
}

interface BookingActions {
  fetchBookings: () => Promise<void>;
  saveBookings: () => Promise<void>;
  setSelectedBooking: (booking: Booking | null) => void;
  setFilterStatus: (status: BookingStatus | 'all') => void;
  setFilterDate: (date: string) => void;
  setFilterRoomId: (roomId: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByRoom: (roomId: string, date?: string) => Booking[];
  getBookingsByDate: (date: string) => Booking[];
  getMyBookings: (userId: string) => Booking[];
  createBooking: (data: BookingFormData, userId: string, userName: string, userDept: string, recurrenceId?: string) => Booking;
  addBookingsBatch: (bookings: Booking[]) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  checkConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getFilteredBookings: () => Booking[];
}

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  filterStatus: 'all',
  filterDate: '',
  filterRoomId: 'all',

  saveBookings: async () => {
    await storage.set(STORAGE_KEYS.BOOKINGS, get().bookings);
  },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const saved = await storage.get<Booking[]>(STORAGE_KEYS.BOOKINGS);
      if (saved && saved.length > 0) {
        set({ bookings: saved, loading: false });
        console.log('[BookingStore] 从本地存储加载，共', saved.length, '条预约');
      } else {
        set({ bookings: mockBookings, loading: false });
        await storage.set(STORAGE_KEYS.BOOKINGS, mockBookings);
        console.log('[BookingStore] 首次加载使用Mock数据，共', mockBookings.length, '条预约');
      }
    } catch (error) {
      console.error('[BookingStore] 加载预约数据失败:', error);
      set({ bookings: mockBookings, loading: false });
    }
  },

  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterDate: (date) => set({ filterDate: date }),
  setFilterRoomId: (roomId) => set({ filterRoomId: roomId }),

  getBookingById: (id) => get().bookings.find(b => b.id === id),

  getBookingsByRoom: (roomId, date) => {
    let bookings = get().bookings.filter(b => b.roomId === roomId);
    if (date) {
      bookings = bookings.filter(b => b.date === date);
    }
    return bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  getBookingsByDate: (date) => {
    return get().bookings
      .filter(b => b.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  getMyBookings: (userId) => {
    return get().bookings
      .filter(b => b.organizerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createBooking: (data, userId, userName, userDept, recurrenceId) => {
    const duration = calculateDuration(data.startTime, data.endTime);
    const durationMinutes = calculateDurationMinutes(
      `${data.date}T${data.startTime}`,
      `${data.date}T${data.endTime}`
    );
    const newBooking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      startTime: `${data.date}T${data.startTime}`,
      endTime: `${data.date}T${data.endTime}`,
      duration,
      durationMinutes,
      type: recurrenceId ? 'recurrence' : 'single',
      organizerId: userId,
      organizerName: userName,
      organizerDept: userDept,
      applicant: { id: userId, name: userName, department: userDept },
      status: 'pending',
      recurrenceId: recurrenceId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ bookings: [...state.bookings, newBooking] }));
    get().saveBookings();
    console.log('[BookingStore] 创建预约:', newBooking.title, 'ID:', newBooking.id);
    return newBooking;
  },

  addBookingsBatch: (newBookings) => {
    set(state => ({ bookings: [...state.bookings, ...newBookings] }));
    get().saveBookings();
    console.log('[BookingStore] 批量添加预约:', newBookings.length, '条');
  },

  updateBooking: (id, updates) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      )
    }));
    get().saveBookings();
    console.log('[BookingStore] 更新预约:', id);
  },

  cancelBooking: (id) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, status: 'cancelled', updatedAt: new Date().toISOString() } : b
      )
    }));
    get().saveBookings();
    console.log('[BookingStore] 取消预约:', id);
  },

  updateBookingStatus: (id, status) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b
      )
    }));
    get().saveBookings();
    console.log('[BookingStore] 更新预约状态:', id, '->', status);
  },

  checkConflict: (roomId, date, startTime, endTime, excludeId) => {
    const roomBookings = get().getBookingsByRoom(roomId, date);
    const filteredBookings = excludeId
      ? roomBookings.filter(b => b.id !== excludeId && b.status !== 'cancelled')
      : roomBookings.filter(b => b.status !== 'cancelled');

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    return filteredBookings.some(b => {
      const bTime = b.startTime.includes('T') ? b.startTime.split('T')[1] : b.startTime;
      const bEndTime = b.endTime.includes('T') ? b.endTime.split('T')[1] : b.endTime;
      const bStart = toMinutes(bTime);
      const bEnd = toMinutes(bEndTime);
      return start < bEnd && end > bStart;
    });
  },

  getFilteredBookings: () => {
    let bookings = [...get().bookings];

    if (get().filterStatus !== 'all') {
      bookings = bookings.filter(b => b.status === get().filterStatus);
    }

    if (get().filterDate) {
      bookings = bookings.filter(b => b.date === get().filterDate);
    }

    if (get().filterRoomId !== 'all') {
      bookings = bookings.filter(b => b.roomId === get().filterRoomId);
    }

    return bookings.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
}));
