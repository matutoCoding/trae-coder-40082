export type RoomLevel = 'vip' | 'standard' | 'basic';

export interface RoomEquipment {
  id: string;
  name: string;
  icon?: string;
}

export interface Room {
  id: string;
  name: string;
  level: RoomLevel;
  capacity: number;
  location: string;
  description?: string;
  equipments: RoomEquipment[];
  imageUrl?: string;
  approvalRequired: boolean;
  approvalLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTimeSlot {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'free' | 'occupied' | 'pending';
  bookingId?: string;
}

export const ROOM_LEVEL_LABELS: Record<RoomLevel, string> = {
  vip: 'VIP会议室',
  standard: '标准会议室',
  basic: '基础会议室'
};

export const ROOM_LEVEL_COLORS: Record<RoomLevel, string> = {
  vip: '#722ed1',
  standard: '#165dff',
  basic: '#86909c'
};
