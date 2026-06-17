import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { ROOM_LEVEL_LABELS } from '@/types';
import styles from './index.module.scss';

const RoomDetailPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.id as string;
  const { getRoomById, fetchRooms } = useRoomStore();
  const { bookings, fetchBookings } = useBookingStore();

  useDidShow(() => {
    Promise.all([fetchRooms(), fetchBookings()]);
  });

  const room = getRoomById(roomId);
  const todayBookings = useMemo(() => {
    const today = new Date().toDateString();
    return bookings
      .filter(b => b.roomId === roomId && new Date(b.startTime).toDateString() === today)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, roomId]);

  if (!room) {
    return (
      <View className={styles.container}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🏢</Text>
          <Text className={styles.emptyTitle}>会议室不存在</Text>
          <Text className={styles.emptyText}>请返回重试</Text>
        </View>
      </View>
    );
  }

  const handleBook = () => {
    Taro.navigateTo({
      url: `/pages/booking-form/index?roomId=${roomId}`
    });
  };

  const equipmentIcons: Record<string, string> = {
    '投影仪': '📽️',
    '白板': '📝',
    '视频会议': '🎥',
    '空调': '❄️',
    '音响': '🔊',
    'WiFi': '📶',
    '茶水服务': '🍵',
    '可移动桌椅': '🪑'
  };

  return (
    <View className={styles.container}>
      <ScrollView scrollY showsVerticalScrollIndicator={false}>
        <View className={styles.banner}>
          <Text className={styles.bannerImage}>🏢</Text>
        </View>

        <View className={styles.content}>
          <View className={styles.header}>
            <View className={styles.titleRow}>
              <Text className={styles.title}>{room.name}</Text>
              <View className={`${styles.levelTag} ${styles['levelTag_' + room.level]}`}>
                <Text className={styles.levelTagText}>{ROOM_LEVEL_LABELS[room.level]}</Text>
              </View>
            </View>
            <Text className={styles.location}>📍 {room.location}</Text>
          </View>

          <View className={styles.infoGrid}>
            <View className={styles.infoCard}>
              <Text className={styles.infoValue}>👥 {room.capacity}</Text>
              <Text className={styles.infoLabel}>容纳人数</Text>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.infoValue}>
                {room.approvalRequired ? '�' : '🔓'} {room.approvalRequired ? '需审批' : '免审批'}
              </Text>
              <Text className={styles.infoLabel}>审批要求</Text>
            </View>
            <View className={styles.infoCard}>
              <Text className={styles.infoValue}>⭐ Lv.{room.approvalLevel}</Text>
              <Text className={styles.infoLabel}>审批级别</Text>
            </View>
          </View>

          {room.description && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>会议室简介</Text>
              <Text className={styles.description}>{room.description}</Text>
            </View>
          )}

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>配备设施</Text>
            <View className={styles.equipmentGrid}>
              {room.equipments.length > 0 ? (
                room.equipments.map(eq => (
                  <View key={eq.id} className={styles.equipmentItem}>
                    <Text className={styles.equipmentIcon}>{equipmentIcons[eq.name] || '📦'}</Text>
                    <Text className={styles.equipmentName}>{eq.name}</Text>
                  </View>
                ))
              ) : (
                <Text className={styles.emptyText}>暂无设施信息</Text>
              )}
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>今日排期</Text>
            {todayBookings.length > 0 ? (
              todayBookings.map(booking => (
                <View key={booking.id} className={styles.bookingItem}>
                  <View className={styles.bookingTime}>
                    <Text className={styles.bookingTimeText}>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </Text>
                  </View>
                  <View className={styles.bookingInfo}>
                    <Text className={styles.bookingTitle}>{booking.title}</Text>
                    <Text className={styles.bookingOrganizer}>
                      {booking.applicant?.name || booking.organizerName || '未知'} · {booking.attendeeCount}人
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className={styles.emptyText}>今日暂无预约</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <View className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookBtnText}>立即预约</Text>
        </View>
      </View>
    </View>
  );
};

export default RoomDetailPage;
