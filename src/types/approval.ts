export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'transferred';

export type RuleConditionType = 'room_level' | 'duration' | 'attendee_count' | 'booking_type';

export type RuleOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

export interface RuleCondition {
  id: string;
  type: RuleConditionType;
  operator: RuleOperator;
  value: string | number | string[];
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  status: ApprovalStatus;
  comment?: string;
  approvedAt?: string;
}

export interface ApprovalFlow {
  id: string;
  name: string;
  description?: string;
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRouteRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  flowId: string;
  flow?: ApprovalFlow;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRecord {
  id: string;
  bookingId: string;
  ruleId: string;
  rule?: ApprovalRouteRule;
  flowId: string;
  flow?: ApprovalFlow;
  currentStep: number;
  steps: ApprovalStep[];
  status: ApprovalStatus;
  finalComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalActionData {
  recordId: string;
  stepId: string;
  action: 'approve' | 'reject' | 'transfer';
  comment?: string;
  transferTo?: string;
  transferToName?: string;
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  transferred: '已转交'
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: '#ff7d00',
  approved: '#00b42a',
  rejected: '#f53f3f',
  transferred: '#722ed1'
};

export const RULE_CONDITION_TYPE_LABELS: Record<RuleConditionType, string> = {
  room_level: '会议室级别',
  duration: '会议时长',
  attendee_count: '参会人数',
  booking_type: '预约类型'
};

export const RULE_OPERATOR_LABELS: Record<RuleOperator, string> = {
  eq: '等于',
  ne: '不等于',
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  in: '包含',
  not_in: '不包含'
};
