import { create } from 'zustand';
import type {
  RecurrenceRule,
  RecurrenceFormData,
  RecurrenceException,
  GeneratedBookingPreview,
  Booking
} from '@/types';
import { mockRecurrences } from '@/data/recurrences';
import { generateBookingPreviews, generateRecurrenceDates, applyException } from '@/utils/recurrenceUtils';
import { calculateDuration, calculateDurationMinutes } from '@/utils/dateUtils';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface RecurrenceState {
  recurrences: RecurrenceRule[];
  selectedRecurrence: RecurrenceRule | null;
  loading: boolean;
  error: string | null;
  previews: GeneratedBookingPreview[];
}

interface RecurrenceActions {
  fetchRecurrences: () => Promise<void>;
  saveRecurrences: () => Promise<void>;
  setSelectedRecurrence: (recurrence: RecurrenceRule | null) => void;
  getRecurrenceById: (id: string) => RecurrenceRule | undefined;
  createRecurrence: (data: RecurrenceFormData, userId: string, userName: string, userDept: string) => RecurrenceRule;
  updateRecurrence: (id: string, updates: Partial<RecurrenceRule>) => void;
  deleteRecurrence: (id: string) => void;
  toggleRecurrenceActive: (id: string) => void;
  addException: (id: string, exception: RecurrenceException) => void;
  removeException: (id: string, date: string) => void;
  generatePreviews: (rule: RecurrenceRule, existingBookings?: Array<{ date: string; startTime: string; endTime: string; id: string }>) => void;
  clearPreviews: () => void;
  generateBookings: (ruleId: string) => number;
}

