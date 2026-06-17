import type { Room } from '@/types';

export const mockRooms: Room[] = [
  {
    id: 'room_001',
    name: '董事会议室',
    level: 'vip',
    capacity: 30,
    location: 'A座28层-2801',
    description: '高端董事会议室，配备顶级会议设备，适合重要客户接待和董事会会议',
    equipments: [
      { id: 'eq_1', name: '投影仪' },
      { id: 'eq_2', name: '视频会议系统' },
      { id: 'eq_3', name: '电子白板' },
      { id: 'eq_4', name: '音响系统' },
      { id: 'eq_5', name: '茶水服务' }
    ],
    imageUrl: 'https://picsum.photos/id/1082/750/400',
    approvalRequired: true,
    approvalLevel: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_002',
    name: '阳光会议室',
    level: 'standard',
    capacity: 15,
    location: 'A座15层-1502',
    description: '采光良好的中型会议室，适合部门例会和项目讨论',
    equipments: [
      { id: 'eq_1', name: '投影仪' },
      { id: 'eq_2', name: '视频会议系统' },
      { id: 'eq_3', name: '电子白板' }
    ],
    imageUrl: 'https://picsum.photos/id/3/750/400',
    approvalRequired: true,
    approvalLevel: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_003',
    name: '创新会议室',
    level: 'standard',
    capacity: 12,
    location: 'B座8层-805',
    description: '现代化设计，激发创意灵感，适合头脑风暴和创意讨论',
    equipments: [
      { id: 'eq_1', name: '投影仪' },
      { id: 'eq_3', name: '电子白板' },
      { id: 'eq_6', name: '可移动桌椅' }
    ],
    imageUrl: 'https://picsum.photos/id/1/750/400',
    approvalRequired: true,
    approvalLevel: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_004',
    name: '协作空间A',
    level: 'basic',
    capacity: 6,
    location: 'A座10层-1001',
    description: '小型团队协作空间，适合小组讨论和快速沟通',
    equipments: [
      { id: 'eq_1', name: '电视显示器' },
      { id: 'eq_3', name: '白板' }
    ],
    imageUrl: 'https://picsum.photos/id/2/750/400',
    approvalRequired: false,
    approvalLevel: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_005',
    name: '协作空间B',
    level: 'basic',
    capacity: 6,
    location: 'A座10层-1002',
    description: '小型团队协作空间，适合小组讨论和快速沟通',
    equipments: [
      { id: 'eq_1', name: '电视显示器' },
      { id: 'eq_3', name: '白板' }
    ],
    imageUrl: 'https://picsum.photos/id/6/750/400',
    approvalRequired: false,
    approvalLevel: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_006',
    name: '培训室',
    level: 'standard',
    capacity: 50,
    location: 'C座3层-301',
    description: '大型培训会议室，可容纳50人，配备专业培训设备',
    equipments: [
      { id: 'eq_1', name: '投影仪' },
      { id: 'eq_2', name: '音响系统' },
      { id: 'eq_3', name: '麦克风' },
      { id: 'eq_7', name: '录播系统' }
    ],
    imageUrl: 'https://picsum.photos/id/160/750/400',
    approvalRequired: true,
    approvalLevel: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_007',
    name: '洽谈室',
    level: 'vip',
    capacity: 8,
    location: 'A座28层-2802',
    description: '私密洽谈空间，适合商务洽谈和重要会面',
    equipments: [
      { id: 'eq_1', name: '电视显示器' },
      { id: 'eq_5', name: '茶水服务' },
      { id: 'eq_8', name: '隔音设备' }
    ],
    imageUrl: 'https://picsum.photos/id/201/750/400',
    approvalRequired: true,
    approvalLevel: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'room_008',
    name: '快速会议室',
    level: 'basic',
    capacity: 4,
    location: 'B座5层-503',
    description: '快速会议站，适合15分钟以内的简短沟通',
    equipments: [
      { id: 'eq_1', name: '电视显示器' }
    ],
    imageUrl: 'https://picsum.photos/id/119/750/400',
    approvalRequired: false,
    approvalLevel: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];
