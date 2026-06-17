import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import { useRecurrenceStore } from '@/store/useRecurrenceStore';
import { useRoomStore } from '@/store/useRoomStore';
import { formatDate, getToday, addMonths } from '@/utils/dateUtils';
import { generateRecurrenceDescription, generateRecurrenceDates } from '@/utils/recurrenceUtils';
import {
  RECURRENCE_FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  ROOM_LEVEL_LABELS,
  type RecurrenceFrequency,
  type Weekday,
  type RecurrenceFormData
} from '@/types';
import styles from './index.module.scss';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const frequencies: RecurrenceFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
const allWeekdays: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const RecurrenceEditPage: React.FC = () => {
  const router = useRouter();
  const ruleId = router.params.id as string;
  const { createRecurrence, updateRecurrence, getRecurrenceById, fetchRecurrences } = useRecurrenceStore();
  const { rooms, fetchRooms, getRoomById } = useRoomStore();

  const existingRule = ruleId ? getRecurrenceById(ruleId) : null;

  const [name, setName] = useState(existingRule?.name || '');
  const [description, setDescription] = useState(existingRule?.description || '');
  const [roomId, setRoomId] = useState(existingRule?.roomId || rooms[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(existingRule?.frequency || 'weekly');
  const [weekdays, setWeekdays] = useState<Weekday[]>(existingRule?.weekdays || [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(existingRule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingRule?.endTime || '10:00');
  const [startDate, setStartDate] = useState(existingRule?.startDate || getToday());
  const [endDate, setEndDate] = useState(existingRule?.endDate || addMonths(getToday(), 3));
  const [attendeeCount, setAttendeeCount] = useState(existingRule?.attendeeCount || 8);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDidShow(() => {
    Promise.all([fetchRecurrences(), fetchRooms()]);
  });

  const previewData = useMemo(() => {
    if (!roomId || weekdays.length === 0 || !startTime || !endTime || startTime >= endTime) {
      return null;
    }
    const tempRule = {
      id: 'temp',
      name,
      roomId,
      title: name,
      frequency,
      weekdays,
      startTime,
      endTime,
      startDate,
      endDate,
      exceptions: [],
      attendeeCount,
      organizerId: 'user_001',
      organizerName: '张明',
      organizerDept: '产品部',
      generatedCount: 0,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    };
    const dates = generateRecurrenceDates(tempRule);
    const description = generateRecurrenceDescription(tempRule);
    return { dates, description, count: dates.length };
  }, [name, roomId, frequency, weekdays, startTime, endTime, startDate, endDate, attendeeCount]);

  const room = roomId ? getRoomById(roomId) : null;
  const roomNames = rooms.map(r => r.name);
  const startIndex = timeSlots.indexOf(startTime);
  const endTimeSlots = startIndex >= 0 ? timeSlots.slice(startIndex + 1) : timeSlots;

  const isFormValid = useMemo(() => {
    return name.trim().length > 0 &&
      roomId &&
      weekdays.length > 0 &&
      startTime &&
      endTime &&
      startTime < endTime &&
      startDate &&
      endDate &&
      startDate <= endDate &&
      attendeeCount > 0 &&
      !submitting;
  }, [name, roomId, weekdays, startTime, endTime, startDate, endDate, attendeeCount, submitting]);

  const toggleWeekday = (day: Weekday) => {
    setWeekdays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day) as Weekday[];
      } else {
        return [...prev, day].sort() as Weekday[];
      }
    });
  };

  const handleAttendeeChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(100, attendeeCount + delta));
    setAttendeeCount(newCount);
  };

  const handleStartTimeChange = (e: any) => {
    const newStartTime = timeSlots[e.detail.value];
    setStartTime(newStartTime);
    if (newStartTime >= endTime) {
      const nextIndex = Math.min(timeSlots.indexOf(newStartTime) + 1, timeSlots.length - 1);
      setEndTime(timeSlots[nextIndex]);
    }
  };

  const handleEndTimeChange = (e: any) => {
    setEndTime(endTimeSlots[e.detail.value]);
  };

  const handleRoomChange = (e: any) => {
    setRoomId(rooms[e.detail.value].id);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setSubmitting(true);
    setError('');

    try {
      const formData: RecurrenceFormData = {
        name: name.trim(),
        description: description.trim() || undefined,
        roomId,
        title: name.trim(),
        frequency,
        weekdays,
        startTime,
        endTime,
        startDate,
        endDate,
        attendeeCount
      };

      if (existingRule) {
        updateRecurrence(ruleId, formData);
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        createRecurrence(formData, 'user_001', '张明', '产品部');
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        });
      }

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (err: any) {
      console.error('[RecurrenceEdit] 提交失败:', err);
      setError(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className={styles.container}>
      {error && (
        <View className={styles.errorMsg}>{error}</View>
      )}

      {previewData && (
        <View className={styles.previewSection}>
          <Text className={styles.previewTitle}>📅 规则预览</Text>
          <Text className={styles.previewText}>
            {previewData.description}{'\n'}
            预计将生成 {previewData.count} 条预约记录
          </Text>
        </View>
      )}

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>规则名称</Text>
          <Input
            className={styles.formInput}
            placeholder='例如：产品部周例会'
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>规则描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder='请输入规则描述（选填）'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>会议室</Text>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>选择会议室</Text>
          <Picker
            mode='selector'
            range={roomNames}
            value={rooms.findIndex(r => r.id === roomId)}
            onChange={handleRoomChange}
          >
            <View className={styles.formSelect}>
              {room ? (
                <View className={styles.roomInfo}>
                  <Text className={styles.roomIcon}>🏢</Text>
                  <View className={styles.roomDetail}>
                    <Text className={styles.roomName}>{room.name}</Text>
                    <Text className={styles.roomMeta}>
                      {ROOM_LEVEL_LABELS[room.level]} · {room.location} · 容纳{room.capacity}人
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className={styles.selectPlaceholder}>请选择会议室</Text>
              )}
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>周期设置</Text>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>重复频率</Text>
          <View className={styles.frequencyRow}>
            {frequencies.map(freq => (
              <View
                key={freq}
                className={classNames(styles.frequencyItem, {
                  [styles.frequencyItemActive]: frequency === freq
                })}
                onClick={() => setFrequency(freq)}
              >
                <Text>{RECURRENCE_FREQUENCY_LABELS[freq]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={`${styles.formLabel} ${styles.required}`}>每周</Text>
          <Text className={styles.weekdayLabel}>选择要重复的星期</Text>
          <View className={styles.weekdayRow}>
            {allWeekdays.map(day => (
              <View
                key={day}
                className={classNames(styles.weekdayItem, {
                  [styles.weekdayItemActive]: weekdays.includes(day)
                })}
                onClick={() => toggleWeekday(day)}
              >
                <Text>{WEEKDAY_LABELS[day].replace('周', '')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.dateRow}>
          <View className={`${styles.formItem} ${styles.dateItem}`}>
            <Text className={`${styles.formLabel} ${styles.required}`}>开始日期</Text>
            <Picker
              mode='date'
              value={startDate}
              start={getToday()}
              onChange={(e) => setStartDate(e.detail.value)}
            >
              <View className={styles.formSelect}>
                <Text className={styles.selectValue}>{formatDate(startDate)}</Text>
                <Text className={styles.selectArrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <Text className={styles.dateSeparator}>至</Text>

          <View className={`${styles.formItem} ${styles.dateItem}`}>
            <Text className={`${styles.formLabel} ${styles.required}`}>结束日期</Text>
            <Picker
              mode='date'
              value={endDate}
              start={startDate}
              onChange={(e) => setEndDate(e.detail.value)}
            >
              <View className={styles.formSelect}>
                <Text className={styles.selectValue}>{formatDate(endDate)}</Text>
                <Text className={styles.selectArrow}>▼</Text>
              </View>
            </Picker>
          </View>
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

      <View className={styles.footer}>
        <View className={styles.cancelBtn} onClick={handleCancel}>
          <Text>取消</Text>
        </View>
        <View
          className={`${styles.submitBtn} ${!isFormValid ? styles.disabled : ''}`}
          onClick={handleSubmit}
        >
          <Text>{submitting ? '保存中...' : existingRule ? '保存修改' : '创建规则'}</Text>
        </View>
      </View>
    </View>
  );
};

export default RecurrenceEditPage;
