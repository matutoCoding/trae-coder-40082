import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useBookingStore } from '@/store/useBookingStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { formatDateTime, calculateDurationMinutes, formatDuration } from '@/utils/dateUtils';
import StatusBadge from '@/components/StatusBadge';
import type { Booking, BookingStatus } from '@/types';
import { BOOKING_STATUS_LABELS } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | 'approved' | 'pending' | 'rejected' | 'cancelled';

const OccupancyPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const { bookings, loading, fetchBookings, cancelBooking, getBookingById } = useBookingStore();
  const { rooms, fetchRooms, getRoomById } = useRoomStore();
  const { records, fetchApprovals } = useApprovalStore();

  useDidShow(() => {
    loadData();
  });

  usePullDownRefresh(() => {
    loadData();
    Taro.stopPullDownRefresh();
  });

  const loadData = async () => {
    await Promise.all([fetchBookings(), fetchRooms(), fetchApprovals()]);
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    if (activeFilter !== 'all') {
      result = result.filter(b => b.status === activeFilter);
    }
    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      result = result.filter(b => {
        const titleMatch = b.title?.toLowerCase().includes(text) || false;
        const applicantMatch = b.applicant?.name?.toLowerCase().includes(text) ||
                             b.organizerName?.toLowerCase().includes(text) || false;
        const roomMatch = getRoomById(b.roomId)?.name?.toLowerCase().includes(text) || false;
        return titleMatch || applicantMatch || roomMatch;
      });
    }
    return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [bookings, activeFilter, searchText, getRoomById]);

  const stats = useMemo(() => ({
    total: bookings.length,
    approved: bookings.filter(b => b.status === 'approved').length,
    pending: bookings.filter(b => b.status === 'pending').length
  }), [bookings]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'approved', label: '已通过' },
    { key: 'pending', label: '待审批' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'cancelled', label: '已取消' }
  ];

  const handleCancel = (booking: Booking) => {
    if (booking.status === 'cancelled') {
      Taro.showToast({ title: '该预约已取消', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '取消预约',
      content: `确定要取消"${booking.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          cancelBooking(booking.id);
          Taro.showToast({ title: '已取消', icon: 'success' });
        }
      }
    });
  };

  const handleEdit = (booking: Booking) => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' });
  };

  const handleViewDetail = (booking: Booking) => {
    const room = getRoomById(booking.roomId);
    const approval = records.find(a => a.bookingId === booking.id);
    const duration = formatDuration(calculateDurationMinutes(booking.startTime, booking.endTime));
    const applicantName = booking.applicant?.name || booking.organizerName || '未知';
    const applicantDept = booking.applicant?.department || booking.organizerDept || '未知';

    const content = [
      `主题：${booking.title}`,
      `会议室：${room?.name || '未知'}`,
      `时间：${formatDateTime(booking.startTime)} ~ ${formatDateTime(booking.endTime)}`,
      `时长：${duration}`,
      `参会人数：${booking.attendeeCount || 0}人`,
      `申请人：${applicantName} (${applicantDept})`,
      `状态：${BOOKING_STATUS_LABELS[booking.status]}`,
      approval ? `审批状态：${approval.status === 'pending' ? '审批中' : approval.status === 'approved' ? '已通过' : '已拒绝'}` : '',
      '',
      booking.description ? `描述：${booking.description}` : '',
      booking.recurrenceId ? `来源：周期会议` : ''
    ].filter(Boolean).join('\n');

    Taro.showModal({
      title: '预约详情',
      content,
      showCancel: false
    });
  };

  const getCardClass = (status: BookingStatus) => {
    const classMap: Record<BookingStatus, string> = {
      approved: styles.bookingCardApproved,
      pending: styles.bookingCardPending,
      rejected: styles.bookingCardRejected,
      cancelled: styles.bookingCardCancelled
    };
    return classMap[status] || '';
  };

  if (loading) {
    return (
      <View className={styles.container}>
        <View className={styles.loading}>
          <Text>⏳</Text>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.titleSection}>
          <Text className={styles.title}>占用管理</Text>
          <Text className={styles.subtitle}>查看和管理所有会议室预约</Text>
        </View>
      </View>

      <View className={styles.statRow}>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValueTotal)}>{stats.total}</Text>
          <Text className={styles.statLabel}>总预约</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValueApproved)}>{stats.approved}</Text>
          <Text className={styles.statLabel}>已通过</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValuePending)}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待审批</Text>
        </View>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索主题、申请人、会议室"
          value={searchText}
          onInput={e => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView className={styles.filterRow} scrollX showsHorizontalScrollIndicator={false}>
        {filters.map(f => (
          <View
            key={f.key}
            className={classNames(styles.filterChip, {
              [styles.filterChipActive]: activeFilter === f.key
            })}
            onClick={() => setActiveFilter(f.key)}
          >
            <Text className={styles.filterChipText}>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY showsVerticalScrollIndicator={false}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => {
            const room = getRoomById(booking.roomId);
            const duration = formatDuration(calculateDurationMinutes(booking.startTime, booking.endTime));

            return (
              <View
                key={booking.id}
                className={classNames(styles.bookingCard, getCardClass(booking.status))}
                onClick={() => handleViewDetail(booking)}
              >
                <View className={styles.cardHeader}>
                  <Text className={styles.cardTitle} numberOfLines={1}>
                    {booking.title}
                    {booking.recurrenceId && (
                      <View className={styles.recurrenceTag}>
                        <Text className={styles.recurrenceTagText}>周期</Text>
                      </View>
                    )}
                  </Text>
                  <StatusBadge status={booking.status} type="booking" size="small" />
                </View>

                <View className={styles.cardMeta}>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>🏢</Text>
                    <Text numberOfLines={1}>{room?.name || '未知会议室'}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>👥</Text>
                    <Text>{booking.attendeeCount}人</Text>
                  </View>
                </View>

                <View className={styles.timeSection}>
                  <Text className={styles.timeIcon}>🕐</Text>
                  <View className={styles.timeContent}>
                    <Text className={styles.timeRange}>
                      {formatDateTime(booking.startTime)} ~ {formatDateTime(booking.endTime)}
                    </Text>
                    <Text className={styles.timeDuration}>时长：{duration}</Text>
                  </View>
                </View>

                <View className={styles.applicantInfo}>
                  <View className={styles.avatar}>
                    <Text className={styles.avatarText}>
                      {(booking.applicant?.name || booking.organizerName || 'U').charAt(0)}
                    </Text>
                  </View>
                  <Text className={styles.applicantName}>
                    {booking.applicant?.name || booking.organizerName || '未知'} · {booking.applicant?.department || booking.organizerDept || '未知'}
                  </Text>
                </View>

                <View className={styles.cardFooter}>
                  <Text className={styles.createTime}>创建于 {formatDateTime(booking.createdAt)}</Text>
                  <View className={styles.actionButtons} onClick={e => e.stopPropagation()}>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnSecondary)}
                      onClick={() => handleEdit(booking)}
                    >
                      <Text className={styles.actionBtnText}>编辑</Text>
                    </View>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnDanger)}
                      onClick={() => handleCancel(booking)}
                    >
                      <Text className={styles.actionBtnText}>取消</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyTitle}>暂无预约记录</Text>
            <Text className={styles.emptyText}>
              {searchText ? '没有找到匹配的预约记录' : '会议室预约记录会显示在这里'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OccupancyPage;
