import { create } from 'zustand';
import type {
  RecurrenceRule,
  RecurrenceFormData,
  RecurrenceException,
  GeneratedBookingPreview
} from '@/types';
import { mockRecurrences } from '@/data/recurrences';
import { generateBookingPreviews } from '@/utils/recurrenceUtils';
import { calculateDuration } from '@/utils/dateUtils';

interface RecurrenceState {
  recurrences: RecurrenceRule[];
  selectedRecurrence: RecurrenceRule | null;
  loading: boolean;
  error: string | null;
  previews: GeneratedBookingPreview[];
}

interface RecurrenceActions {
  fetchRecurrences: () => Promise<void>;
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

  fetchRecurrences: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ recurrences: mockRecurrences, loading: false });
      console.log('[RecurrenceStore] 加载周期规则成功，共', mockRecurrences.length, '条规则');
    } catch (error) {
      console.error('[RecurrenceStore] 加载周期规则失败:', error);
      set({ error: '加载失败', loading: false });
    }
  },

  setSelectedRecurrence: (recurrence) => set({ selectedRecurrence: recurrence }),

  getRecurrenceById: (id) => get().recurrences.find(r => r.id === id),

  createRecurrence: (data, userId, userName, userDept) => {
    const newRecurrence: RecurrenceRule = {
      id: `recurrence_${Date.now()}`,
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
    console.log('[RecurrenceStore] 创建周期规则:', newRecurrence.name, 'ID:', newRecurrence.id);
    return newRecurrence;
  },

  updateRecurrence: (id, updates) => {
    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    console.log('[RecurrenceStore] 更新周期规则:', id);
  },

  deleteRecurrence: (id) => {
    set(state => ({
      recurrences: state.recurrences.filter(r => r.id !== id)
    }));
    console.log('[RecurrenceStore] 删除周期规则:', id);
  },

  toggleRecurrenceActive: (id) => {
    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r
      )
    }));
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
    if (!rule) return 0;

    const previews = generateBookingPreviews(rule);
    const validPreviews = previews.filter(p => !p.conflict);

    set(state => ({
      recurrences: state.recurrences.map(r =>
        r.id === ruleId
          ? { ...r, generatedCount: validPreviews.length, updatedAt: new Date().toISOString() }
          : r
      )
    }));

    console.log('[RecurrenceStore] 批量生成预约:', ruleId, '共', validPreviews.length, '条');
    return validPreviews.length;
  }
}));
