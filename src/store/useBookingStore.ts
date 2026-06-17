import { create } from 'zustand';
import type { Booking, BookingFormData, BookingStatus } from '@/types';
import { mockBookings } from '@/data/bookings';
import { calculateDuration } from '@/utils/dateUtils';

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
  setSelectedBooking: (booking: Booking | null) => void;
  setFilterStatus: (status: BookingStatus | 'all') => void;
  setFilterDate: (date: string) => void;
  setFilterRoomId: (roomId: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByRoom: (roomId: string, date?: string) => Booking[];
  getBookingsByDate: (date: string) => Booking[];
  getMyBookings: (userId: string) => Booking[];
  createBooking: (data: BookingFormData, userId: string, userName: string, userDept: string) => Booking;
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

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ bookings: mockBookings, loading: false });
      console.log('[BookingStore] 加载预约数据成功，共', mockBookings.length, '条预约');
    } catch (error) {
      console.error('[BookingStore] 加载预约数据失败:', error);
      set({ error: '加载失败', loading: false });
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

  createBooking: (data, userId, userName, userDept) => {
    const duration = calculateDuration(data.startTime, data.endTime);
    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      ...data,
      duration,
      type: 'single',
      organizerId: userId,
      organizerName: userName,
      organizerDept: userDept,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ bookings: [...state.bookings, newBooking] }));
    console.log('[BookingStore] 创建预约:', newBooking.title, 'ID:', newBooking.id);
    return newBooking;
  },

  updateBooking: (id, updates) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      )
    }));
    console.log('[BookingStore] 更新预约:', id);
  },

  cancelBooking: (id) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, status: 'cancelled', updatedAt: new Date().toISOString() } : b
      )
    }));
    console.log('[BookingStore] 取消预约:', id);
  },

  updateBookingStatus: (id, status) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b
      )
    }));
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
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
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
      new Date(`${b.date} ${b.startTime}`).getTime() - new Date(`${a.date} ${a.startTime}`).getTime()
    );
  }
}));
