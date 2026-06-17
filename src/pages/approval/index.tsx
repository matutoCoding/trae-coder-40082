import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useRoomStore } from '@/store/useRoomStore';
import { getApprovalProgress, findMatchingRule } from '@/utils/approvalUtils';
import { formatDateTime } from '@/utils/dateUtils';
import StatusBadge from '@/components/StatusBadge';
import ApprovalChain from '@/components/ApprovalChain';
import type { ApprovalRecord, ApprovalRouteRule, Booking } from '@/types';
import { APPROVAL_STATUS_LABELS, BOOKING_STATUS_LABELS } from '@/types';
import styles from './index.module.scss';

const ApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const { records, loading, fetchApprovals, processApproval, rules, currentUserId } = useApprovalStore();
  const { bookings, fetchBookings, getBookingById } = useBookingStore();
  const { rooms, fetchRooms, getRoomById } = useRoomStore();

  useDidShow(() => {
    loadData();
  });

  usePullDownRefresh(() => {
    loadData();
    Taro.stopPullDownRefresh();
  });

  const loadData = async () => {
    await Promise.all([fetchApprovals(), fetchBookings(), fetchRooms()]);
  };

  const pendingApprovals = useMemo(() =>
    records.filter(a => a.status === 'pending'),
    [records]
  );

  const historyApprovals = useMemo(() =>
    records.filter(a => a.status !== 'pending'),
    [records]
  );

  const displayedApprovals = activeTab === 'pending' ? pendingApprovals : historyApprovals;

  const stats = useMemo(() => ({
    pending: pendingApprovals.length,
    approved: records.filter(a => a.status === 'approved').length,
    rejected: records.filter(a => a.status === 'rejected').length
  }), [records, pendingApprovals]);

  const handleProcess = (approval: ApprovalRecord, action: 'approve' | 'reject') => {
    Taro.showModal({
      title: action === 'approve' ? '通过审批' : '拒绝审批',
      content: `确定要${action === 'approve' ? '通过' : '拒绝'}这条审批吗？`,
      success: (res) => {
        if (res.confirm) {
          processApproval(approval.id, action, action === 'approve' ? '同意' : '拒绝');
          Taro.showToast({
            title: action === 'approve' ? '已通过' : '已拒绝',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleViewDetail = (approval: ApprovalRecord) => {
    const booking = getBookingById(approval.bookingId);
    const room = booking ? getRoomById(booking.roomId) : null;
    const progress = getApprovalProgress(approval);
    const matchingRule = booking && room ? findMatchingRule(rules, booking, room) : null;

    const content = [
      `会议室：${room?.name || '未知'}`,
      `主题：${booking?.title || '未知'}`,
      `时间：${formatDateTime(booking?.startTime || '')} ~ ${formatDateTime(booking?.endTime || '')}`,
      `申请人：${approval.applicant?.name || '未知'}`,
      `部门：${approval.applicant?.department || '未知'}`,
      '',
      `匹配规则：${matchingRule?.name || '默认规则'}`,
      `审批进度：${progress.currentStep + 1}/${progress.totalSteps}`,
      '',
      ...approval.steps.map((s, i) =>
        `第${i + 1}级 ${s.role}：${s.status === 'approved' ? '✓ 通过' : s.status === 'rejected' ? '✗ 拒绝' : '⏳ 待审批'}`
      )
    ].join('\n');

    Taro.showModal({
      title: '审批详情',
      content,
      showCancel: false
    });
  };

  const handleRuleConfig = () => {
    Taro.navigateTo({
      url: '/pages/rule-config/index'
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
          <Text className={styles.title}>审批中心</Text>
          <Text className={styles.subtitle}>处理会议室预约审批</Text>
        </View>
        <View className={styles.configBtn} onClick={handleRuleConfig}>
          <Text className={styles.configBtnText}>规则配置</Text>
        </View>
      </View>

      <View className={styles.ruleConfigBtn} onClick={handleRuleConfig}>
        <Text className={styles.ruleConfigIcon}>⚙️</Text>
        <Text className={styles.ruleConfigText}>
          审批路由配置（{rules.length}条规则）
        </Text>
        <Text className={styles.ruleConfigArrow}>›</Text>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classNames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'pending'
          })}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabText}>待审批</Text>
          {pendingApprovals.length > 0 && (
            <View className={styles.badge}>
              <Text className={styles.badgeText}>{pendingApprovals.length}</Text>
            </View>
          )}
        </View>
        <View
          className={classNames(styles.tabItem, {
            [styles.tabItemActive]: activeTab === 'history'
          })}
          onClick={() => setActiveTab('history')}
        >
          <Text className={styles.tabText}>已处理</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValuePending)}>
            {stats.pending}
          </Text>
          <Text className={styles.statLabel}>待审批</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValueApproved)}>
            {stats.approved}
          </Text>
          <Text className={styles.statLabel}>已通过</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classNames(styles.statValue, styles.statValueRejected)}>
            {stats.rejected}
          </Text>
          <Text className={styles.statLabel}>已拒绝</Text>
        </View>
      </View>

      <ScrollView scrollY showsVerticalScrollIndicator={false}>
        {displayedApprovals.length > 0 ? (
          displayedApprovals.map(approval => {
            const booking = getBookingById(approval.bookingId);
            const room = booking ? getRoomById(booking.roomId) : null;
            const progress = getApprovalProgress(approval);
            const matchingRule = booking && room ? findMatchingRule(rules, booking, room) : null;

            return (
              <View key={approval.id} className={styles.approvalCard}>
                <View className={styles.cardHeader}>
                  <Text className={styles.cardTitle} numberOfLines={1}>
                    {booking?.title || '未知会议'}
                  </Text>
                  <StatusBadge
                    status={approval.status}
                    type="approval"
                    size="small"
                  />
                </View>

                <View className={styles.cardMeta}>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>🏢</Text>
                    <Text numberOfLines={1}>{room?.name || '未知会议室'}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>📅</Text>
                    <Text>{formatDateTime(booking?.startTime || '')}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>👥</Text>
                    <Text>{booking?.attendeeCount || 0}人</Text>
                  </View>
                </View>

                <View className={styles.applicantInfo}>
                  <View className={styles.avatar}>
                    <Text className={styles.avatarText}>
                      {(approval.applicant?.name || 'U').charAt(0)}
                    </Text>
                  </View>
                  <View className={styles.applicantDetail}>
                    <Text className={styles.applicantName}>
                      {approval.applicant?.name || '未知'}
                    </Text>
                    <Text className={styles.applicantDept}>
                      {approval.applicant?.department || '未知'}
                    </Text>
                  </View>
                  <Text className={styles.applyTime}>
                    {formatDateTime(approval.createdAt)}
                  </Text>
                </View>

                <ApprovalChain approval={approval} compact />

                {matchingRule && (
                  <View className={styles.progressSection}>
                    <Text className={styles.progressTitle}>
                      匹配规则：{matchingRule.name}
                    </Text>
                    <View className={styles.progressBar}>
                      <View
                        className={styles.progressFill}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </View>
                    <Text className={styles.progressText}>
                      进度 {progress.currentStep + 1}/{progress.totalSteps} · {progress.percentage}%
                    </Text>
                  </View>
                )}

                {approval.status === 'pending' && (
                  <View className={styles.actionButtons}>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnReject)}
                      onClick={() => handleProcess(approval, 'reject')}
                    >
                      <Text className={styles.actionBtnText}>拒绝</Text>
                    </View>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnApprove)}
                      onClick={() => handleProcess(approval, 'approve')}
                    >
                      <Text className={styles.actionBtnText}>通过</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyTitle}>
              {activeTab === 'pending' ? '暂无待审批申请' : '暂无已处理记录'}
            </Text>
            <Text className={styles.emptyText}>
              {activeTab === 'pending'
                ? '新的审批申请会显示在这里'
                : '已处理的审批会记录在这里'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ApprovalPage;
