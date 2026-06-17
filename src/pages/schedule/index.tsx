import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, ScrollView, RefreshControl } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import Calendar from '@/components/Calendar';
import RoomCard from '@/components/RoomCard';
import StatusBadge from '@/components/StatusBadge';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { getToday, getRelativeTime, isToday, formatTime } from '@/utils/dateUtils';
import type { Room, Booking } from '@/types';
import { ROOM_LEVEL_LABELS } from '@/types';
import styles from './index.module.scss';

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { rooms, loading: roomsLoading, fetchRooms, selectedLevel, setSelectedLevel } = useRoomStore();
  const { bookings, loading: bookingsLoading, fetchBookings, getBookingsByDate, getBookingsByRoom } = useBookingStore();

  useDidShow(() => {
    loadData();
  });

  usePullDownRefresh(() => {
    loadData();
    Taro.stopPullDownRefresh();
  });

  const loadData = async () => {
    await Promise.all([fetchRooms(), fetchBookings()]);
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (selectedLevel !== 'all' && room.level !== selectedLevel) return false;
      if (searchKeyword && !room.name.includes(searchKeyword) && !room.location.includes(searchKeyword)) return false;
      return room.isActive;
    });
  }, [rooms, selectedLevel, searchKeyword]);

  const todaysBookings = useMemo(() => {
    return getBookingsByDate(selectedDate).filter(b => b.status !== 'cancelled');
  }, [selectedDate, bookings]);

  const getBookingBlockStyle = (booking: Booking) => {
    const startMinutes = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]);
    const endMinutes = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1]);
    const dayStart = 8 * 60;
    const dayEnd = 20 * 60;
    const totalMinutes = dayEnd - dayStart;

    const left = ((startMinutes - dayStart) / totalMinutes) * 100;
    const width = ((endMinutes - startMinutes) / totalMinutes) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100, width)}%`
    };
  };

  const handleQuickBook = () => {
    Taro.navigateTo({
      url: '/pages/booking-form/index'
    });
  };

  const handleBookingClick = (booking: Booking) => {
    const room = rooms.find(r => r.id === booking.roomId);
    if (room) {
      Taro.showModal({
        title: booking.title,
        content: `会议室: ${room.name}\n时间: ${booking.startTime}-${booking.endTime}\n组织者: ${booking.organizerName}\n状态: ${booking.status}`,
        showCancel: false
      });
    }
  };

  const renderTimeline = () => {
    const activeRooms = filteredRooms.slice(0, 5);

    return (
      <View className={styles.timelineSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {isToday(selectedDate) ? '今日' : getRelativeTime(selectedDate)}排期
          </Text>
          <View className={styles.quickBookBtn} onClick={handleQuickBook}>
            <Text className={styles.quickBookBtnText}>+ 快速预约</Text>
          </View>
        </View>

        <View className={styles.timeline}>
          <View className={styles.timelineHeader}>
            <Text className={styles.timeLabel}>会议室</Text>
            <View style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0 8rpx' }}>
              {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                <Text key={time} className={styles.timeLabel}>{time}</Text>
              ))}
            </View>
          </View>

          {activeRooms.map(room => {
            const roomBookings = getBookingsByRoom(room.id, selectedDate)
              .filter(b => b.status !== 'cancelled');

            return (
              <View key={room.id} className={styles.timelineRow}>
                <View className={styles.roomColumn}>
                  <Text className={styles.roomLabel}>{room.name}</Text>
                </View>
                <View className={styles.timeColumn}>
                  <View className={styles.timeGrid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <View key={i} className={styles.gridLine} />
                    ))}
                  </View>
                  {roomBookings.map(booking => (
                    <View
                      key={booking.id}
                      className={classNames(styles.bookingBlock, {
                        [styles.bookingBlockPending]: booking.status === 'pending',
                        [styles.bookingBlockApproved]: booking.status === 'approved'
                      })}
                      style={getBookingBlockStyle(booking)}
                      onClick={() => handleBookingClick(booking)}
                    >
                      <Text className={styles.bookingBlockTitle}>{booking.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {activeRooms.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📅</Text>
              <Text className={styles.emptyText}>暂无会议室数据</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const loading = roomsLoading || bookingsLoading;

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>会议室排期</Text>
        <Text className={styles.subtitle}>
          {getRelativeTime(selectedDate)} · 共 {todaysBookings.length} 场会议
        </Text>
      </View>

      <Calendar
        bookings={bookings}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        mode={calendarMode}
      />

      <View className={styles.filterSection}>
        <ScrollView
          className={styles.filterRow}
          scrollX
          showsHorizontalScrollIndicator={false}
        >
          <View
            className={classNames(styles.filterChip, {
              [styles.filterChipActive]: selectedLevel === 'all'
            })}
            onClick={() => setSelectedLevel('all')}
          >
            <Text className={styles.filterChipText}>全部</Text>
          </View>
          {Object.entries(ROOM_LEVEL_LABELS).map(([key, label]) => (
            <View
              key={key}
              className={classNames(styles.filterChip, {
                [styles.filterChipActive]: selectedLevel === key
              })}
              onClick={() => setSelectedLevel(key)}
            >
              <Text className={styles.filterChipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索会议室名称、位置'
            value={searchKeyword}
            onInput={e => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      {renderTimeline()}

      <View className={styles.roomListSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>可用会议室 ({filteredRooms.length})</Text>
        </View>

        {loading ? (
          <View className={styles.loading}>
            <Text>⏳</Text>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🏢</Text>
            <Text className={styles.emptyText}>暂无符合条件的会议室</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default SchedulePage;
