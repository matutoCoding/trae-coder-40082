import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import type { ApprovalStep, ApprovalStatus, ApprovalRecord } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import styles from './index.module.scss';

interface ApprovalChainProps {
  steps?: ApprovalStep[];
  currentStep?: number;
  showDetails?: boolean;
  approval?: ApprovalRecord;
  compact?: boolean;
}

const stepStatusIcon: Record<ApprovalStatus, string> = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
  transferred: '🔄'
};

const ApprovalChain: React.FC<ApprovalChainProps> = (props) => {
  let steps: ApprovalStep[];
  let currentStep: number;
  let showDetails: boolean;
  let compact: boolean;

  if (props.approval) {
    steps = props.approval.steps;
    currentStep = props.approval.currentStep;
    showDetails = props.showDetails ?? true;
    compact = props.compact ?? false;
  } else {
    steps = props.steps || [];
    currentStep = props.currentStep || 0;
    showDetails = props.showDetails ?? true;
    compact = props.compact ?? false;
  }
  return (
    <View className={styles.chainContainer}>
      <Text className={styles.title}>审批流程</Text>

      <View className={styles.steps}>
        {steps.map((step, index) => {
          const isCompleted = step.status !== 'pending';
          const isCurrent = index === currentStep && step.status === 'pending';
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} className={styles.stepWrapper}>
              <View className={styles.stepLine}>
                {!isLast && (
                  <View
                    className={classNames(styles.line, {
                      [styles.lineCompleted]: isCompleted
                    })}
                  />
                )}
              </View>

              <View className={styles.stepContent}>
                <View
                  className={classNames(styles.stepNode, {
                    [styles.nodeCompleted]: isCompleted,
                    [styles.nodeCurrent]: isCurrent,
                    [styles.nodeRejected]: step.status === 'rejected'
                  })}
                >
                  <Text className={styles.stepIcon}>
                    {stepStatusIcon[step.status]}
                  </Text>
                </View>

                <View className={styles.stepInfo}>
                  <View className={styles.stepHeader}>
                    <Text
                      className={classNames(styles.stepRole, {
                        [styles.textCompleted]: isCompleted,
                        [styles.textCurrent]: isCurrent
                      })}
                    >
                      {step.approverRole}
                    </Text>
                    {step.approverName && (
                      <Text className={styles.stepApprover}>
                        {step.approverName}
                      </Text>
                    )}
                  </View>

                  {showDetails && isCompleted && (
                    <View className={styles.stepDetails}>
                      {step.comment && (
                        <Text className={styles.stepComment}>
                          「{step.comment}」
                        </Text>
                      )}
                      {step.approvedAt && (
                        <Text className={styles.stepTime}>
                          {formatDateTime(step.approvedAt)}
                        </Text>
                      )}
                    </View>
                  )}

                  {isCurrent && (
                    <View className={styles.currentBadge}>
                      <Text className={styles.currentBadgeText}>待审批</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ApprovalChain;
