export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface RecurrenceException {
  date: string;
  action: 'skip' | 'modify';
  modifiedStartTime?: string;
  modifiedEndTime?: string;
  modifiedRoomId?: string;
  reason?: string;
}

export interface RecurrenceRule {
  id: string;
  name: string;
  description?: string;
  roomId: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerDept: string;
  frequency: RecurrenceFrequency;
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  exceptions: RecurrenceException[];
  attendeeCount: number;
  generatedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedBookingPreview {
  date: string;
  startTime: string;
  endTime: string;
  isException: boolean;
  exception?: RecurrenceException;
  conflict?: boolean;
  conflictBookingId?: string;
}

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: '每天',
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月'
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六'
};

export interface RecurrenceFormData {
  name: string;
  description?: string;
  roomId: string;
  title: string;
  frequency: RecurrenceFrequency;
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  attendeeCount: number;
}
