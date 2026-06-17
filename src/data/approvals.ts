import type { ApprovalRouteRule, ApprovalRecord, ApprovalFlow } from '@/types';

export const mockApprovalFlows: ApprovalFlow[] = [
  {
    id: 'flow_001',
    name: '一级审批流程',
    description: '部门主管审批即可',
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_001',
        approverName: '张明',
        status: 'pending'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'flow_002',
    name: '二级审批流程',
    description: '部门主管 + 行政经理审批',
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_005',
        approverName: '李华',
        status: 'pending'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'pending'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'flow_003',
    name: '三级审批流程',
    description: '部门主管 + 行政经理 + 分管领导审批',
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_005',
        approverName: '李华',
        status: 'pending'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'pending'
      },
      {
        id: 'step_003',
        stepNumber: 3,
        approverRole: '分管领导',
        approverId: 'user_010',
        approverName: '王总',
        status: 'pending'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockApprovalRules: ApprovalRouteRule[] = [
  {
    id: 'rule_001',
    name: 'VIP会议室审批',
    description: 'VIP级别会议室需要三级审批',
    priority: 1,
    conditions: [
      {
        id: 'cond_001',
        type: 'room_level',
        operator: 'eq',
        value: 'vip'
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_003',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'rule_002',
    name: '长时间会议审批',
    description: '会议时长超过2小时需要二级审批',
    priority: 2,
    conditions: [
      {
        id: 'cond_002',
        type: 'duration',
        operator: 'gt',
        value: 120
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_002',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'rule_003',
    name: '大型会议审批',
    description: '参会人数超过20人需要二级审批',
    priority: 3,
    conditions: [
      {
        id: 'cond_003',
        type: 'attendee_count',
        operator: 'gt',
        value: 20
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_002',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'rule_004',
    name: '周期预约审批',
    description: '周期预约需要二级审批',
    priority: 4,
    conditions: [
      {
        id: 'cond_004',
        type: 'booking_type',
        operator: 'eq',
        value: 'recurrence'
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_002',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'rule_005',
    name: '标准会议室默认',
    description: '标准会议室默认一级审批',
    priority: 10,
    conditions: [
      {
        id: 'cond_005',
        type: 'room_level',
        operator: 'eq',
        value: 'standard'
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_001',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'rule_006',
    name: '基础会议室免审批',
    description: '基础会议室无需审批',
    priority: 11,
    conditions: [
      {
        id: 'cond_006',
        type: 'room_level',
        operator: 'eq',
        value: 'basic'
      }
    ],
    conditionLogic: 'AND',
    flowId: 'flow_001',
    isEnabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

export const mockApprovalRecords: ApprovalRecord[] = [
  {
    id: 'approval_001',
    bookingId: 'booking_002',
    ruleId: 'rule_002',
    flowId: 'flow_002',
    currentStep: 0,
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_005',
        approverName: '李华',
        status: 'pending'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'pending'
      }
    ],
    status: 'pending',
    createdAt: '2024-06-10T14:00:00.000Z',
    updatedAt: '2024-06-10T14:00:00.000Z'
  },
  {
    id: 'approval_002',
    bookingId: 'booking_005',
    ruleId: 'rule_003',
    flowId: 'flow_002',
    currentStep: 1,
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_005',
        approverName: '李华',
        status: 'approved',
        comment: '同意，培训很重要',
        approvedAt: '2024-06-09T11:00:00.000Z'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'pending'
      }
    ],
    status: 'pending',
    createdAt: '2024-06-08T09:00:00.000Z',
    updatedAt: '2024-06-09T11:00:00.000Z'
  },
  {
    id: 'approval_003',
    bookingId: 'booking_007',
    ruleId: 'rule_001',
    flowId: 'flow_003',
    currentStep: 1,
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_015',
        approverName: '孙总监',
        status: 'approved',
        comment: '重要客户，请务必安排好',
        approvedAt: '2024-06-11T16:00:00.000Z'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'pending'
      },
      {
        id: 'step_003',
        stepNumber: 3,
        approverRole: '分管领导',
        approverId: 'user_010',
        approverName: '王总',
        status: 'pending'
      }
    ],
    status: 'pending',
    createdAt: '2024-06-11T14:00:00.000Z',
    updatedAt: '2024-06-11T16:00:00.000Z'
  },
  {
    id: 'approval_004',
    bookingId: 'booking_010',
    ruleId: 'rule_005',
    flowId: 'flow_001',
    currentStep: 1,
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_005',
        approverName: '李华',
        status: 'rejected',
        comment: '该时段已有重要安排，请调整时间',
        approvedAt: '2024-06-11T17:00:00.000Z'
      }
    ],
    status: 'rejected',
    createdAt: '2024-06-11T15:00:00.000Z',
    updatedAt: '2024-06-11T17:00:00.000Z'
  },
  {
    id: 'approval_005',
    bookingId: 'booking_003',
    ruleId: 'rule_001',
    flowId: 'flow_003',
    currentStep: 3,
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        approverRole: '部门主管',
        approverId: 'user_010',
        approverName: '王总',
        status: 'approved',
        comment: '请各部门准备好汇报材料',
        approvedAt: '2024-06-05T15:00:00.000Z'
      },
      {
        id: 'step_002',
        stepNumber: 2,
        approverRole: '行政经理',
        approverId: 'user_020',
        approverName: '陈经理',
        status: 'approved',
        comment: '已安排好会场布置和茶水服务',
        approvedAt: '2024-06-06T09:00:00.000Z'
      },
      {
        id: 'step_003',
        stepNumber: 3,
        approverRole: '分管领导',
        approverId: 'user_010',
        approverName: '王总',
        status: 'approved',
        comment: '同意',
        approvedAt: '2024-06-06T15:00:00.000Z'
      }
    ],
    status: 'approved',
    createdAt: '2024-06-05T10:00:00.000Z',
    updatedAt: '2024-06-06T15:00:00.000Z'
  }
];
