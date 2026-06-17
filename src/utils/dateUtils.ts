import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekday from 'dayjs/plugin/weekday';

dayjs.locale('zh-cn');
dayjs.extend(weekday);

export const formatDate = (date: string | Date | dayjs.Dayjs, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | dayjs.Dayjs, format: string = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (time: string, format: string = 'HH:mm'): string => {
  return dayjs(time, 'HH:mm').format(format);
};

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getCurrentTime = (): string => {
  return dayjs().format('HH:mm');
};

export const getWeekDates = (baseDate: string = getToday()): string[] => {
  const start = dayjs(baseDate).weekday(0);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

export const getMonthDates = (year: number, month: number): string[] => {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = start.daysInMonth();
  const dates: string[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

export const getWeekday = (date: string): number => {
  return dayjs(date).weekday() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isPast = (date: string, time?: string): boolean => {
  if (time) {
    return dayjs(`${date} ${time}`).isBefore(dayjs());
  }
  return dayjs(date).isBefore(dayjs(), 'day');
};

export const isFuture = (date: string): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = dayjs(startTime, 'HH:mm');
  const end = dayjs(endTime, 'HH:mm');
  return end.diff(start, 'minute');
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`;
  } else if (hours > 0) {
    return `${hours}小时`;
  }
  return `${mins}分钟`;
};

export const addDays = (date: string, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const addWeeks = (date: string, weeks: number): string => {
  return dayjs(date).add(weeks, 'week').format('YYYY-MM-DD');
};

export const addMonths = (date: string, months: number): string => {
  return dayjs(date).add(months, 'month').format('YYYY-MM-DD');
};

export const isSameDay = (date1: string, date2: string): boolean => {
  return dayjs(date1).isSame(dayjs(date2), 'day');
};

export const isTimeOverlap = (
  start1: string, end1: string,
  start2: string, end2: string
): boolean => {
  const s1 = dayjs(start1, 'HH:mm');
  const e1 = dayjs(end1, 'HH:mm');
  const s2 = dayjs(start2, 'HH:mm');
  const e2 = dayjs(end2, 'HH:mm');
  return s1.isBefore(e2) && s2.isBefore(e1);
};

export const getRelativeTime = (date: string | Date | dayjs.Dayjs): string => {
  const d = dayjs(date);
  const now = dayjs();
  const diffDays = d.diff(now, 'day');

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 1 && diffDays < 7) return `${diffDays}天后`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)}天前`;

  return d.format('MM-DD');
};

export const generateTimeSlots = (
  startHour: number = 8,
  endHour: number = 20,
  interval: number = 30
): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
  }
  return slots;
};

export default dayjs;
