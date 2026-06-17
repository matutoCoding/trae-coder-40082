import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useRecurrenceStore } from '@/store/useRecurrenceStore';
import { useRoomStore } from '@/store/useRoomStore';
import { generateRecurrenceDescription, getExceptionSummary } from '@/utils/recurrenceUtils';
import { formatDate } from '@/utils/dateUtils';
import type { RecurrenceRule } from '@/types';
import { RECURRENCE_FREQUENCY_LABELS, WEEKDAY_LABELS } from '@/types';
import styles from './index.module.scss';

const RecurrencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const { recurrences, loading, fetchRecurrences, toggleRecurrenceActive, generateBookings } = useRecurrenceStore();
  const { rooms, fetchRooms, getRoomById } = useRoomStore();

  useDidShow(() => {
    loadData();
  });

  usePullDownRefresh(() => {
    loadData();
    Taro.stopPullDownRefresh();
  });

  const loadData = async () => {
    await Promise.all([fetchRecurrences(), fetchRooms()]);
  };

  const filteredRecurrences = useMemo(() => {
    return recurrences.filter(r =>
      activeTab === 'active' ? r.isActive : !r.isActive
    );
  }, [recurrences, activeTab]);

  const stats = useMemo(() => ({
    active: recurrences.filter(r => r.isActive).length,
    totalGenerated: recurrences.reduce((sum, r) => sum + r.generatedCount, 0)
  }), [recurrences]);

  const handleAdd = () => {
    Taro.navigateTo({
      url: '/pages/recurrence-edit/index'
    });
  };

  const handleEdit = (rule: RecurrenceRule) => {
    Taro.navigateTo({
      url: `/pages/recurrence-edit/index?id=${rule.id}`
    });
  };

  const handleToggle = (id: string) => {
    toggleRecurrenceActive(id);
  };

  const handleGenerate = (rule: RecurrenceRule) => {
    Taro.showModal({
      title: '批量生成预约',
      content: `确定要为"${rule.name}"生成未来预约吗？`,
      success: (res) => {
        if (res.confirm) {
          const count = generateBookings(rule.id);
          Taro.showToast({
            title: `成功生成${count}条预约`,
            icon: 'success'
          });
        }
      }
    });
  };

  const handleViewExceptions = (rule: RecurrenceRule) => {
    if (rule.exceptions.length === 0) {
      Taro.showToast({
        title: '暂无例外调整',
        icon: 'none'
      });
      return;
    }
    const exceptionText = rule.exceptions.map(e =>
      `${formatDate(e.date)} - ${e.action === 'skip' ? '跳过' : '调整'}${e.reason ? `: ${e.reason}` : ''}`
    ).join('\n');
    Taro.showModal({
      title: '例外调整列表',
      content: exceptionText,
      showCancel: false
    });
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
          <Text className={styles.title}>周期生成</Text>
          <Text className={styles.subtitle}>管理固定周期的会议预约规则</Text>
        </View>
        <View className={styles.addBtn} onClick={handleAdd}>
          <Text className={styles.addBtnText}>+ 新建</Text>
        </View>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classNames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'active'
          })}
          onClick={() => setActiveTab('active')}
        >
          <Text className={styles.tabText}>进行中 ({stats.active})</Text>
        </View>
        <View
          className={classNames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'inactive'
          })}
          onClick={() => setActiveTab('inactive')}
        >
          <Text className={styles.tabText}>已停止 ({recurrences.length - stats.active})</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.active}</Text>
          <Text className={styles.statLabel}>活跃规则</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalGenerated}</Text>
          <Text className={styles.statLabel}>已生成预约</Text>
        </View>
      </View>

      <ScrollView scrollY showsVerticalScrollIndicator={false}>
        {filteredRecurrences.length > 0 ? (
          filteredRecurrences.map(rule => {
            const room = getRoomById(rule.roomId);
            const description = generateRecurrenceDescription(rule);
            const exceptionSummary = getExceptionSummary(rule.exceptions);

            return (
              <View key={rule.id} className={styles.ruleCard}>
                <View className={styles.ruleHeader}>
                  <Text className={styles.ruleTitle}>{rule.name}</Text>
                  <View
                    className={classNames(styles.switch, {
                      [styles.switchActive]: rule.isActive
                    })}
                    onClick={() => handleToggle(rule.id)}
                  >
                    <View
                      className={classNames(styles.switchDot, {
                        [styles.switchDotActive]: rule.isActive
                      })}
                    />
                  </View>
                </View>

                <View className={styles.ruleMeta}>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>🏢</Text>
                    <Text>{room?.name || '未知会议室'}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>👥</Text>
                    <Text>{rule.attendeeCount}人</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>📅</Text>
                    <Text>{description}</Text>
                  </View>
                </View>

                {rule.description && (
                  <Text className={styles.ruleDescription}>{rule.description}</Text>
                )}

                {rule.exceptions.length > 0 && (
                  <View className={styles.exceptionInfo} onClick={() => handleViewExceptions(rule)}>
                    <Text className={styles.exceptionIcon}>⚠️</Text>
                    <Text className={styles.exceptionText}>{exceptionSummary}</Text>
                  </View>
                )}

                <View className={styles.ruleFooter}>
                  <Text className={styles.ruleDates}>
                    {formatDate(rule.startDate)} ~ {formatDate(rule.endDate)}
                    {rule.generatedCount > 0 && ` · 已生成${rule.generatedCount}条`}
                  </Text>
                  <View className={styles.ruleActions}>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnSecondary)}
                      onClick={() => handleViewExceptions(rule)}
                    >
                      <Text className={styles.actionBtnText}>例外</Text>
                    </View>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnSecondary)}
                      onClick={() => handleGenerate(rule)}
                    >
                      <Text className={styles.actionBtnText}>生成</Text>
                    </View>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnPrimary)}
                      onClick={() => handleEdit(rule)}
                    >
                      <Text className={styles.actionBtnText}>编辑</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🔄</Text>
            <Text className={styles.emptyTitle}>
              {activeTab === 'active' ? '暂无活跃的周期规则' : '暂无已停止的周期规则'}
            </Text>
            <Text className={styles.emptyText}>
              {activeTab === 'active'
                ? '创建周期规则可以自动批量生成未来的会议室预约'
                : '停止的周期规则不会生成新的预约'}
            </Text>
            {activeTab === 'active' && (
              <View className={styles.emptyBtn} onClick={handleAdd}>
                <Text className={styles.emptyBtnText}>创建周期规则</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RecurrencePage;
