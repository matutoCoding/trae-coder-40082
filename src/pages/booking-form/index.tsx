import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { formatDate, getToday } from '@/utils/dateUtils';
import { ROOM_LEVEL_LABELS } from '@/types';
import styles from './index.module.scss';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const BookingFormPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.roomId as string;
  const { getRoomById, fetchRooms } = useRoomStore();
  const { createBooking, checkConflict } = useBookingStore();
  const { createApprovalRecord, fetchApprovals } = useApprovalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendeeCount, setAttendeeCount] = useState(5);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDidShow(() => {
    Promise.all([fetchRooms(), fetchApprovals()]);
  });

  const room = getRoomById(roomId);

  const hasConflict = useMemo(() => {
    if (!roomId || !date || !startTime || !endTime) return false;
    return checkConflict(roomId, date, startTime, endTime);
  }, [roomId, date, startTime, endTime, checkConflict]);

  const isFormValid = useMemo(() => {
    return title.trim().length > 0 &&
      roomId &&
      date &&
      startTime &&
      endTime &&
      startTime < endTime &&
      attendeeCount > 0 &&
      !hasConflict &&
      !submitting;
  }, [title, roomId, date, startTime, endTime, attendeeCount, hasConflict, submitting]);

  const startIndex = timeSlots.indexOf(startTime);
  const endTimeSlots = startIndex >= 0 ? timeSlots.slice(startIndex + 1) : timeSlots;

  const handleDateChange = (e: any) => {
    setDate(e.detail.value);
    setError('');
  };

  const handleStartTimeChange = (e: any) => {
    const newStartTime = timeSlots[e.detail.value];
    setStartTime(newStartTime);
    if (newStartTime >= endTime) {
      const nextIndex = Math.min(timeSlots.indexOf(newStartTime) + 1, timeSlots.length - 1);
      setEndTime(timeSlots[nextIndex]);
    }
    setError('');
  };

  const handleEndTimeChange = (e: any) => {
    setEndTime(endTimeSlots[e.detail.value]);
    setError('');
  };

  const handleAttendeeChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(100, attendeeCount + delta));
    setAttendeeCount(newCount);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setSubmitting(true);
    setError('');

    try {
      const bookingData = {
        roomId,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime,
        endTime,
        attendeeCount
      };

      const booking = createBooking(
        bookingData,
        'user_001',
        '张明',
        '产品部'
      );

      if (room) {
        createApprovalRecord(booking, room);
      }

      Taro.showToast({
        title: '预约提交成功',
        icon: 'success'
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (err: any) {
      console.error('[BookingForm] 提交失败:', err);
      setError(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) {
    return (
      <View className={styles.container}>
        <View className={styles.errorMsg}>会议室不存在，请返回重试</View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      {error && (
        <View className={styles.errorMsg}>{error}</View>
      )}

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>选择会议室</Text>
        <View className={styles.roomInfo}>
          <Text className={styles.roomIcon}>🏢</Text>
          <View className={styles.roomDetail}>
            <Text className={styles.roomName}>{room.name}</Text>
            <Text className={styles.roomMeta}>
              {ROOM_LEVEL_LABELS[room.level]} · {room.location} · 容纳{room.capacity}人
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>会议主题</Text>
          <Input
            className={styles.formInput}
            placeholder='请输入会议主题'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>会议描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder='请输入会议描述（选填）'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>参会人数</Text>
          <View className={styles.attendeeRow}>
            <View
              className={styles.attendeeBtn}
              onClick={() => handleAttendeeChange(-1)}
            >
              <Text>−</Text>
            </View>
            <Text className={styles.attendeeCount}>{attendeeCount}</Text>
            <View
              className={styles.attendeeBtn}
              onClick={() => handleAttendeeChange(1)}
            >
              <Text>+</Text>
            </View>
            <Text style={{ color: '#86909c', fontSize: '26rpx' }}>人</Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>时间安排</Text>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>预约日期</Text>
          <Picker
            mode='date'
            value={date}
            start={getToday()}
            onChange={handleDateChange}
          >
            <View className={styles.datePicker}>
              <Text className={styles.dateText}>{formatDate(date)}</Text>
              <Text className={styles.selectArrow}>▼</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.timeRow}>
          <View className={`${styles.formItem} ${styles.timeItem}`}>
            <Text className={`${styles.formLabel} ${styles.required}`}>开始时间</Text>
            <Picker
              mode='selector'
              range={timeSlots}
              value={timeSlots.indexOf(startTime)}
              onChange={handleStartTimeChange}
            >
              <View className={styles.formSelect}>
                <Text className={styles.selectValue}>{startTime}</Text>
                <Text className={styles.selectArrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={`${styles.formItem} ${styles.timeItem}`}>
            <Text className={`${styles.formLabel} ${styles.required}`}>结束时间</Text>
            <Picker
              mode='selector'
              range={endTimeSlots}
              value={endTimeSlots.indexOf(endTime)}
              onChange={handleEndTimeChange}
            >
              <View className={styles.formSelect}>
                <Text className={styles.selectValue}>{endTime}</Text>
                <Text className={styles.selectArrow}>▼</Text>
              </View>
            </Picker>
          </View>
        </View>

        {hasConflict && (
          <View className={styles.conflictWarning}>
            ⚠️ 该时间段已被占用，请选择其他时间
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.cancelBtn} onClick={handleCancel}>
          <Text>取消</Text>
        </View>
        <View
          className={`${styles.submitBtn} ${!isFormValid ? styles.disabled : ''}`}
          onClick={handleSubmit}
        >
          <Text>{submitting ? '提交中...' : '提交预约'}</Text>
        </View>
      </View>
    </View>
  );
};

export default BookingFormPage;
