import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import type { BookingStatus, ApprovalStatus } from '@/types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/types';
import styles from './index.module.scss';

interface StatusBadgeProps {
  status: BookingStatus | ApprovalStatus;
  type?: 'booking' | 'approval';
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'booking',
  size = 'medium'
}) => {
  const labels = type === 'booking' ? BOOKING_STATUS_LABELS : APPROVAL_STATUS_LABELS;
  const colors = type === 'booking' ? BOOKING_STATUS_COLORS : APPROVAL_STATUS_COLORS;
  const label = labels[status] || status;
  const color = colors[status] || '#86909c';

  return (
    <View
      className={classNames(styles.badge, styles[size])}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`
      }}
    >
      <Text
        className={classNames(styles.text, styles[`text-${size}`])}
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