export const useRecurrenceStore = create<RecurrenceState & RecurrenceActions>((set, get) => ({
  recurrences: [],
  selectedRecurrence: null,
  loading: false,
  error: null,
  previews: [],

  saveRecurrences: async () => {
    await storage.set(STORAGE_KEYS.RECURRENCES, get().recurrences);
  },

  fetchRecurrences: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const saved = await storage.get<RecurrenceRule[]>(STORAGE_KEYS.RECURRENCES);
      if (saved && saved.length > 0) {
        set({ recurrences: saved, loading: false });
        console.log('[RecurrenceStore] 从本地存储加载，共', saved.length, '条规则');
      } else {
        set({ recurrences: mockRecurrences, loading: false });
        await storage.set(STORAGE_KEYS.RECURRENCES, mockRecurrences);
        console.log('[RecurrenceStore] 首次加载使用Mock数据，共', mockRecurrences.length, '条规则');
      }
    } catch (error) {
      console.error('[RecurrenceStore] 加载失败:', error);
      set({ recurrences: mockRecurrences, loading: false });
    }
  },

  setSelectedRecurrence: (recurrence) => set({ selectedRecurrence: recurrence }),
  getRecurrenceById: (id) => get().recurrences.find(r => r.id === id),

  createRecurrence: (data, userId, userName, userDept) => {
    const newRecurrence: RecurrenceRule = {
      id: `recurrence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      organizerId: userId,
      organizerName: userName,
      organizerDept: userDept,
      exceptions: [],
      generatedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ recurrences: [...state.recurrences, newRecurrence] }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 创建周期规则:', newRecurrence.name, 'ID:', newRecurrence.id);
    return newRecurrence;
  },

  updateRecurrence: (id, updates) => {
    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 更新周期规则:', id);
  },

  deleteRecurrence: (id) => {
    set(state => ({
      recurrences: state.recurrences.filter(r => r.id !== id)
    }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 删除周期规则:', id);
  },

  toggleRecurrenceActive: (id) => {
    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r
      )
    }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 切换规则状态:', id);
  },

  addException: (id, exception) => {
    set(state => ({
      recurrences: state.recurrences.map(r => {
        if (r.id !== id) return r;
        const existingIndex = r.exceptions.findIndex(e => e.date === exception.date);
        const newExceptions = [...r.exceptions];
        if (existingIndex >= 0) {
          newExceptions[existingIndex] = exception;
        } else {
          newExceptions.push(exception);
        }
        return { ...r, exceptions: newExceptions, updatedAt: new Date().toISOString() };
      })
    }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 添加例外:', id, exception.date, exception.action);
  },

  removeException: (id, date) => {
    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === id
          ? { ...r, exceptions: r.exceptions.filter(e => e.date !== date), updatedAt: new Date().toISOString() }
          : r
      )
    }));
    get().saveRecurrences();
    console.log('[RecurrenceStore] 移除例外:', id, date);
  },

  generatePreviews: (rule, existingBookings = []) => {
    const previews = generateBookingPreviews(rule, existingBookings);
    set({ previews });
    console.log('[RecurrenceStore] 生成预览:', previews.length, '条记录');
  },

  clearPreviews: () => set({ previews: [] }),

  generateBookings: (ruleId) => {
    const rule = get().getRecurrenceById(ruleId);
    if (!rule) {
      console.error('[RecurrenceStore] 未找到规则:', ruleId);
      return 0;
    }

    const dates = generateRecurrenceDates(rule);
    console.log('[RecurrenceStore] 生成周期日期:', dates.length, '个');

    const { useBookingStore } = require('@/store/useBookingStore');
    const { useRoomStore } = require('@/store/useRoomStore');
    const { useApprovalStore } = require('@/store/useApprovalStore');
    const bookingStore = useBookingStore.getState();
    const roomStore = useRoomStore.getState();
    const approvalStore = useApprovalStore.getState();

    const room = roomStore.getRoomById(rule.roomId);
    if (!room) {
      console.error('[RecurrenceStore] 未找到会议室:', rule.roomId);
      return 0;
    }

    const newBookings: Booking[] = [];

    for (const dateStr of dates) {
      const exception = rule.exceptions.find(e => e.date === dateStr);

      if (exception?.action === 'skip') {
        console.log('[RecurrenceStore] 跳过日期:', dateStr);
        continue;
      }

      let startTime = rule.startTime;
      let endTime = rule.endTime;

      if (exception?.action === 'modify' && exception.modifiedStartTime && exception.modifiedEndTime) {
        startTime = exception.modifiedStartTime;
        endTime = exception.modifiedEndTime;
        console.log('[RecurrenceStore] 调整时间:', dateStr, startTime, '-', endTime);
      }

      const hasConflict = bookingStore.checkConflict(rule.roomId, dateStr, startTime, endTime);
      if (hasConflict) {
        console.log('[RecurrenceStore] 时间冲突，跳过:', dateStr, startTime, '-', endTime);
        continue;
      }

      const duration = calculateDuration(startTime, endTime);
      const durationMinutes = calculateDurationMinutes(
        `${dateStr}T${startTime}`,
        `${dateStr}T${endTime}`
      );

      const booking: Booking = {
        id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: rule.roomId,
        title: rule.name,
        description: rule.description,
        date: dateStr,
        startTime: `${dateStr}T${startTime}`,
        endTime: `${dateStr}T${endTime}`,
        duration,
        durationMinutes,
        attendeeCount: rule.attendeeCount,
        type: 'recurrence',
        recurrenceId: rule.id,
        recurrenceException: exception || undefined,
        organizerId: rule.organizerId,
        organizerName: rule.organizerName,
        organizerDept: rule.organizerDept,
        applicant: {
          id: rule.organizerId,
          name: rule.organizerName,
          department: rule.organizerDept
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newBookings.push(booking);
    }

    if (newBookings.length > 0) {
      bookingStore.addBookingsBatch(newBookings);

      newBookings.forEach(booking => {
        approvalStore.createApprovalRecord(booking, room);
      });

      set(state => ({
        recurrences: state.recurrences.map(r =>
          r.id === ruleId
            ? { ...r, generatedCount: r.generatedCount + newBookings.length, updatedAt: new Date().toISOString() }
            : r
        )
      }));
      get().saveRecurrences();
    }

    console.log('[RecurrenceStore] 批量生成完成:', newBookings.length, '条有效预约，跳过', dates.length - newBookings.length, '条');
    return newBookings.length;
  }
}));
