import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import { useApprovalStore } from '@/store/useApprovalStore';
import {
  RULE_CONDITION_TYPE_LABELS,
  RULE_OPERATOR_LABELS,
  ROOM_LEVEL_LABELS
} from '@/types';
import type { RuleCondition } from '@/types';
import styles from './index.module.scss';

const RuleConfigPage: React.FC = () => {
  const { rules, flows, loading, fetchApprovals, toggleRuleEnabled, deleteRule } = useApprovalStore();

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  useDidShow(() => {
    fetchApprovals();
  });

  usePullDownRefresh(() => {
    fetchApprovals();
    Taro.stopPullDownRefresh();
  });

  const formatConditionValue = (condition: RuleCondition): string => {
    if (condition.type === 'room_level') {
      return ROOM_LEVEL_LABELS[condition.value as keyof typeof ROOM_LEVEL_LABELS] || String(condition.value);
    }
    if (condition.type === 'duration') {
      return `${condition.value}分钟`;
    }
    if (condition.type === 'attendee_count') {
      return `${condition.value}人`;
    }
    return String(condition.value);
  };

  const getFlowName = (flowId: string): string => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.name || '未知流程';
  };

  const handleToggle = (id: string) => {
    toggleRuleEnabled(id);
    Taro.showToast({
      title: '状态已更新',
      icon: 'success',
      duration: 1000
    });
  };

  const handleDelete = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除规则"${name}"吗？',
      success: (res) => {
        if (res.confirm) {
          deleteRule(id);
          Taro.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
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
          <Text className={styles.title}>审批规则</Text>
          <Text className={styles.subtitle}>配置条件路由规则，动态匹配审批流程</Text>
        </View>
      </View>

      <ScrollView scrollY showsVerticalScrollIndicator={false}>
        <View className={styles.ruleList}>
          {sortedRules.length > 0 ? (
            sortedRules.map(rule => (
              <View key={rule.id} className={styles.ruleCard}>
                <View className={styles.ruleHeader}>
                  <View style={{ flex: 1 }}>
                    <Text className={styles.ruleTitle}>
                      <Text className={styles.priorityBadge}>优先级 {rule.priority}</Text>
                      {rule.name}
                    </Text>
                  </View>
                  <View
                    className={classNames(styles.switch, {
                      [styles.switchActive]: rule.isEnabled
                    })}
                    onClick={() => handleToggle(rule.id)}
                  >
                    <View
                      className={classNames(styles.switchDot, {
                        [styles.switchDotActive]: rule.isEnabled
                      })}
                    />
                  </View>
                </View>

                {rule.description && (
                  <Text className={styles.ruleDescription}>{rule.description}</Text>
                )}

                <View className={styles.conditionsSection}>
                  <Text className={styles.conditionsTitle}>
                    触发条件
                    <Text className={styles.logicTag}>{rule.conditionLogic}</Text>
                  </Text>
                  {rule.conditions.map((cond, idx) => (
                    <View key={cond.id} className={styles.conditionItem}>
                      {idx > 0 && (
                        <Text className={styles.conditionOperator}>
                          {rule.conditionLogic}
                        </Text>
                      )}
                      <Text className={styles.conditionType}>
                        {RULE_CONDITION_TYPE_LABELS[cond.type]}
                      </Text>
                      <Text className={styles.conditionOperator}>
                        {RULE_OPERATOR_LABELS[cond.operator]}
                      </Text>
                      <Text className={styles.conditionValue}>
                        {formatConditionValue(cond)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className={styles.ruleFooter}>
                  <Text className={styles.flowInfo}>
                    匹配流程：
                    <Text className={styles.flowName}>
                      {getFlowName(rule.flowId)}
                    </Text>
                    {' '}
                    ({flows.find(f => f.id === rule.flowId)?.steps.length || 0}级审批
                  </Text>
                  <View className={styles.ruleActions}>
                    <View
                      className={classNames(styles.actionBtn, styles.actionBtnDanger)}
                      onClick={() => handleDelete(rule.id, rule.name)}
                    >
                      <Text className={styles.actionBtnText}>删除</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>⚙️</Text>
              <Text className={styles.emptyTitle}>暂无审批规则</Text>
              <Text className={styles.emptyText}>
                创建审批规则可以根据会议室级别、会议时长等条件自动匹配对应的审批流程
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default RuleConfigPage;
