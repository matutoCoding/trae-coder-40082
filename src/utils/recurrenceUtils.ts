import dayjs from 'dayjs';
import type { RecurrenceRule, RecurrenceException, GeneratedBookingPreview } from '@/types';
import { getWeekday, isTimeOverlap } from './dateUtils';

export const generateRecurrenceDates = (rule: RecurrenceRule): string[] => {
  const dates: string[] = [];
  const startDate = dayjs(rule.startDate);
  const endDate = dayjs(rule.endDate);

  if (rule.frequency === 'daily' || rule.frequency === 'weekly') {
    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const weekday = currentDate.weekday();
      if (rule.weekdays.includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
        dates.push(currentDate.format('YYYY-MM-DD'));
      }
      currentDate = currentDate.add(1, 'day');
    }
  } else if (rule.frequency === 'biweekly') {
    let currentDate = startDate;
    let weekOffset = 0;
    const startWeekday = startDate.weekday();
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      for (const weekday of rule.weekdays) {
        let targetDate = currentDate.startOf('week').add(weekday, 'day');
        if (weekOffset % 2 === 0) {
          if (targetDate.isBefore(startDate)) {
            targetDate = targetDate.add(2, 'week');
          }
          if (targetDate.isBefore(endDate) || targetDate.isSame(endDate, 'day')) {
            dates.push(targetDate.format('YYYY-MM-DD'));
          }
        }
      }
      currentDate = currentDate.add(1, 'week');
      weekOffset++;
    }
  } else if (rule.frequency === 'monthly') {
    let currentMonth = startDate.startOf('month');
    
    while (currentMonth.isBefore(endDate) || currentMonth.isSame(endDate, 'month')) {
      for (const weekday of rule.weekdays) {
        let weekCount = 1;
        let targetDate = currentMonth.startOf('week').add(weekday, 'day');
        
        if (targetDate.isBefore(currentMonth)) {
          targetDate = targetDate.add(1, 'week');
        }
        
        while (targetDate.month() === currentMonth.month()) {
          if ((targetDate.isAfter(startDate) || targetDate.isSame(startDate, 'day')) &&
              (targetDate.isBefore(endDate) || targetDate.isSame(endDate, 'day'))) {
            dates.push(targetDate.format('YYYY-MM-DD'));
          }
          targetDate = targetDate.add(1, 'week');
          weekCount++;
        }
      }
      currentMonth = currentMonth.add(1, 'month');
    }
  }

  const uniqueDates = [...new Set(dates)].sort();
  console.log('[generateRecurrenceDates] 规则:', rule.name, '频率:', rule.frequency, '生成日期:', uniqueDates.length, '个');
  return uniqueDates;
};

export const generateBookingPreviews = (
  rule: RecurrenceRule,
  existingBookings: Array<{ date: string; startTime: string; endTime: string; id: string }> = []
): GeneratedBookingPreview[] => {
  const dates = generateRecurrenceDates(rule);
  const previews: GeneratedBookingPreview[] = [];

  dates.forEach((date, index) => {
    let startTime = rule.startTime;
    let endTime = rule.endTime;
    let isException = false;
    let exception: RecurrenceException | undefined;

    const exceptionRule = rule.exceptions.find(e => e.date === date);
    if (exceptionRule) {
      isException = true;
      exception = exceptionRule;
      if (exceptionRule.action === 'skip') {
        return;
      }
      if (exceptionRule.action === 'modify') {
        if (exceptionRule.modifiedStartTime) startTime = exceptionRule.modifiedStartTime;
        if (exceptionRule.modifiedEndTime) endTime = exceptionRule.modifiedEndTime;
      }
    }

    const conflict = existingBookings.some(
      b => b.date === date && isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    const conflictBooking = existingBookings.find(
      b => b.date === date && isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    previews.push({
      date,
      startTime,
      endTime,
      isException,
      exception,
      conflict,
      conflictBookingId: conflictBooking?.id
    });
  });

  return previews;
};

export const getNextOccurrence = (rule: RecurrenceRule): string | null => {
  const today = dayjs().format('YYYY-MM-DD');
  const dates = generateRecurrenceDates(rule);
  const nextDate = dates.find(d => d >= today);
  return nextDate || null;
};

export const getOccurrencesInRange = (
  rule: RecurrenceRule,
  startDate: string,
  endDate: string
): string[] => {
  const dates = generateRecurrenceDates(rule);
  return dates.filter(d => d >= startDate && d <= endDate);
};

export const addException = (
  rule: RecurrenceRule,
  exception: RecurrenceException
): RecurrenceRule => {
  const existingIndex = rule.exceptions.findIndex(e => e.date === exception.date);
  const newExceptions = [...rule.exceptions];

  if (existingIndex >= 0) {
    newExceptions[existingIndex] = exception;
  } else {
    newExceptions.push(exception);
  }

  return {
    ...rule,
    exceptions: newExceptions,
    updatedAt: new Date().toISOString()
  };
};

export const removeException = (
  rule: RecurrenceRule,
  date: string
): RecurrenceRule => {
  return {
    ...rule,
    exceptions: rule.exceptions.filter(e => e.date !== date),
    updatedAt: new Date().toISOString()
  };
};

export const getExceptionSummary = (exceptions: RecurrenceException[]): string => {
  if (exceptions.length === 0) return '无例外';

  const skipCount = exceptions.filter(e => e.action === 'skip').length;
  const modifyCount = exceptions.filter(e => e.action === 'modify').length;

  const parts: string[] = [];
  if (skipCount > 0) parts.push(`${skipCount}次跳过`);
  if (modifyCount > 0) parts.push(`${modifyCount}次调整`);

  return parts.join('、');
};

export const generateRecurrenceDescription = (rule: RecurrenceRule): string => {
  const frequencyMap: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    biweekly: '每两周',
    monthly: '每月'
  };

  const weekdayLabels: Record<number, string> = {
    0: '周日',
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六'
  };

  const frequency = frequencyMap[rule.frequency];
  const weekdays = rule.weekdays.map(w => weekdayLabels[w]).join('、');
  const time = `${rule.startTime}-${rule.endTime}`;

  return `${frequency} ${weekdays} ${time}`;
};
