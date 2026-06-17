import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { getWeekday, isToday, isSameDay } from '@/utils/dateUtils';
import type { Booking } from '@/types';
import styles from './index.module.scss';

interface CalendarProps {
  bookings?: Booking[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  mode?: 'month' | 'week';
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const Calendar: React.FC<CalendarProps> = ({
  bookings = [],
  selectedDate,
  onSelectDate,
  mode = 'week'
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate));

  const weekDates = useMemo(() => {
    const startOfWeek = dayjs(selectedDate).day(0);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.add(i, 'day').format('YYYY-MM-DD'));
    }
    return dates;
  }, [selectedDate]);

  const monthDates = useMemo(() => {
    const year = currentMonth.year();
    const month = currentMonth.month();
    const firstDay = dayjs(`${year}-${month + 1}-01`);
    const startWeekday = firstDay.day();
    const daysInMonth = firstDay.daysInMonth();

    const dates: (string | null)[] = [];

    for (let i = 0; i < startWeekday; i++) {
      dates.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(dayjs(`${year}-${month + 1}-${i}`).format('YYYY-MM-DD'));
    }

    return dates;
  }, [currentMonth]);

  const getBookingsForDate = (date: string) => {
    return bookings.filter(b => b.date === date);
  };

  const hasBooking = (date: string) => {
    return bookings.some(b => b.date === date);
  };

  const hasPendingBooking = (date: string) => {
    return bookings.some(b => b.date === date && b.status === 'pending');
  };

  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const prevWeek = () => {
    const newDate = dayjs(selectedDate).subtract(1, 'week').format('YYYY-MM-DD');
    onSelectDate(newDate);
  };

  const nextWeek = () => {
    const newDate = dayjs(selectedDate).add(1, 'week').format('YYYY-MM-DD');
    onSelectDate(newDate);
  };

  const renderWeekView = () => (
    <View className={styles.weekView}>
      <View className={styles.weekHeader}>
        <View className={styles.navBtn} onClick={prevWeek}>
          <Text className={styles.navText}>‹</Text>
        </View>
        <Text className={styles.monthTitle}>
          {dayjs(selectedDate).format('YYYY年MM月')}
        </Text>
        <View className={styles.navBtn} onClick={nextWeek}>
          <Text className={styles.navText}>›</Text>
        </View>
      </View>

      <View className={styles.weekdayLabels}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={label}
            className={classNames(styles.weekdayLabel, {
              [styles.weekendLabel]: index === 0 || index === 6
            })}
          >
            {label}
          </Text>
        ))}
      </View>

      <View className={styles.datesRow}>
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const weekday = getWeekday(date);
          const dayBookings = getBookingsForDate(date);
          const hasPending = hasPendingBooking(date);

          return (
            <View
              key={date}
              className={classNames(styles.dateCell, {
                [styles.selected]: isSelected,
                [styles.today]: isTodayDate,
                [styles.weekend]: weekday === 0 || weekday === 6
              })}
              onClick={() => onSelectDate(date)}
            >
              <Text
                className={classNames(styles.dateNumber, {
                  [styles.selectedText]: isSelected,
                  [styles.todayText]: isTodayDate
                })}
              >
                {dayjs(date).format('D')}
              </Text>
              {hasBooking(date) && (
                <View className={styles.bookingDots}>
                  {dayBookings.slice(0, 3).map((booking, i) => (
                    <View
                      key={i}
                      className={classNames(styles.dot, {
                        [styles.dotPending]: booking.status === 'pending',
                        [styles.dotApproved]: booking.status === 'approved',
                        [styles.dotRejected]: booking.status === 'rejected'
                      })}
                    />
                  ))}
                </View>
              )}
              {isTodayDate && !isSelected && (
                <View className={styles.todayIndicator} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderMonthView = () => (
    <View className={styles.monthView}>
      <View className={styles.monthHeader}>
        <View className={styles.navBtn} onClick={prevMonth}>
          <Text className={styles.navText}>‹</Text>
        </View>
        <Text className={styles.monthTitle}>
          {currentMonth.format('YYYY年MM月')}
        </Text>
        <View className={styles.navBtn} onClick={nextMonth}>
          <Text className={styles.navText}>›</Text>
        </View>
      </View>

      <View className={styles.weekdayLabels}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={label}
            className={classNames(styles.weekdayLabel, {
              [styles.weekendLabel]: index === 0 || index === 6
            })}
          >
            {label}
          </Text>
        ))}
      </View>

      <View className={styles.monthGrid}>
        {monthDates.map((date, index) => {
          if (!date) {
            return <View key={index} className={styles.emptyCell} />;
          }

          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const weekday = getWeekday(date);
          const dayBookings = getBookingsForDate(date);

          return (
            <View
              key={date}
              className={classNames(styles.monthCell, {
                [styles.selected]: isSelected,
                [styles.today]: isTodayDate,
                [styles.weekend]: weekday === 0 || weekday === 6
              })}
              onClick={() => onSelectDate(date)}
            >
              <Text
                className={classNames(styles.dateNumber, {
                  [styles.selectedText]: isSelected,
                  [styles.todayText]: isTodayDate
                })}
              >
                {dayjs(date).format('D')}
              </Text>
              {hasBooking(date) && (
                <View className={styles.monthDot} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View className={styles.calendarContainer}>
      {mode === 'week' ? renderWeekView() : renderMonthView()}
    </View>
  );
};

export default Calendar;
