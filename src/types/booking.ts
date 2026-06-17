import type { Room } from './room';
import type { RecurrenceException } from './recurrence';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type BookingType = 'single' | 'recurrence';

export interface Applicant {
  id: string;
  name: string;
  department: string;
}

export interface Booking {
  id: string;
  roomId: string;
  room?: Room;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  durationMinutes?: number;
  type: BookingType;
  recurrenceId?: string;
  recurrenceIndex?: number;
  recurrenceException?: RecurrenceException;
  isException?: boolean;
  originalDate?: string;
  organizerId: string;
  organizerName: string;
  organizerDept: string;
  applicant?: Applicant;
  attendeeCount: number;
  attendees?: string[];
  status: BookingStatus;
  approvalFlowId?: string;
  currentApprovalStep?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData {
  roomId: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  attendees?: string[];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
  completed: '已完成'
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#ff7d00',
  approved: '#00b42a',
  rejected: '#f53f3f',
  cancelled: '#86909c',
  completed: '#165dff'
};

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  single: '单次预约',
  recurrence: '周期预约'
};
