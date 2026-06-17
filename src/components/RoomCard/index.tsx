import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import type { Room } from '@/types';
import { ROOM_LEVEL_LABELS, ROOM_LEVEL_COLORS } from '@/types';
import styles from './index.module.scss';

interface RoomCardProps {
  room: Room;
  showActions?: boolean;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, showActions = true, onClick }) => {
  const levelColor = ROOM_LEVEL_COLORS[room.level];
  const levelLabel = ROOM_LEVEL_LABELS[room.level];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/room-detail/index?id=${room.id}`
      });
    }
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/booking-form/index?roomId=${room.id}`
    });
  };

  return (
    <View className={styles.roomCard} onClick={handleClick}>
      {room.imageUrl && (
        <View className={styles.imageWrapper}>
          <Image
            className={styles.roomImage}
            src={room.imageUrl}
            mode='aspectFill'
          />
          <View
            className={styles.levelBadge}
            style={{ backgroundColor: levelColor }}
          >
            <Text className={styles.levelText}>{levelLabel}</Text>
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.roomName}>{room.name}</Text>
          <View className={styles.capacityBadge}>
            <Text className={styles.capacityText}>{room.capacity}人</Text>
          </View>
        </View>

        <View className={styles.location}>
          <Text className={styles.locationText}>📍 {room.location}</Text>
        </View>

        <View className={styles.equipments}>
          {room.equipments.slice(0, 4).map((eq) => (
            <View key={eq.id} className={styles.equipmentTag}>
              <Text className={styles.equipmentText}>{eq.name}</Text>
            </View>
          ))}
          {room.equipments.length > 4 && (
            <View className={styles.equipmentTag}>
              <Text className={styles.equipmentText}>+{room.equipments.length - 4}</Text>
            </View>
          )}
        </View>

        {showActions && (
          <View className={styles.actions}>
            {room.approvalRequired ? (
              <View className={styles.approvalInfo}>
                <Text className={styles.approvalText}>需要{room.approvalLevel}级审批</Text>
              </View>
            ) : (
              <View className={styles.freeInfo}>
                <Text className={styles.freeText}>免审批</Text>
              </View>
            )}
            <View
              className={classNames(styles.bookBtn, {
                [styles.bookBtnDisabled]: !room.isActive
              })}
              onClick={handleBook}
            >
              <Text className={styles.bookBtnText}>预约</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default RoomCard;
